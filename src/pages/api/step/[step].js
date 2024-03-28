import { executeHttpNode } from '../../../utils/httpRequestExecutor';
import { getWorkflowState, setWorkflowState } from '../../../utils/kvStorage';
import NextCors from 'nextjs-cors';
import { registerCron } from '../../../utils/cronUtils'; // Assuming this utility is correctly implemented
import { webhookHttpNode } from '../../../utils/webhookUtil'; // Assuming this utility is correctly implemented

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
    const { nodes, shortId, tenantId, trigger_output = {} } = req.body;

    if (!nodes) {
        return res.status(400).json({ error: "nodes array is missing in the request body" });
    }

    if (stepIndex < 0  /* || stepIndex >= nodes.length || stepEnd < stepIndex || stepEnd >= nodes.length */) {
        return res.status(204).json({ error: "Invalid step or stepEnd index." });
    }

    try {
        let existingResults = await getWorkflowState(shortId) || [];
        if (!Array.isArray(existingResults)) {
            existingResults = [];
        }

try {
    if (nodes[stepIndex].data.type === 'trigger') {
        // Assuming registerCron function returns some result or confirmation
                                                                // TODO: Fix this shit, +1 is hard coded but should be getCronNodes => nodes.pop(0) so index 1 is now 0 but the rest of the indexes are present (delete index 0)
        const cronResult = await registerCron(nodes[stepIndex], [nodes[stepIndex+1]]);
        existingResults.push({ cronResult });
    }
    else if (nodes[stepIndex].data.type === 'webhook') {
        const registerWebhook = await setWorkflowState("webhook_" + shortId, nodes[stepIndex])
        
    } else {

        const test = [
  {
    "nodeId": "http_0",
    "nodeLabel": "HTTP",
    "data": [
      {
        "data": {
          "id": "chatcmpl-97YsHZJgQzn4tiyTiMZAVA43T4OGL",
          "object": "chat.completion",
          "created": 1711589381,
          "model": "gpt-3.5-turbo-0125",
          "choices": [
            {
              "index": 0,
              "message": {
                "role": "assistant",
                "content": "13"
              },
              "logprobs": null,
              "finish_reason": "stop"
            }
          ],
          "usage": {
            "prompt_tokens": 10,
            "completion_tokens": 1,
            "total_tokens": 11
          },
          "system_fingerprint": "fp_3bc1b5746c"
        }
      }
    ],
    "status": "FINISHED"
  }
]

        const data = await webhookHttpNode(nodes[stepIndex], nodes, test);
        existingResults.push({ data });
 
    }
} catch (error) {
    // Log the error to the console
    console.error(`Error executing: ${error}`);
    // Push the error message or error object to existingResults for later processing
    existingResults.push({ error: error.message || 'Unknown error' });
}

        await setWorkflowState(shortId, existingResults);

        if (stepIndex < stepEnd) {
            const nextStepIndex = stepIndex + 1;
            res.writeHead(307, { Location: `/api/step/${nextStepIndex}?stepEnd=${stepEnd}` });
            res.end();
        } else {

// Connection URL and Database Name

// Assuming `db` is your database instance and `req`, `res` are Express request and response objects

// Function to insert a new execution and update the workflow with execution data
    try {
        const url = 'mongodb+srv://dylan:43VFMVJVJUFAII9g@cluster0.8phbhhb.mongodb.net/?retryWrites=true&w=majority';
const dbName = 'test';
const client = new MongoClient(url);
await client.connect();

const db = client.db(dbName);

        // Generate a shortId for the execution

        // New execution object
        let execution = {
            _id: null, // This will be set by your database
            executionData:  JSON.stringify([{nodeId:  nodes[stepIndex].id, nodeLabel: nodes[stepIndex].data.label, data: existingResults, status: "FINISHED"}]) , // Populate as necessary
            state: "SUCCESS", // Or "SUCCESS" or "FAILED" based on your logic
            workflowShortId: shortId,
            shortId: shortId,
            // Passed in the request body
            createdDate: new Date(),
            stoppedDate: new Date() // Set this when the execution stops
        };

        // Insert the new execution into the database
        const executionRepository = db.collection(`execution_${tenantId}`);
        await executionRepository.insertOne(execution);

        // Retrieve updated execution data for the workflow
        const executionData = await executionRepository.find({ workflowShortId: shortId }).toArray();
console.log(executionData)
        // Assuming 'workflow' is already defined or retrieved from the database
 
        // Respond with the updated workflow object
    } catch (error) {
        console.error('Error handling execution:', error);
        // Handle error, e.g., return an error response
    }


res.status(200).json({ data: existingResults });
        }
    } catch (error) {
        console.error(`Error executing step ${stepIndex}:`, error);
        res.status(204).json({ error: `Error executing step ${stepIndex}` });
    }
};

function generateShortId(prefix) {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}
