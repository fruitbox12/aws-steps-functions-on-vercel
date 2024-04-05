import { executeHttpNode } from '../../../utils/httpRequestExecutor';
import { getWorkflowState, setWorkflowState } from '../../../utils/kvStorage';
import NextCors from 'nextjs-cors';
import { registerCron } from '../../../utils/cronUtils'; // Assuming this utility is correctly implemented

export default async (req, res) => {
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200,
    });

    const { step: stepString, stepEnd: stepEndString } = req.query;
    const stepIndex = parseInt(stepString, 10);
    const stepEnd = parseInt(stepEndString, 10);
    const { nodes } = req.body;

    if (!nodes) {
        return res.status(400).json({ error: "nodes array is missing in the request body" });
    }

    if (stepIndex < 0  /* || stepIndex >= nodes.length || stepEnd < stepIndex || stepEnd >= nodes.length */) {
        return res.status(204).json({ error: "Invalid step or stepEnd index." });
    }

    try {
        let existingResults = await getWorkflowState('workflowId') || [];
        if (!Array.isArray(existingResults)) {
            existingResults = [];
        }

try {
    if (nodes[stepIndex].data.type === 'trigger') {
        // Assuming registerCron function returns some result or confirmation
        const cronResult = await registerCron(nodes[stepIndex]);
        existingResults.push({ cronResult });
    else if (nodes[stepIndex].data.type === 'webhook') {
        const registerWebhook = await setWorkflowState("webhook_" + shortId, nodes[stepIndex])
        
    } 

    } else {
        const result = await executeHttpNode(nodes[stepIndex]);
        existingResults.push({ result });
    }
} catch (error) {
    // Log the error to the console
    console.error(`Error executing: ${error}`);
    // Push the error message or error object to existingResults for later processing
    existingResults.push({ error: error.message || 'Unknown error' });
}

        await setWorkflowState('workflowId', existingResults);

        if (stepIndex < stepEnd) {
            const nextStepIndex = stepIndex + 1;
            res.writeHead(307, { Location: `/api/step/${nextStepIndex}?stepEnd=${stepEnd}` });
            res.end();
        } else {
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
