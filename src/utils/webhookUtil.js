import axios from 'axios';

function replaceUrlPlaceholder(currentNode, nodes, output) {
  if (currentNode.data.inputParameters && currentNode.data.inputParameters.url) {
    // Pattern to match placeholders like "{{http_0[0].data.usage.prompt_tokens}}"
    let placeholderPattern = /\{\{([^\]]+)\}\}/g;
    currentNode.data.inputParameters.url = currentNode.data.inputParameters.url.replace(placeholderPattern, (match, placeholder) => {
      // Extracting the nodeId and path from the placeholder
      let [placeholderNodeId, outputIndex, ...pathParts] = placeholder.split(/[.\[\]]/).filter(Boolean);
      // Find the node's output that matches the placeholderNodeId
      const placeholderNodeOutput = output.find(o => nodes.some(n => n.id === placeholderNodeId && o.nodeId === placeholderNodeId));
      
      if (!placeholderNodeOutput) {
        console.error(`Output for nodeId ${placeholderNodeId} not found.`);
        return match; // Return the original placeholder if corresponding output not found
      }
      
      // Navigate through the placeholderNodeOutput's data to get the replacement value
      let valueToReplace = placeholderNodeOutput.data;
      for (const part of pathParts) {
        if (valueToReplace && typeof valueToReplace === 'object' && part in valueToReplace) {
          valueToReplace = valueToReplace[part];
        } else {
          console.error(`Failed to resolve ${part} in output for nodeId ${placeholderNodeId}`);
          return match; // Return the original placeholder if any part of the path cannot be resolved
        }
      }

      return valueToReplace.toString();
    });
  }
  
  return currentNode; // Returns the currentNode with its URL updated
}


// Note: This function assumes a very specific structure for the placeholders and the output array.
// Depending on the complexity and variability of your placeholders and data structures,
// you might need a more sophisticated parser or processor.

export async function webhookHttpNode(node, nodes, output) {
    const method = node.data?.actions?.method?.toLowerCase();
    // asssume url contains    https://swapi.dev/api/people/{{http_0[0].data.usage.completion_tokens}}

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
