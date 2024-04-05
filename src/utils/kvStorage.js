// utils/kvStorage.js
import axios from 'axios';

const KV_STORAGE_BASE_URL = "https://renewing-heron-48789.kv.vercel-storage.com";
const AUTH_HEADER = { Authorization: `Bearer Ab6VASQgZmYxOTk0ZjUtN2JlNS00MDJjLThkN2ItZjg1ZmE5ZGNhZTUwNDJhMzU2MjQyMjExNDJkNmJmYWFjYjNmYmU4NDlkY2U=` };

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
export async function getWorkflowNodeState(workflowKey, nodeId) {
  try {
    const response = await axios.get(`${KV_STORAGE_BASE_URL}/get/${workflowKey}`, { headers: AUTH_HEADER });
    const workflowData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    return workflowData[nodeId] || [];
  } catch (error) {
    console.error('Error getting workflow node state:', error);
    return [];
  }
}

// Updates the state of a specific node within a workflow
export async function setWorkflowNodeState(workflowKey, nodeId, nodeState) {
  try {
    // First, get the current state of the entire workflow
    const response = await axios.get(`${KV_STORAGE_BASE_URL}/get/${workflowKey}`, { headers: AUTH_HEADER });
    let workflowData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

    // If the workflow doesn't exist yet or isn't an object, initialize it
    if (!workflowData || typeof workflowData !== 'object') {
      workflowData = {};
    }

    // Update the node state within the workflow
    workflowData[nodeId] = nodeState;

    // Save the updated workflow state back to KV storage
    await axios.post(`${KV_STORAGE_BASE_URL}/set/${workflowKey}`, JSON.stringify(workflowData), { headers: AUTH_HEADER });
  } catch (error) {
    console.error('Error setting workflow node state:', error);
  }
}
