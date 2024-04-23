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

    const axiosConfig = {
        method,
        url,
        headers,
        data
    };

    try {
        const response = await axios(axiosConfig);
        console.log(`Node ${node.id} executed with result:`, response.data);

        let extractedContent = "";

        // Handling base64 encoded data if responseType indicates so
        if (node.data.responseType === "base64" && response.data && typeof response.data === 'string') {
            const decodedContent = Buffer.from(response.data, 'base64').toString('utf8');
            console.log(`Decoded content:`, decodedContent);
            extractedContent = decodedContent;
            response.data = extractedContent; // Modify response.data only if you're sure it won't affect other logic
        }

        // Additional response handling
        if (response.data.choices && response.data.choices.length > 0) {
            const firstChoice = response.data.choices[0];
            if (firstChoice.content) {
                console.log(`Content from the result:`, firstChoice.content);
                extractedContent = firstChoice.content;
            } else if (firstChoice.message && typeof firstChoice.message === 'object' && firstChoice.message.content) {
                console.log(`Content from the result:`, firstChoice.message.content);
                extractedContent = firstChoice.message.content;
            } else {
                console.log(`No content or unexpected format in the first choice.`);
            }
        } else {
            console.log(`No choices available in the response.`);
        }

        return response.data;
    } catch (error) {
        console.error(`Error executing HTTP node ${node.id}:`, error);
        throw error;
    }
}
