import axios from 'axios';

function resolvePath(path, obj) {
    return path.split(/[\.\[\]\'\"]/).filter(p => p).reduce((res, key) => res !== undefined ? res[key] : undefined, obj);
}

function replacePlaceholders(text, nodes, webhookOutput) {
    return text.replace(/\{\{([\w\.\[\]\'\"]+)\}\}/g, (match, path) => {
        // First, try to resolve the path against the webhookOutput
        let resolvedValue = resolvePath(path, webhookOutput);

        // If unresolved, check if the path is intended to reference other nodes
        if (resolvedValue === undefined) {
            const pathParts = path.match(/(\w+)/g); // Simplistic split by word characters to interpret path segments
            if (pathParts && pathParts.length > 0) {
                const nodeId = pathParts[0];
                const nodeDataPath = pathParts.slice(1).join('.'); // Re-join the remaining parts as the path within the node's data

                // Find the referenced node by id
                const referencedNode = nodes.find(node => node.id === nodeId);
                if (referencedNode) {
                    // Attempt to resolve the path within the referenced node's data
                    resolvedValue = resolvePath(nodeDataPath, referencedNode.data);
                }
            }
        }

        return resolvedValue !== undefined ? resolvedValue : match;
    });
}

export async function webhookHttpNode(node, nodes, webhook_output = null) {
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
