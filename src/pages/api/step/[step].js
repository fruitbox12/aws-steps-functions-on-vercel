import { executeHttpNode } from '../../../utils/httpRequestExecutor';
import { getWorkflowState, setWorkflowState } from '../../../utils/kvStorage';
import NextCors from 'nextjs-cors';

export default async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    await NextCors(req, res, {
      // Options
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      origin: '*',
      optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
   });
  const { step: stepString, stepEnd: stepEndString } = req.query;
  const stepIndex = parseInt(stepString, 10);
  const stepEnd = parseInt(stepEndString, 10);
  
  const { nodes } = req.body;
  if (!nodes) {
    return res.status(400).json({ error: "nodes array is missing in the request body" });
  }
  
if (stepIndex > 0) {
console.log("works");
}
  // Validate stepIndex and stepEnd
  if (stepIndex < 0 || stepIndex >= nodes.length || stepEnd < stepIndex || stepEnd >= nodes.length) {
    return res.status(400).json({ error: "Invalid step or stepEnd index." });
  }

  try {
    // Retrieve existing results from storage or initialize as an empty array
    const workflowId = generateShortId('E');
    let existingResults = await getWorkflowState(nodes[stepIndex].stepIndex) || [];
    if (!Array.isArray(existingResults)) {
      existingResults = [];
    }

    // Execute the current node and add its result to the existing results
    const result = await executeHttpNode(nodes[stepIndex]);
    existingResults.push({ result });

    // Save the updated state
    await setWorkflowState(nodes[stepIndex].stepIndex, existingResults,nodes[stepIndex].stepIndex+1);
    // Redirect to the next step if not at the end
    if (stepIndex < 1) {
      const nextStepIndex = stepIndex + 1;
      
      res.writeHead(307, { Location: `/api/step/${nextStepIndex}?stepEnd=${stepEnd}` });
      res.end();
    } else {
      // Last step: Return all results
      const log = [];
    
      // Retrieve workflow state for each node and add it to the log array
      for (let i = 0; i <= stepIndex; i++) {
        const state = await getWorkflowState(nodes[i].i);
        log.push(state);
      }

      const executions = log.map(state => ({
      
        data: state,
       
      }));
      
      res.status(200).json({
        "data": [
          executions
          
        ]
      }); }
      
  } catch (error) {
    console.error(`Error executing step ${stepIndex}:`, error);
    res.status(500).json({ error: `Error executing step ${stepIndex}` });
  }
};

function generateShortId(prefix) {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}
