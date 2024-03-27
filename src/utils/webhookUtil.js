import axios from 'axios';
function resolvePath(path, obj) {
    return path.split(/[\.\[\]\'\"]/).filter(p => p).reduce((res, key) => res[key], obj);
}

function replacePlaceholders(text, webhookOutput) {
    const placeholderPattern = /\{\{([\w\.\[\]\'\"]+)\}\}/g;
    return text.replace(placeholderPattern, (match, path) => {
        const resolvedValue = resolvePath(path, webhookOutput);
        return resolvedValue !== undefined ? resolvedValue : match;
    });
}

export async function webhookHttpNode(node, webhook_output = null) {
    // Ensure webhook_output is an object
    const webhookOutput = typeof webhook_output === 'object' ? webhook_output : {};

    const method = node.data?.actions?.method?.toLowerCase();
    const url = replacePlaceholders(node.data?.inputParameters?.url, webhookOutput);
    const headersArray = node.data?.inputParameters?.headers || [];
    const headers = headersArray.reduce((acc, header) => {
        if (header.key && header.value) {
            // Apply placeholder replacement for each header value
            acc[header.key] = replacePlaceholders(header.value, webhookOutput);
        }
        return acc;
    }, {});

    let data;
    try {
        // For POST and PUT requests, replace placeholders in body
        if (method === 'post' || method === 'put') {
            const bodyWithPlaceholders = node.data?.inputParameters?.body || '{}';
            const bodyWithReplacements = replacePlaceholders(bodyWithPlaceholders, webhookOutput);
            data = JSON.parse(bodyWithReplacements);
        }
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

        // Further response handling...
        return response.data;
    } catch (error) {
        console.error(`Error executing HTTP node ${node.id}:`, error);
        throw error;
    }
}
