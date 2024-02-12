// utils/httpRequestExecutor.js
import axios from 'axios';

/**
 * Executes an HTTP request based on the provided node definition.
 * @param {Object} node - The node object containing the HTTP request definition.
 * @returns {Promise<Object>} The response data from the HTTP request.
 */
export async function executeHttpNode(node) {
    const { method, url, headers, body } = node.data.parameters;

    try {
        const response = await axios({
            method,
            url,
            headers,
            data: body,
        });
        console.log(`Node ${node.id} executed with result:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error executing HTTP node ${node.id}:`, error);
        throw error; // Rethrow the error to handle it in the calling context
    }
}
