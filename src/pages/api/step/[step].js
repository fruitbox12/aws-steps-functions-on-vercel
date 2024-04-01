import { executeHttpNode } from '../../../utils/httpRequestExecutor';
import { getWorkflowState, setWorkflowState } from '../../../utils/kvStorage';
import NextCors from 'nextjs-cors';
import { registerCron } from '../../../utils/cronUtils';
import { webhookHttpNode } from '../../../utils/webhookUtil';
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
    const { nodes, shortId, tenantId } = req.body;

    if (!nodes) {
        return res.status(400).json({ error: "nodes array is missing in the request body" });
    }

    if (stepIndex < 0) {
        return res.status(204).json({ error: "Invalid step or stepEnd index." });
    }

    const url = 'mongodb+srv://dylan:43VFMVJVJUFAII9g@cluster0.8phbhhb.mongodb.net/?retryWrites=true&w=majority';
    const dbName = 'test';
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db(dbName);
    const executionRepository = db.collection(`exec_${tenantId}`);

    let existingResults = await getWorkflowState(shortId) || [];
    if (!Array.isArray(existingResults)) {
        existingResults = [];
    }

    try {
        if (nodes[stepIndex].data.type === 'trigger') {
            const cronResult = await registerCron(nodes[stepIndex], nodes.slice(stepIndex + 1));
            existingResults.push({ cronResult });
        } else if (nodes[stepIndex].data.type === 'webhook') {
            console.log("")
        } else {
            const nodeToExecute = nodes[stepIndex];
            const data = await executeHttpNode(nodeToExecute);
            await executionRepository.insertOne({ nodeId: nodeToExecute.id, data, timestamp: new Date() });
            existingResults.push({ data });
        }

        await setWorkflowState(shortId, existingResults);

        if (stepIndex < stepEnd) {
            const nextStepIndex = stepIndex + 1;
            res.writeHead(307, { Location: `/api/step/${nextStepIndex}?stepEnd=${stepEnd}` });
            res.end();
        } else {
            // Assuming all steps have been executed and this is the final step
            let execution = {
                executionData: JSON.stringify(existingResults),
                state: "SUCCESS",
                workflowShortId: shortId,
                createdDate: new Date(),
                stoppedDate: new Date()
            };

            await executionRepository.insertOne(execution);
            res.status(200).json({ data: existingResults });
        }
    } catch (error) {
        console.error(`Error executing step ${stepIndex}:`, error);
        res.status(500).json({ error: `Error executing step ${stepIndex}` });
    } finally {
        await client.close();
    }
};
