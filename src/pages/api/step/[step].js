 // pages/api/executeWorkflow.js
import axios from 'axios';
import delay from '../../../delay';
import { resolveNodeDependencies, determineExecutionOrder } from '../../../utils/workflowUtils';

export default async (req, res) => {
  const { nodes, edges } = req.body;

  // Resolve dependencies to determine execution order
  const executionOrder = determineExecutionOrder(nodes, edges);

  let nodeResults = {};

  const executeHttpNode = async (node) => {
    const { method, url, headers, body } = node.data.inputParameters;
    try {
      const response = await axios({ method, url, headers, data: body });
      console.log(`Node ${node.id} executed with result:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error executing HTTP node ${node.id}:`, error);
      throw error;
    }
  };

  // Execute nodes according to the determined order
  for (const nodeId of executionOrder) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) continue;

    await delay(1); // Simulate processing delay

    try {
      nodeResults[nodeId] = await executeHttpNode(node);
    } catch (error) {
      console.error(`Failed to execute node ${nodeId}:`, error);
      res.status(500).json({ error: `Failed to execute node ${nodeId}` });
      return;
    }
  }

  console.log('Workflow executed successfully');
  res.status(200).json({ message: 'Workflow executed successfully', results: nodeResults });
};
