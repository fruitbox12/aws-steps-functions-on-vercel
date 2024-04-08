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

export async function setWorkflowNodeState(workflowKey, nodeId, nodeState) {
  const KV_REST_API_URL = process.env.KV_REST_API_URL;
  const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

  try {
    const response = await fetch(`${KV_REST_API_URL}/get/${workflowKey}`, {
      headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
    });

    let workflowData = await response.json();
    let method = 'PATCH'; // Assume update by default, as `POST` is generally for creation

    // Check if workflowData is not an object or is empty, indicating a new workflow needs to be created
    if (!workflowData || typeof workflowData !== 'object' || Object.keys(workflowData).length === 0) {
      workflowData = {}; // Initialize for new data
      method = 'POST'; // Use `POST` for creating the workflow
    }

    // Check and prepare the nodeData
    if (!workflowData[nodeId]) {
      // If nodeId doesn't exist, create an entry for it
      workflowData[nodeId] = { result: null, [nodeId]: [{ data: nodeState }] };
    } else {
      // If nodeId exists, update it
      if (typeof workflowData[nodeId] === 'string') {
        // Parse if it's a stringified JSON
        workflowData[nodeId] = JSON.parse(workflowData[nodeId]);
      }
      if (!workflowData[nodeId][nodeId]) {
        workflowData[nodeId][nodeId] = [];
      }
      workflowData[nodeId][nodeId].push({ data: nodeState }); // Push the new nodeState
    }

    // Important: Serialize the entire `nodeId` data, not just its contents
    workflowData[nodeId] = JSON.stringify(workflowData[nodeId]);

    // Save the updated workflow state back to KV storage
    await fetch(`${KV_REST_API_URL}/set/${workflowKey}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
      method: method,
      body: JSON.stringify(workflowData),
    }).then(response => response.json())
      .then(data => console.log('Updated workflow data:', data));
  } catch (error) {
    console.error('Error setting workflow node state:', error);
  }
}


