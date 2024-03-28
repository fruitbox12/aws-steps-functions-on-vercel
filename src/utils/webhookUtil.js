import axios from 'axios';

function replaceUrlPlaceholder(currentNode, nodes, output) {
  let url = currentNode.data.inputParameters.url;
  // Match placeholders in the URL
  let placeholderPattern = /\{\{([^}]+)\}\}/g;
  let urlString = url.replace(placeholderPattern, (match, nodeIdPath) => {
    // Extract node ID and path from the placeholder
    let [nodeId, ...pathParts] = nodeIdPath.split('.');
    
    // Find the corresponding node output using nodeId
    const nodeOutput = output.find(o => {
      // Assuming node output data structure includes nodeId for matching
      let node = nodes.find(n => n.nodeId === nodeId);
      return node && o.data.id === node.data.id;
    });

    if (!nodeOutput) {
      console.error(`Output for nodeId ${nodeId} not found.`);
      return match;
    }

    // Navigate through the nodeOutput data based on pathParts
    let value = nodeOutput.data;
    for (const part of pathParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        console.error(`Failed to resolve path ${pathParts.join('.')} in output for nodeId ${nodeId}`);
        return match;
      }
    }

    return value.toString() || match;
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
