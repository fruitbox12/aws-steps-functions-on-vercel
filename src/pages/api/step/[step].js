import {
    executeHttpNode,
    getWorkflowState,
    setWorkflowNodeState,
    getWorkflowNodeState,
    setWorkflowState,
    webhookHttpNode,
    executeDiscordNode,
    executeNodeJs
} from '../../../utils'; // Ensure utility functions are correctly implemented
import { replaceTemplateVariables, replaceTemplateBody } from '../../../utils/templateUtils'; // Assumed correct implementation
import NextCors from 'nextjs-cors';
import { MongoClient } from 'mongodb';

export default async (req, res) => {
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200,
    });

    const { step, stepEnd, nodes, edges, shortId, tenantId, trigger_output = {} } = req.body;
    const stepIndex = parseInt(step, 10);
    const stepEndIndex = parseInt(stepEnd, 10);

    if (!nodes) {
        return res.status(400).json({ error: "Nodes array is missing in the request body" });
    }

    if (stepIndex < 0 || stepIndex >= nodes.length) {
        return res.status(400).json({ error: "Invalid step index." });
    }

    try {
        let workflowState = await getWorkflowState(shortId) || { nodeStates: {}, edges };

        const currentNode = nodes[stepIndex];
        const dependencies = edges.filter(edge => edge.target === currentNode.id);
        const dependenciesCompleted = dependencies.every(edge => {
            const sourceState = workflowState.nodeStates[edge.source];
            return sourceState && sourceState.completed;
        });

        if (!dependenciesCompleted) {
            res.writeHead(307, { Location: `/api/path?step=${stepIndex}&stepEnd=${stepEnd}` });
            return res.end();
        }

        // Prepare node parameters by resolving dependencies
        let previousOutputs = {};
        if (dependencies.length > 0) {
            previousOutputs = dependencies.reduce((acc, dep) => ({
                ...acc,
                [dep.source]: workflowState.nodeStates[dep.source].result
            }), {});
        }

        // Replace template variables and bodies with actual values from previous outputs
        const replacedVariables = replaceTemplateVariables(currentNode.data.inputParameters, previousOutputs);
        const replacedBody = replaceTemplateBody(currentNode.data.inputParameters.body, previousOutputs);

        currentNode.data.inputParameters = replacedVariables;
        currentNode.data.inputParameters.body = replacedBody;

        // Execute the current node based on its type
        let nodeResult;
        switch (currentNode.data.type) {
            case 'http':
                nodeResult = await executeHttpNode(currentNode);
                break;
            case 'webhook':
                nodeResult = await webhookHttpNode(currentNode);
                break;
            case 'nodeJS':
                nodeResult = await executeNodeJs(currentNode);
                break;
            case 'discord':
                nodeResult = await executeDiscordNode(currentNode);
                break;
            default:
                throw new Error('Unsupported node type');
        }

        // Update the workflow state
        workflowState.nodeStates[currentNode.id] = { completed: true, result: nodeResult };
        await setWorkflowState(shortId, workflowState);

        // Determine the next step
        const nextStepIndex = stepIndex + 1;
        if (nextStepIndex <= stepEndIndex) {
            res.writeHead(307, { Location: `/api/path?step=${nextStepIndex}&stepEnd=${stepEndIndex}` });
            res.end();
        } else {
            res.status(200).json({ message: 'Workflow completed', results: workflowState.nodeStates });
        }
    } catch (error) {
        console.error(`Error executing step ${stepIndex}:`, error);
        res.status(500).json({ error: `Error executing step: ${error.message}` });
    }
};
