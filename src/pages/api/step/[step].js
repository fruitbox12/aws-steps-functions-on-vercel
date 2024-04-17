
import { executeHttpNode } from '../../../utils/httpRequestExecutor';
import { getWorkflowState,setWorkflowNodeState,getWorkflowNodeState, setWorkflowState } from '../../../utils/kvStorage';
import NextCors from 'nextjs-cors';
import { registerCron } from '../../../utils/cronUtils'; // Assuming this utility is correctly implemented
import { webhookHttpNode } from '../../../utils/webhookUtil'; // Assuming this utility is correctly implemented
import { replaceTemplateVariables, replaceTemplateBody } from '../../../utils/regex'; // Assuming this utility is correctly implemented
import { executeDiscordNode } from '../../../utils/Discord'; // Assuming this utility is correctly implemented

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
    const { nodes, shortId, tenantId, trigger_output = {}, webhook_body= {}} = req.body;

    if (!nodes) {
        return res.status(400).json({ error: "nodes array is missing in the request body" });
    }

    if (stepIndex < 0  /* || stepIndex >= nodes.length || stepEnd < stepIndex || stepEnd >= nodes.length */) {
        return res.status(204).json({ error: "Invalid step or stepEnd index." });
    }

    try {
        let existingResults = await getWorkflowState(trigger_output) || [];
        if (!Array.isArray(existingResults)) {
            existingResults = [];
        }

try {        let previousNodeOutput = {};

    if (nodes[stepIndex].data.type === 'trigger') {
        // Assuming registerCron function returns some result or confirmation
                                                                // TODO: Fix this shit, +1 is hard coded but should be getCronNodes => nodes.pop(0) so index 1 is now 0 but the rest of the indexes are present (delete index 0)
        const cronResult = await registerCron(nodes[stepIndex], [nodes[stepIndex+1]], shortId, tenantId);
        existingResults.push({ cronResult });
    }
    else if (nodes[stepIndex].data.type === 'webhook') {
       await setWorkflowNodeState(trigger_output, nodes[stepIndex].id, [{ data: webhook_body }])
        
    } 
        else if (nodes[stepIndex].data.type === 'discord') {
  const previousNodeId = nodes[stepIndex - 1].id;
            previousNodeOutput = await getWorkflowNodeState(trigger_output);
         const nodeInput = replaceTemplateVariables(nodes[stepIndex].data?.inputParameters?.url, previousNodeOutput);
         const nodeBody = replaceTemplateBody(nodes[stepIndex].data?.inputParameters?.content, previousNodeOutput);

// Update the currentNode with the new inputParameters.url value
nodes[stepIndex].data.inputParameters.url = nodeInput;
nodes[stepIndex].data.inputParameters.content = nodeBody;

// Execute the HTTP Node with the updated currentNode
const data = await executeDiscordNode(nodes[stepIndex]);
existingResults.push({ data: data });
await setWorkflowNodeState(trigger_output, nodes[stepIndex].id, [{ data: data }]);
        
    } 
        else if (stepIndex > 0) {

             const previousNodeId = nodes[stepIndex - 1].id;
            previousNodeOutput = await getWorkflowNodeState(trigger_output);
         const nodeInput = replaceTemplateVariables(nodes[stepIndex].data?.inputParameters?.url, previousNodeOutput);
         const nodeBody = replaceTemplateBody(nodes[stepIndex].data?.inputParameters?.body, previousNodeOutput);

// Update the currentNode with the new inputParameters.url value
nodes[stepIndex].data.inputParameters.url = nodeInput;
nodes[stepIndex].data.inputParameters.body = nodeBody;

// Execute the HTTP Node with the updated currentNode
const data = await executeHttpNode(nodes[stepIndex]);
existingResults.push({ data: data });
await setWorkflowNodeState(trigger_output, nodes[stepIndex].id, [{ data: data }]);

        } else {  

    
//              const data = await webhookHttpNode(nodes[stepIndex], nodes, existingResults[existingResults.length - 1]);

              const data = await executeHttpNode(nodes[stepIndex]);
           
            
await setWorkflowNodeState(trigger_output, nodes[stepIndex].id, [{ data: data }]);


// Insert the document into the collection

// Then, push the constructed object to the array
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
            shortId: trigger_output || "E" + shortId ,
            // Passed in the request body
            createdDate: new Date(),
            stoppedDate: new Date() // Set this when the execution stops
        };

        // Insert the new execution into the database
        const executionRepository = db.collection(`execution_${tenantId}`);
        await executionRepository.insertOne(execution);

        // Retrieve updated execution data for the workflow
        const executionData = await executionRepository.find({ workflowShortId: shortId }).toArray();
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
