import axios from 'axios';

export async function executeHttpNode(node) {
    const method = node.data?.actions?.method?.toLowerCase();
    const url = node.data?.inputParameters?.url;
    const headersArray = node.data?.inputParameters?.headers || [];
    const headers = headersArray.reduce((acc, header) => {
        if (header.key && header.value) acc[header.key] = header.value;
        return acc;
    }, {});

    let data;
    try {
        data = (method === 'post' || method === 'put') ? JSON.parse(node.data?.inputParameters?.body || '{}') : undefined;
    } catch (error) {
        console.error(`Error parsing JSON body for node ${node.id}:`, error);
    }

    // Set responseType conditionally based on node.data.responseType
    const axiosConfig = {
        method,
        url,
        headers,
        data,
        responseType: node.data.responseType === "base64" ? 'arraybuffer' : 'json'  // Set responseType to 'arraybuffer' only if needed
    };

    try {
        const response = await axios(axiosConfig);
        console.log(`Node ${node.id} executed with result:`, response);

        let extractedContent = "";

        // If the response is expected to be base64 and the data is received as a buffer
        if (node.data.responseType === "base64" && response.data) {
            // Convert buffer to base64 string
            const base64Content = Buffer.from(response.data, 'binary').toString('base64');
            console.log(`Base64 content:`, base64Content);
            extractedContent = base64Content;
            response.data = base64Content;  // Modify response.data to hold the base64 content
        }

        return response.data;
    } catch (error) {
        console.error(`Error executing HTTP node ${node.id}:`, error);
        throw error;
    }
}
