import axios from 'axios';

function resolvePath(path, obj) {
    return path.split(/[\.\[\]\'\"]/).filter(p => p).reduce((res, key) => res !== undefined ? res[key] : undefined, obj);
}

function getPlaceholderValue(placeholder, nodes, webhookOutput) {
    // Attempt to resolve from webhookOutput first
    if (webhookOutput && webhookOutput.hasOwnProperty(placeholder)) {
        return webhookOutput[placeholder];
    }

    // Find in nodes if not found in webhookOutput
    const nodeId = placeholder.split('.')[0];
    const propertyPath = placeholder.split('.').slice(1).join('.');

    const node = nodes.find(n => n.id === nodeId);
    if (node && node.data) {
        try {
            // Directly access the property if possible
            return eval(`node.data.${propertyPath}`);
        } catch (e) {
            console.error(`Error accessing property ${propertyPath} in node ${nodeId}:`, e);
        }
    }

    return null; // Return null if unresolved
}

function replacePlaceholders(text, nodes, webhookOutput) {
    return text.replace(/\{\{([\w\.\[\]\'\"]+)\}\}/g, (match, path) => {
        const placeholderValue = getPlaceholderValue(path, nodes, webhookOutput);
        return placeholderValue !== null ? placeholderValue : match;
    });
}



export async function webhookHttpNode(node, nodes, webhook_output = {}) {
    const method = node.data?.actions?.method?.toLowerCase();
    const url = replacePlaceholders(node.data?.inputParameters?.url, nodes, webhook_output);
    const headers = {}; // Initialize headers object

    // Process headers
    node.data?.inputParameters?.headers.forEach(header => {
        headers[header.key] = replacePlaceholders(header.value, nodes, webhook_output);
    });

    let data = {};
    if (['post', 'put'].includes(method)) {
        // Assuming body is a JSON string with potential placeholders
        const bodyWithPlaceholders = node.data?.inputParameters?.body || '{}';
        const processedBody = replacePlaceholders(bodyWithPlaceholders, nodes, webhook_output);
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
