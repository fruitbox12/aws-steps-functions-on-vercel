import axios from 'axios';

async function replacePlaceholdersWithTestData(node, testData) {
  let urlString = node.data?.inputParameters?.url; // Access the URL that might contain placeholders
  const startPlaceholder = "{{";
  const endPlaceholder = "}}";

  let startIndex = urlString.indexOf(startPlaceholder);
  while (startIndex !== -1) {
    const endIndex = urlString.indexOf(endPlaceholder, startIndex);
    if (endIndex === -1) {
      break; // No closing "}}" found; exit loop
    }

    // Extract placeholder content, excluding "{{" and "}}"
    const placeholderContent = urlString.substring(startIndex + startPlaceholder.length, endIndex).trim();
    const keyPath = placeholderContent.split('.');

    // Initialize `value` to point to the start of your `testData` structure
    let value = testData;
    for (let i = 0; i < keyPath.length; i++) {
      if (value[keyPath[i]] !== undefined) {
        value = value[keyPath[i]];
      } else {
        // Key not found; log an error or handle as needed
        console.error(`Key not found: ${keyPath[i]}`);
        value = null;
        break;
      }
    }

    // If a valid value was found, replace the placeholder in the URL with this value
    if (value !== null) {
      urlString = urlString.slice(0, startIndex) + value + urlString.slice(endIndex + endPlaceholder.length);
      // Update startIndex for the next iteration to search for the next placeholder
      startIndex = urlString.indexOf(startPlaceholder, startIndex + value.toString().length);
    } else {
      console.error(`Placeholder {{${placeholderContent}}} could not be replaced because the key path does not exist.`);
      // Move past this placeholder to continue searching
      startIndex = urlString.indexOf(startPlaceholder, endIndex + endPlaceholder.length);
    }
  }

  console.log(urlString); // For demonstration
  return urlString; // Return the processed URL
}


// Note: This function assumes a very specific structure for the placeholders and the output array.
// Depending on the complexity and variability of your placeholders and data structures,
// you might need a more sophisticated parser or processor.

export async function webhookHttpNode(node, output) {
    const method = node.data?.actions?.method?.toLowerCase();
    // asssume url contains    https://swapi.dev/api/people/{{http_0[0].data.usage.completion_tokens}}

    const url = await replacePlaceholdersWithTestData(node, output) || node.data?.inputParameters?.url;
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
