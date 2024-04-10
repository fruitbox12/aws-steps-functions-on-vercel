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
  const KV_REST_API_URL = process.env.KV_REST_API_URL; 
  const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN; 

  try {
    // Fetch the current state of the entire workflow
    const response = await fetch(`${KV_REST_API_URL}/get/${workflowKey}`, {
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
    });
    let workflowData = await response.json();

    // Ensure there's a "result" object to work with, parse if it exists or initialize
    let currentWorkflowState = workflowData && workflowData.result ? JSON.parse(workflowData.result) : {};

    // Update or Initialize nodeId with new state
    // This places or replaces the nodeId state within the currentWorkflowState object
    currentWorkflowState[nodeId] = nodeState;

    // Prepare the updated workflow data for saving
    const result = {
      result: null,
              ...currentWorkflowState, // Spreading the currentWorkflowState to include all nodeId states
    };

    // Save the updated workflow state back to KV storage
    await fetch(`${KV_REST_API_URL}/set/${workflowKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
      body: { "result": JSON.stringify({
              result: null,
              ...currentWorkflowState, // Spreading the currentWorkflowState to include all nodeId states
    }) }
    })
    .then(response => response.json())
    .then(data => console.log('Updated workflow data:', data))
    .catch(error => console.error('Error in updating workflow data:', error));
  } catch (error) {
    console.error('Error setting workflow node state:', error);
  }
}
