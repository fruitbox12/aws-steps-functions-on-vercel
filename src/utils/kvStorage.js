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

    let workflowData = await response.json(); // Make sure this JSON.parse() is safe by checking response status
    let method = 'PATCH'; // Default to PATCH, assuming you're updating existing data

    if (!workflowData || typeof workflowData !== 'object' || Object.keys(workflowData).length === 0) {
      method = 'POST'; // Switch to POST if creating new data
      workflowData = {}; // Initialize for new data
    }

    // Initialize or update nodeId with nodeState within the workflow
    let nodeData;
    if (!workflowData[nodeId]) {
      nodeData = { result: null, [nodeId]: [{ data: nodeState }] };
    } else {
      // Safely parse the existing or default nodeData
      try {
        nodeData = JSON.parse(workflowData[nodeId]) || { result: null };
      } catch (parseError) {
        console.error('Error parsing existing nodeData:', parseError);
        nodeData = { result: null }; // Default to a safe value
      }

      if (!Array.isArray(nodeData[nodeId])) {
        nodeData[nodeId] = [];
      }
      nodeData[nodeId].push({ data: nodeState });
    }

    // Always re-stringify the nodeData before saving
    workflowData[nodeId] = JSON.stringify(nodeData);

    // Save the updated workflow state back to KV storage
    const saveResponse = await fetch(`${KV_REST_API_URL}/set/${workflowKey}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
      method: method,
      body: JSON.stringify(workflowData),
    });

    if (!saveResponse.ok) {
      throw new Error(`Failed to save workflow state, server responded with status: ${saveResponse.status}`);
    }

    console.log('Updated workflow data successfully');
  } catch (error) {
    console.error('Error setting workflow node state:', error);
  }
}


