// pages/api/step/[stepId].js
import { getWorkflowState, setWorkflowState } from '../../../utils/kvStorage';
import { executeHttpNode } from '../../../utils/httpRequestExecutor'; // Assume this executes an HTTP request for a node
import { resolveNodeDependencies, determineExecutionOrder } from '../../../utils/workflowUtils';
export default async (req, res) => {
  // Assuming 'stepIndex' is passed as a query parameter indicating the current step's index (starting from 0)
  const stepIndex = parseInt(req.query.stepIndex, 10);
  const { nodes } = req.body; // Assuming 'nodes' are provided in the request body

  // Check if the current step index is within the bounds of the nodes array
  if (stepIndex < 0 || stepIndex >= nodes.length) {
    return res.status(400).json({ error: "Invalid step index." });
  }

  const currentNode = nodes[stepIndex];

  // Execute the current step (this example assumes an HTTP request, adjust according to your step type)
  try {
    await executeHttpNode(currentNode); // Execute the current node's action
    // Logic to mark the current step as completed, e.g., updating a database or in-memory store

    // Check if there are more steps to execute
    if (stepIndex + 1 < nodes.length) {
      // If there are more steps, redirect to the next step
      res.writeHead(307, { Location: `/api/step?stepIndex=${stepIndex + 1}` });
      res.end();
    } else {
      // If all steps are completed
      res.status(200).json({ message: "Workflow completed successfully." });
    }
  } catch (error) {
    console.error(`Error executing step ${stepIndex}:`, error);
    res.status(500).json({ error: `Error executing step ${stepIndex}` });
  }
};
