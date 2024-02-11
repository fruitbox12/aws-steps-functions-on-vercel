// pages/api/step/[stepId].js
import { getWorkflowState, setWorkflowState } from '../../../utils/kvStorage';
import { executeHttpNode } from '../../../utils/httpRequestExecutor'; // Assume this executes an HTTP request for a node

export default async (req, res) => {
  const { stepId } = req.query;
  const workflowStateKey = 'workflow_state_key'; // Key for your workflow state in Vercel KV

  // Fetch the current workflow state
  let { nodes, edges, executionOrder, completedSteps = [] } = await getWorkflowState(workflowStateKey);

  if (!executionOrder) {
    // Determine execution order if not already done
    executionOrder = determineExecutionOrder(nodes, edges);
    await setWorkflowState(workflowStateKey, { nodes, edges, executionOrder, completedSteps });
  }

  // Find the next step to execute based on the execution order and completed steps
  const nextStepId = executionOrder.find(id => !completedSteps.includes(id));

  if (stepId !== nextStepId) {
    // If the current step is not the expected next step, something went wrong
    return res.status(400).json({ error: "Unexpected step order." });
  }

  // Execute the current step
  const node = nodes.find(node => node.id === stepId);
  await executeHttpNode(node);

  // Mark the current step as completed
  completedSteps.push(stepId);

  // Check if there are more steps to execute
  if (completedSteps.length < nodes.length) {
    const nextStepId = executionOrder.find(id => !completedSteps.includes(id));
    // Redirect to the next step
    res.writeHead(307, { Location: `/api/step/${nextStepId}` });
    res.end();
  } else {
    // Workflow completed
    res.status(200).json({ message: "Workflow completed successfully." });
  }

  // Update the workflow state
  await setWorkflowState(workflowStateKey, { nodes, edges, executionOrder, completedSteps });
};
