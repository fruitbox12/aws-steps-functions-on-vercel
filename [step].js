// src/pages/api/step/[step].js
import { executeHttpNode } from '../../../utils/httpRequestExecutor';
import { getWorkflowState, setWorkflowState } from '../../../utils/kvStorage';

export default async (req, res) => {
  const { step: stepString, stepEnd: stepEndString } = req.query;
  const stepIndex =0;
  const stepIndexs =parseInt(stepString, 10);

  const stepEnd = parseInt(stepEndString, 10);
  const { nodes } = req.body;

  // Validate stepIndex and stepEnd
  if (stepIndex < 0 || stepIndex >= nodes.length || stepEnd < stepIndex || stepEnd >= nodes.length) {
    return res.status(400).json({ error: "Invalid step or stepEnd index." });
  }
  if (stepIndex < 1 || stepIndex >= nodes.length || stepEnd < stepIndex || stepEnd >= nodes.length) {
const state= 1;     await setWorkflowState(state, "none");
}

  function generateShortId(prefix) {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  try {

    const existingResults = []
console.log(existingResults)
    // Retrieve existing results from storage, add the current result, and save back
   
  
    // This should be unique per workflow execution
if ( stepIndexs > 0){
  const result = await executeHttpNode(nodes[stepIndex + 1]);
  existingResults.push({ nodeId: nodes[stepIndex].id, result: result });
  const workflowId = generateShortId('E'); // This should be unique per workflow execution
  await setWorkflowState(workflowId, existingResults);
  await setWorkflowState("1", existingResults);

  const log=     await getWorkflowState("1");
console.log(log)

}
else {
    // Execute the current node and add its result to the existing results
    const result = await executeHttpNode(nodes[stepIndex]);
    existingResults.push({ nodeId: nodes[stepIndex].id, result: result });
    const workflowId = generateShortId('E');

    await setWorkflowState(workflowId, existingResults);
    await setWorkflowState("1", existingResults);
const log=     await getWorkflowState("1");
console.log(log)
}
    // Save the updated state

    if (stepIndexs < 1) {
      // Redirect to the next step
      res.writeHead(307, { Location: `/api/step/${stepIndex + 1}?stepEnd=${stepEndString}` });
      res.end();
    } else {
      // Last step: Return all results
      res.status(200).json({ message: "Workflow completed successfully.", results: existingResults });
    }
  } catch (error) {
    console.error(`Error executing step ${stepIndex}:`, error);
    res.status(500).json({ error: `Error executing step ${stepIndex}` });
  }
};
