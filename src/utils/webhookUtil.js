import axios from 'axios';

function resolvePath(path, obj) {
    return path.split(/[\.\[\]\'\"]/).filter(p => p).reduce((res, key) => res !== undefined ? res[key] : undefined, obj);
}
function getWebhookOutputValue(placeholder, webhookOutput) {
    const path = placeholder.split('.');
    let value = webhookOutput;
    for (const key of path) {
        if (value && value.hasOwnProperty(key)) {
            value = value[key];
        } else {
            value = undefined;
            break;
        }
    }
    return value;
}

function replacePlaceholders(text, currentNode, allNodes, webhookOutput) {
    return text.replace(/\{\{([\w.\[\]']+)\}\}/g, (match, path) => {
        let resolvedValue = resolvePath(path, webhookOutput);

        if (resolvedValue === undefined) {
            const nodeIdMatch = path.match(/^(\w+)/);
            if (nodeIdMatch) {
                const nodeId = nodeIdMatch[1];
                const node = allNodes.find(n => n.id === nodeId);
                if (node) {
                    const newPath = path.replace(`${nodeId}.`, '');
                    resolvedValue = resolvePath(newPath, node.data);
                }
            }
        }

        // Use getWebhookOutputValue to resolve placeholders in webhookOutput
        if (resolvedValue === undefined && webhookOutput) {
            resolvedValue = getWebhookOutputValue(path, webhookOutput);
        }

        return resolvedValue !== undefined ? resolvedValue : match;
    });
}

export async function webhookHttpNode(node, allNodes, webhook_output = {}) {
    const method = node.data?.actions?.method?.toLowerCase();
    const url = replacePlaceholders(node.data?.inputParameters?.url, node, allNodes, webhook_output);
    const headers = {};

    // Process headers
    node.data?.inputParameters?.headers.forEach(header => {
        const key = replacePlaceholders(header.key, node, allNodes, webhook_output);
        const value = replacePlaceholders(header.value, node, allNodes, webhook_output);
        if (key.trim() !== '') { // Check if key is not empty after placeholder replacement
            headers[key] = value;
        }
    });

    let data = {};
    if (['post', 'put'].includes(method)) {
        const bodyWithPlaceholders = node.data?.inputParameters?.body || '{}';
        const processedBody = replacePlaceholders(bodyWithPlaceholders, node, allNodes, webhook_output);
        data = JSON.parse(processedBody);
    }

    try {
        const response = await axios({ method, url, headers, data });
        console.log(`Node ${node.id} executed with result:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error executing HTTP node ${node.id}:`, error);
        throw error;
    }
}
