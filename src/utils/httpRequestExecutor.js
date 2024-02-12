import axios from 'axios';

export async function executeHttpNode(node) {
    // Safely access parameters with a fallback to prevent TypeError
    const { method, url } = node.data?.parameters || {};

    // Check if method and url are defined
    if (!method || !url) {
        console.error(`Missing method or URL in node ${node.id}`);
        throw new Error(`Missing method or URL in node ${node.id}`);
    }

    try {
        const response = await axios({ method, url });
        console.log(`Node ${node.id} executed with result:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error executing HTTP node ${node.id}:`, error);
        throw error; // Rethrow the error to handle it in the calling context
    }
}
