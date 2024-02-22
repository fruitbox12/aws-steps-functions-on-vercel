// Assuming this is in your routes/api/step.js or similar
// this might break
import { executeHttpNode } from '../../../utils/httpRequestExecutor';
import { getWorkflowState, setWorkflowState } from '../../../utils/kvStorage';
import NextCors from 'nextjs-cors';
import { registerCron } from '../../../utils/cronUtils'; // Make sure to import the utility

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

    if (stepIndex < 0 || stepIndex >= nodes.length || stepEnd < stepIndex || stepEnd >= nodes.length) {
        return res.status(400).json({ error: "Invalid step or stepEnd index." });
    }

    try {
        let existingResults = await getWorkflowState('workflowId') || []; // Ensure you have a valid key for state retrieval

        // Check if the current node is a scheduler trigger and register the cron job
        if (nodes[stepIndex].data.type === 'trigger') {
            const cronResult = await registerCron(nodes[stepIndex]);
            existingResults.push({ cronResult });
        } else {
            // Execute the current node and add its result to the existing results
            const result = await executeHttpNode(nodes[stepIndex]);
            existingResults.push({ result });
        }

        // Save the updated state
        await setWorkflowState('workflowId', existingResults); // Ensure you have a valid key for state saving

        // Redirect to the next step if not at the end
        if (stepIndex < stepEnd) {
            const nextStepIndex = stepIndex + 1;
            res.writeHead(307, { Location: `/api/step/${nextStepIndex}?stepEnd=${stepEnd}` });
            res.end();
        } else {
            // Last step: Return all results
            res.status(200).json(existingResults);
        }
    } catch (error) {
        console.error(`Error executing step ${stepIndex}:`, error);
        res.status(500).json({ error: `Error executing step ${stepIndex}` });
    }
};

function generateShortId(prefix) {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}
