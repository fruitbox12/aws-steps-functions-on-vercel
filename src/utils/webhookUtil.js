import axios from 'axios';

function replaceUrlPlaceholderInNode(node, nodes) {
    // Find the current node based on its ID
    const currentNode = nodes.find(node => node.id === currentNodeId);
    if (!currentNode) {
        console.error('Current node not found');
        return;
    }

    let urlString = currentNode.data.inputParameters.url;
    const placeholderPattern = /\{\{(.*?)\}\}/g;

    let match;
    while ((match = placeholderPattern.exec(urlString))) {
        const placeholderFull = match[0]; // The full placeholder including {{ and }}
        const placeholderParts = match[1].split(/[\[\].]+/); // Extracts nodeId and the path

        const referencedNodeId = placeholderParts[0]; // The ID of the node referred by the placeholder
        const referencedNode = nodes.find(node => node.id === referencedNodeId);

        if (!referencedNode) {
            console.error(`Referenced node ${referencedNodeId} not found.`);
            continue;
        }

        // Assume the value to replace is directly under data object as per your structure
        // Adjust the path navigation as necessary based on your actual data structure
        let value = referencedNode.data;
        for (let i = 1; i < placeholderParts.length; i++) { // Start from 1 to skip the nodeId part
            const key = placeholderParts[i];
            if (value[key] !== undefined) {
                value = value[key];
            } else {
                console.error(`Path not found: ${placeholderParts.slice(i).join('.')}`);
                value = null;
                break;
            }
        }

        if (value !== null) {
            urlString = urlString.replace(placeholderFull, value);
        }
    }

    // Update the current node's URL with the new urlString (where placeholders have been replaced)
  return urlString;
}

// Note: This function assumes a very specific structure for the placeholders and the output array.
// Depending on the complexity and variability of your placeholders and data structures,
// you might need a more sophisticated parser or processor.

export async function webhookHttpNode(node, nodes, output) {
    const method = node.data?.actions?.method?.toLowerCase();
    // asssume url contains    https://swapi.dev/api/people/{{http_0[0].data.usage.completion_tokens}}

    const url = await replacePlaceholderInUrl(node, nodes,output) || node.data?.inputParameters?.url;
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

        // Initialize a variable to hold the extracted content
        let extractedContent = "";

        // Check if the response includes 'choices' and has at least one choice
        if (response.data.choices && response.data.choices.length > 0) {
            const firstChoice = response.data.choices[0];

            // Assuming 'content' is directly on the choice object
            if (firstChoice.content) {
                console.log(`Content from the result:`, firstChoice.content);
                extractedContent = firstChoice.content;
            } else if (firstChoice.message && typeof firstChoice.message === 'object' && firstChoice.message.content) {
                // If 'content' is nested within a 'message' object
                console.log(`Content from the result:`, firstChoice.message.content);
                extractedContent = firstChoice.message.content;
            } else {
                console.log(`No content or unexpected format in the first choice.`);
            }
        } else {
            console.log(`No choices available in the response.`);
        }

        // Return or process the extracted content as needed
        return response.data;
    } catch (error) {
        console.error(`Error executing HTTP node ${node.id}:`, error);
        throw error;
    }
}
