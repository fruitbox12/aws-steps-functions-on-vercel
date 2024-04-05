import NextCors from 'nextjs-cors';
import { MongoClient } from 'mongodb';
import { executeHttpNode } from '../../../utils/httpRequestExecutor';
import { getWorkflowNodeState, setWorkflowNodeState } from '../../../utils/kvStorage';
import { registerCron } from '../../../utils/cronUtils';
import { webhookHttpNode } from '../../../utils/webhookUtil';
import { replaceTemplateVariables } from '../../../utils/regex';

// Assuming MongoClient, executeHttpNode, registerCron, webhookHttpNode, and replaceTemplateVariables are correctly implemented and imported.

async function generateShortId(prefix) {
    // This is a placeholder implementation. Use a more robust method for production.
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

export default async (req, res) => {
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200,
    });

    const { step: stepString, stepEnd: stepEndString } = req.query;
    const stepIndex = parseInt(stepString, 10);
    const stepEnd = parseInt(stepEndString, 10);
    const { nodes, shortId, tenantId, trigger_output = {} } = req.body;

    if (!nodes) {
        return res.status(400).json({ error: "nodes array is missing in the request body" });
    }

    if (stepIndex < 0) {
        return res.status(204).json({ error: "Invalid step or stepEnd index." });
    }

    try {
        const currentNode = nodes[stepIndex];
        const currentNodeType = currentNode.data.type;
        let previousNodeOutput = {};

        // Retrieve the output of the previous node if not the first step
        if (stepIndex > 0) {
            const previousNodeId = nodes[stepIndex - 1].id;
            previousNodeOutput = await getWorkflowNodeState(shortId, previousNodeId);
        } else {
            previousNodeOutput = trigger_output; // Use trigger output if it's the first step
        }

        let nodeResult;

        switch (currentNodeType) {
            case 'trigger':
                // Execute trigger logic, e.g., registerCron
                nodeResult = await registerCron(currentNode, [nodes[stepIndex + 1]]);
                break;
            case 'webhook':
                // Execute webhook logic, assuming webhookHttpNode is a placeholder function
                nodeResult = await webhookHttpNode(currentNode, previousNodeOutput);
                break;
            default:
                // Prepare node input with template variables replaced by previous node's output
                const nodeInput = replaceTemplateVariables(currentNode.data.input.url, previousNodeOutput);
                nodeResult = await executeHttpNode({ ...currentNode, data: { ...currentNode.data, input: nodeInput } });
                break;
        }

        // Update node result in workflow state
        await setWorkflowNodeState(shortId, currentNode.id, [{ data: nodeResult }]);

        if (stepIndex < stepEnd) {
            const nextStepIndex = stepIndex + 1;
            res.writeHead(307, { Location: `/api/step/${nextStepIndex}?stepEnd=${stepEnd}` });
            res.end();
        } else {
            // Final step logic, e.g., update execution in MongoDB

            // Initialize MongoDB connection
            const url = 'mongodb+srv://dylan:43VFMVJVJUFAII9g@cluster0.8phbhhb.mongodb.net/?retryWrites=true&w=majority';
            const dbName = 'test'; // Replace with your database name
            const client = new MongoClient(url);
            await client.connect();
            const db = client.db(dbName);
            const executionRepository = db.collection(`execution_${tenantId}`);

            const documentId = await generateShortId(currentNode.id); // Ensure generateShortId generates a unique identifier
            const executionData = {
                _id: documentId,
                data: nodeResult,
                workflowId: shortId,
                nodeId: currentNode.id,
                timestamp: new Date(),
            };

            await executionRepository.insertOne(executionData);

            res.status(200).json({ message: "Workflow execution complete", data: nodeResult });
        }
    } catch (error) {
        console.error(`Error executing step ${stepIndex}:`, error);
        res.status(500).json({ error: `Error executing step ${stepIndex}: ${error.message}` });
    }
};
