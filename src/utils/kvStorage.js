// utils/kvStorage.js
import axios from 'axios';

const KV_STORAGE_BASE_URL = "https://renewing-heron-48789.kv.vercel-storage.com";
const AUTH_HEADER = { Authorization: `Bearer Ab6VASQgZmYxOTk0ZjUtN2JlNS00MDJjLThkN2ItZjg1ZmE5ZGNhZTUwNDJhMzU2MjQyMjExNDJkNmJmYWFjYjNmYmU4NDlkY2U=` };

export async function getWorkflowState(key) {
  try {
    const response = await axios.get(`${KV_STORAGE_BASE_URL}/get/${key}`, { headers: AUTH_HEADER });
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
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
