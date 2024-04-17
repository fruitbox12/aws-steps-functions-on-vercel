import { executeHttpNode } from '../../../utils/httpRequestExecutor';
import { getWorkflowState, setWorkflowNodeState, getWorkflowNodeState, setWorkflowState } from '../../../utils/kvStorage';
import NextCors from 'nextjs-cors';
import { registerCron } from '../../../utils/cronUtils';
import { replaceTemplateVariables, replaceTemplateBody } from '../../../utils/regex';

const { MongoClient } = require('mongodb');

export default async (req, res) => {
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200,
    });

    const { step: stepString, stepEnd: stepEndString } = req.query;
    const stepIndex = parseInt(stepString, 10);
    const stepEnd = parseInt(stepEndString, 10);
    const { nodes, shortId, tenantId, trigger_output = {}, webhook_body = {} } = req.body;

    if (!nodes) {
        return res.status(400).json({ error: "Nodes array is missing in the request body." });
    }

    if (stepIndex < 0 || stepIndex >= nodes.length || stepEnd < stepIndex || stepEnd >= nodes.length) {
        return res.status(400).json({ error: "Invalid step or stepEnd index." });
    }

    try {
        const existingResults = await getWorkflowState(shortId) || [];

        // Handle node execution based on type
        const nodeResult = await executeNode(nodes[stepIndex], webhook_body, trigger_output);
        existingResults.push(nodeResult);

        // Save results and update state
        await setWorkflowState(shortId, existingResults);
        await setWorkflowNodeState(trigger_output, nodes[stepIndex].id, nodeResult);

        // Proceed to the next step or complete the workflow
        if (stepIndex < stepEnd) {
            redirectNextStep(res, stepIndex, stepEnd);
        } else {
            await finalizeWorkflowExecution(existingResults, tenantId, shortId, trigger_output);
            res.status(200).json({ data: existingResults });
        }
    } catch (error) {
        console.error(`Error executing step ${stepIndex}:`, error);
        res.status(500).json({ error: `Error executing step ${stepIndex}: ${error.message}` });
    }
};

async function executeNode(node, webhook_body, trigger_output) {
    try {
        switch (node.data.type) {
            case 'trigger':
                return await registerCron(node);
            case 'webhook':
                return await setWorkflowNodeState(trigger_output, node.id, [{ data: webhook_body }]);
            case 'http':
                const previousOutput = await getWorkflowNodeState(trigger_output);
                node.data.inputParameters.url = replaceTemplateVariables(node.data.inputParameters.url, previousOutput);
                node.data.inputParameters.body = replaceTemplateBody(node.data.inputParameters.body, previousOutput);
                return await executeHttpNode(node);
            default:
                throw new Error("Unsupported node type");
        }
    } catch (error) {
        console.error(`Error executing node ${node.id}: ${error}`);
        return { error: error.message || 'Unknown error during node execution' };
    }
}

function redirectNextStep(res, currentStep, stepEnd) {
    const nextStepIndex = currentStep + 1;
    res.writeHead(307, { Location: `/api/step/${nextStepIndex}?stepEnd=${stepEnd}` });
    res.end();
}

async function finalizeWorkflowExecution(results, tenantId, shortId, trigger_output) {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('workflowExecutions');
        const executionRepository = db.collection(`execution_${tenantId}`);
        await executionRepository.insertOne({
            workflowShortId: shortId,
            shortId: trigger_output || generateShortId("E"),
            executionData: JSON.stringify(results),
            state: "SUCCESS",
            createdDate: new Date(),
            stoppedDate: new Date()
        });
    } catch (error) {
        console.error('Error finalizing execution:', error);
    } finally {
        await client.close();
    }
}

function generateShortId(prefix) {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}
