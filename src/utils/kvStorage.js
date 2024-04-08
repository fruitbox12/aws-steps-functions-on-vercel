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
    // Fetch the current state of the workflow
    const response = await fetch(`${KV_REST_API_URL}/get/${workflowKey}`, {
      headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` },
    });

    let workflowData = await response.json();
    let method;

    // Determine if the workflow needs to be created or updated
    if (!workflowData || typeof workflowData !== 'object' || Object.keys(workflowData).length === 0) {
      method = 'POST'; // No existing workflowData implies a need to create it
      workflowData = {}; // Initialize to an empty object for new data
    } else {
      method = 'PATCH'; // Existing data implies an update
    }

    // Initialize or update the specific nodeId with nodeState within the workflow
    if (!workflowData[nodeId]) {
      // If nodeId doesn't exist, initialize it with an outer structure
      workflowData[nodeId] = JSON.stringify({ result: null, [nodeId]: [{ data: nodeState }] });
    } else {
      // If nodeId exists, parse its content and update
      let existingNodeData = JSON.parse(workflowData[nodeId]);

      // Check if the nodeId entry is correctly formatted and has an array to push to; if not, create it
      if (!existingNodeData[nodeId] || !Array.isArray(existingNodeData[nodeId])) {
        existingNodeData[nodeId] = [];
      }

      // Add the new nodeState to the nodeId array
      existingNodeData[nodeId].push({ data: nodeState });

      // Re-stringify the updated node data
      workflowData[nodeId] = JSON.stringify(existingNodeData);
    }

    // Save the updated workflow state back to KV storage
    await fetch(`${KV_REST_API_URL}/set/${workflowKey}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
      method: method, // Use the determined method (POST or PATCH)
      body: JSON.stringify(workflowData),
    })
    .then(response => response.json())
    .then(data => console.log('Updated workflow data:', data));
  } catch (error) {
    console.error('Error setting workflow node state:', error);
  }
}


