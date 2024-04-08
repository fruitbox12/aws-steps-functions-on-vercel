// utils/kvStorage.js
import axios from 'axios';

const KV_STORAGE_BASE_URL = process.env.KV_REST_API_URL;
const AUTH_HEADER = { Authorization: process.env.KV_REST_API_TOKEN };

export async function getWorkflowState(key) {
  try {
    const response = await axios.get(`${KV_STORAGE_BASE_URL}/get/${key}`, { headers: AUTH_HEADER });
    return typeof response.data === 'string' ? JSON.parse(response.data) : (Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    console.error('Error getting workflow state:', error);
    return {};
  }
}

export async function setWorkflowState(key, state) {
  try {
    await axios.post(`${KV_STORAGE_BASE_URL}/set/${key}`, JSON.stringify(state), { headers: AUTH_HEADER });
  } catch (error) {
    console.error('Error setting workflow state:', error);
  }
}




// Retrieves the state of a specific node within a workflow
export async function getWorkflowNodeState(workflowKey) {
  try {
    const response = await axios.get(`${KV_STORAGE_BASE_URL}/get/${workflowKey}`, { headers: AUTH_HEADER });
    return response.data;
  } catch (error) {
    console.error('Error getting workflow node state:', error);
    return [];
  }
}

// Updates the state of a specific node within a workflow
export async function setWorkflowNodeState(workflowKey, nodeId, nodeState) {
  const KV_REST_API_URL = process.env.KV_REST_API_URL; // Make sure this is correctly defined in your environment
  const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN; // Make sure this is correctly defined in your environment

  try {
    // First, get the current state of the entire workflow
    const response = await fetch(`${KV_REST_API_URL}/get/${workflowKey}`, {
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
    });
    let workflowData = await response.json();

    // If the workflow doesn't exist yet or isn't an object, initialize it
    if (!workflowData || typeof workflowData !== 'object') {
      workflowData = {};
    }

    // Assuming nodeState is already structured correctly, directly assign it
    // If nodeId exists, append the new state; otherwise, initialize it with the provided state
if (!workflowData[nodeId]) {
  // If not, initialize it with the structure including a 'result' object that contains an array for 'results'
  workflowData[nodeId] = {"result": {"result": [nodeState]}};
} else {
  // If it exists, append the new state directly to the 'result.result' array
  workflowData[nodeId].result.result.push(nodeState);
}
    // Save the updated workflow state back to KV storage
    await fetch(`${KV_REST_API_URL}/set/${workflowKey}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
      method: 'PATCH',
      body: JSON.stringify(workflowData),
    })
    .then(response => response.json())
    .then(data => console.log('Updated workflow data:', data));
  } catch (error) {
    console.error('Error setting workflow node state:', error);
  }
}
