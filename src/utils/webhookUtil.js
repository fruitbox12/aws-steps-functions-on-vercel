import axios from 'axios';

function resolvePath(path, obj) {
    return path.split(/[\.\[\]\'\"]/).filter(p => p).reduce((res, key) => res !== undefined ? res[key] : undefined, obj);
}

function replacePlaceholders(text, nodes, webhookOutput) {
    return text.replace(/\{\{([\w\.\[\]\'\"]+)\}\}/g, (match, path) => {
        console.log("Attempting to resolve path:", path); // Debugging line
        let resolvedValue = resolvePath(path, webhookOutput);

        if (resolvedValue === undefined) {
            const nodeIdMatch = path.match(/^(\w+)/);
            if (nodeIdMatch) {
                const nodeId = nodeIdMatch[1];
                const node = nodes.find(n => n.id === nodeId);
                if (node) {
                    console.log(`Found node for ${nodeId}:`, node); // Debugging line
                    const newPath = path.replace(`${nodeId}.`, '');
                    resolvedValue = resolvePath(newPath, node.data);
                    console.log(`Resolved value for ${newPath}:`, resolvedValue); // Debugging line
                } else {
                    console.log(`Node not found for ID: ${nodeId}`); // Debugging line
                }
            }
        }

        return resolvedValue !== undefined ? resolvedValue : match;
    });
}



export async function webhookHttpNode(node, nodes, webhook_output) {
    const webhookOutput = typeof webhook_output === 'object' ? webhook_output : {};
    const method = node.data?.actions?.method?.toLowerCase();
    
    // Updated to pass nodes to replacePlaceholders
    const url = replacePlaceholders(node.data?.inputParameters?.url, nodes, webhookOutput);
    const headersArray = node.data?.inputParameters?.headers || [];
    const headers = headersArray.reduce((acc, header) => {
        if (header.key && header.value) {
            acc[header.key] = replacePlaceholders(header.value, nodes, webhookOutput); // Updated here as well
        }
        return acc;
    }, {});

    let data = {};
    try {
        if (['post', 'put'].includes(method)) {
            const bodyWithPlaceholders = node.data?.inputParameters?.body || '{}';
            const bodyWithReplacements = replacePlaceholders(bodyWithPlaceholders, nodes, webhookOutput); // And here
            data = JSON.parse(bodyWithReplacements);
        }
    } catch (error) {
        console.error(`Error parsing JSON body for node ${node.id}:`, error);
        throw error;
    }

    const axiosConfig = { method, url, headers, data };

    try {
        const response = await axios(axiosConfig);
        console.log(`Node ${node.id} executed with result:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error executing HTTP node ${node.id}:`, error);
        throw error;
    }
}
