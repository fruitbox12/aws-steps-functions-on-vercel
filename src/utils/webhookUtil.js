import axios from 'axios';

async function replacePlaceholderInUrl(node, testData) {
  // Ensure urlString is a string.
  let urlString = node.data?.inputParameters?.url;
  if (typeof urlString !== 'string') {
    console.error('urlString is not a string:', urlString);
    return urlString; // Return the original input or handle this case as appropriate.
  }

  const startPlaceholder = "{{";
  const endPlaceholder = "}}";

  let startIndex = urlString.indexOf(startPlaceholder);
    while (startIndex !== -1) {
        const endIndex = urlString.indexOf(endPlaceholder, startIndex);
        if (endIndex === -1) {
            break; // No closing "}}" found; exit loop
        }

        // Extract the key path from the placeholder
        const keyPath = urlString.substring(startIndex + startPlaceholder.length, endIndex).trim().split(/[.[\]]/).filter(Boolean);
        
        // Find the corresponding test data based on the nodeId
        const nodeId = keyPath.shift(); // The first part of the keyPath is the nodeId
        let node = testData.find(item => item.nodeId === nodeId);
        
        if (!node) {
            console.error(`Node with nodeId ${nodeId} not found.`);
            break;
        }
        
        // Navigate through the data based on the remaining key path
        let value = node.data[0]; // Starting point based on your structure
        for (const key of keyPath) {
            if (value && typeof value === 'object') {
                value = value[key];
            } else {
                console.error(`Could not resolve path: ${keyPath.join('.')}`);
                value = null;
                break;
            }
        }

        // Replace the placeholder with the value if found
        if (value !== null) {
            urlString = urlString.slice(0, startIndex) + value + urlString.slice(endIndex + endPlaceholder.length);
            startIndex = urlString.indexOf(startPlaceholder, startIndex + value.toString().length);
        } else {
            console.error(`Placeholder {{${keyPath.join('.')}}} could not be replaced because the key path does not exist.`);
            startIndex = urlString.indexOf(startPlaceholder, endIndex + endPlaceholder.length);
        }
    }

    return urlString; // Return the processed URL
}

// Note: This function assumes a very specific structure for the placeholders and the output array.
// Depending on the complexity and variability of your placeholders and data structures,
// you might need a more sophisticated parser or processor.

export async function webhookHttpNode(node, output) {
    const method = node.data?.actions?.method?.toLowerCase();
    // asssume url contains    https://swapi.dev/api/people/{{http_0[0].data.usage.completion_tokens}}

    const url = await replacePlaceholderInUrl(node, output) || node.data?.inputParameters?.url;
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
