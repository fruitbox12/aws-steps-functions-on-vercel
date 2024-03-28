import axios from 'axios';

function replaceUrlPlaceholder(currentNode, nodes, output) {
  let url = currentNode.data.inputParameters.url;
  // Assuming the placeholder format is "{{nodeId.data.path.to.value}}"
  let placeholderPattern = /\{\{([^}]+)\}\}/g;
  
  const urlString = url.replace(placeholderPattern, (match, path) => {
    // Split the path into parts: [nodeId, "data", ...]
    const parts = path.split('.');
    const referencedNodeId = parts.shift(); // Extracts the node ID
    const referencedNodeOutput = output.find(node => node.nodeId === referencedNodeId);

    if (!referencedNodeOutput) {
      console.error(`Referenced node output for ${referencedNodeId} not found.`);
      return match; // Return the original placeholder if the node is not found in the output
    }

    // Navigate through the referencedNodeOutput's data based on the remaining parts
    let value = referencedNodeOutput.data; // Assuming data is directly under the node output
    for (const part of parts) {
      if (value && typeof value === 'object' && value[part] !== undefined) {
        value = value[part];
      } else {
        console.error(`Failed to resolve ${part} in output for ${referencedNodeId}`);
        return match; // Return the original placeholder if any part of the path cannot be resolved
      }
    }

    return value || match; // Replace the placeholder with the value, if found; otherwise, keep the placeholder
  });

  return urlString;
}

// Note: This function assumes a very specific structure for the placeholders and the output array.
// Depending on the complexity and variability of your placeholders and data structures,
// you might need a more sophisticated parser or processor.

export async function webhookHttpNode(node, nodes, output) {
    const method = node.data?.actions?.method?.toLowerCase();
    // asssume url contains    https://swapi.dev/api/people/{{http_0[0].data.usage.completion_tokens}}

    const url = await replaceUrlPlaceholder(node, nodes,output) || node.data?.inputParameters?.url;
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
