import axios from 'axios';

export async function executeHttpNode(node) {
    // Safely access parameters with a fallback to prevent TypeError
    const method = node.data?.actions?.method;
    const url = node.data?.inputParameters?.url;
    
    // Check if method and url are defined
    if (!method || !url) {
        console.error(`Missing method or URL in node ${node.id}`);
        throw new Error(`Missing method or URL in node ${node.id}`);
    }

    const requestData = {
        method: method, // Pass the method obtained from the node
        url: url // Pass the url obtained from the node
      };
      
      try {
          const response = await axios(requestData);
        console.log(`Node ${node.id} executed with result:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error executing HTTP node ${node.id}:`, error);
        throw error; // Rethrow the error to handle it in the calling context
    }
}
