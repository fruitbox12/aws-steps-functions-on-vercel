import axios from 'axios';

async function replacePlaceholdersWithTestData(node, testData) {
    const placeholderPattern = /\{\{([^}]+)\}\}/g;
    let urlString = node.data?.inputParameters?.url; // Access the URL that might contain placeholders

    const matches = [...urlString.matchAll(placeholderPattern)];

    for (const match of matches) {
        const placeholder = match[0];
        const keyPath = match[1].split('.'); // Splits the key into parts by dot notation

        // Find the corresponding test data based on nodeId
        const nodeId = keyPath[0];
        const targetData = testData.find(d => d.nodeId === nodeId);

        if (!targetData) {
            console.warn(`No data found for nodeId: ${nodeId}`);
            continue; // Skip if no matching data is found
        }

        // Attempt to resolve the value from the nested data structure
        let resolvedValue = targetData;
        for (const key of keyPath.slice(1)) { // Skip the nodeId part since it's already used
            if (resolvedValue && typeof resolvedValue === 'object') {
                resolvedValue = resolvedValue[key];
            } else {
                // Cannot resolve further, might be an invalid key path
                resolvedValue = null;
                break;
            }
        }

        if (resolvedValue !== null && resolvedValue !== undefined) {
            urlString = urlString.replace(placeholder, resolvedValue);
        } else {
            console.warn(`Could not resolve value for placeholder: ${placeholder}`);
        }
    }

    // Here, urlString should have all its placeholders replaced
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
