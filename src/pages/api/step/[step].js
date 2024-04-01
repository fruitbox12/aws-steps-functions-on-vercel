import { executeHttpNode } from '../../../utils/httpRequestExecutor';
import { getWorkflowState, setWorkflowState } from '../../../utils/kvStorage';
import NextCors from 'nextjs-cors';
import { registerCron } from '../../../utils/cronUtils'; // Assuming this utility is correctly implemented
import { webhookHttpNode } from '../../../utils/webhookUtil'; // Assuming this utility is correctly implemented

const { MongoClient } = require('mongodb');

async function getPreviousStepOutput(nodeId) {
    const url = 'mongodb+srv://dylan:43VFMVJVJUFAII9g@cluster0.8phbhhb.mongodb.net/?retryWrites=true&w=majority';
    const dbName = 'test';
    const client = new MongoClient(url);
    await client.connect();

    const db = client.db(dbName);
    const executionRepository = db.collection(`exec_${tenantId}`);

    // Fetch the most recent execution output for the given nodeId
    const previousOutput = await executionRepository.findOne({ nodeId }, { sort: { _id: -1 } });

    await client.close();

    return previousOutput ? previousOutput.data : null;
}

async function executeCurrentStepWithReplacedVariables(node, stepIndex) {
    const previousNodeId = stepIndex > 0 ? nodes[stepIndex - 1].id : null;
    let previousOutputData = null;

    if (previousNodeId !== null) {
        previousOutputData = await getPreviousStepOutput(previousNodeId);
    }

    // Assuming a function that replaces template variables in your node parameters
    // with data from previousOutputData. Implementation depends on your template format.
    replaceTemplateVariables(node, previousOutputData);

    const data = await executeHttpNode(node);

    // Store the current node's output
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db(dbName);
    const executionRepository = db.collection(`exec_${tenantId}`);
    await executionRepository.insertOne({ nodeId: node.id, data, timestamp: new Date() });
    await client.close();

    existingResults.push({ data });
}

// Example usage
// Ensure nodes, stepIndex, and tenantId are defined and available
async function replaceTemplateVariablesAndExecute(nodeIndex) {
    const node = nodes[nodeIndex];
    let inputParameters = node.data.inputParameters;

    // Regular expression to match template variables
    const templateVariableRegex = /\{\{([^\}]+)\}\}/g;
    let match;

    // Replace template variables in URL
    while ((match = templateVariableRegex.exec(inputParameters.url)) !== null) {
        const variableName = match[1].trim();
        const replacementValue = getOutputFromPreviousStep(nodeIndex - 1)[variableName]; // Simplified for demonstration
        inputParameters.url = inputParameters.url.replace(match[0], replacementValue);
    }

    // Similarly, replace template variables in body, headers, etc.
    // This example assumes the body is a JSON string that might contain template variables
    if (inputParameters.body) {
        let bodyObj = JSON.parse(inputParameters.body);
        let bodyStr = JSON.stringify(bodyObj, (key, value) => {
            if (typeof value === 'string' && templateVariableRegex.test(value)) {
                const match = value.match(templateVariableRegex);
                const variableName = match[1].trim();
                const replacementValue = getOutputFromPreviousStep(nodeIndex - 1)[variableName]; // Simplified for demonstration
                return replacementValue;
            }
            return value;
        });
        inputParameters.body = bodyStr;
    }

    // Execute the node with replaced values
    const data = await executeHttpNode(node); // Assuming executeHttpNode accepts the entire node

    // Store the execution data
    await executionRepository.insertOne({ [node.id]: data });
    existingResults.push({ data: data });
}

// Example usage
// Assuming nodeIndex is the current node's index in the nodes array
await replaceTemplateVariablesAndExecute(nodeIndex);

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


await replaceTemplateVariablesAndExecute(nodes[stepIndex]);
          
        await executionRepository.insertOne({  [nodes[stepIndex].id]: data });
        existingResults.push({ data: data });
 
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
