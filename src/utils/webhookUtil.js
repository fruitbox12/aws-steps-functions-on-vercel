import axios from 'axios';


function replaceTemplateVariables(url, data) {
    // Regular expression to match template variables enclosed in double curly braces
    const templateVariableRegex = /\{\{(.*?)\}\}/g;
    
    return url.replace(templateVariableRegex, (match, path) => {
        // Split the path by dots and brackets to navigate through the data object
        const pathSegments = path.replace(/\[|\]\.?/g, '.').split('.').filter(Boolean);
        
        // Reduce the path segments to get the final value from the data object
        const replacement = pathSegments.reduce((currentData, segment) => {
            return (currentData && currentData[segment] !== undefined) ? currentData[segment] : match;
        }, data);
        
        // Return the replacement if found, or the original match if not
        return replacement !== match ? replacement : match;
    });
}

// Example usage:



// Note: This function assumes a very specific structure for the placeholders and the output array.
// Depending on the complexity and variability of your placeholders and data structures,
// you might need a more sophisticated parser or processor.

export async function webhookHttpNode(node) {
    const method = node.data?.actions?.method?.toLowerCase();
    // asssume url contains    https://swapi.dev/api/people/{{http_0[0].data.usage.completion_tokens}}
const urlTemplate = "https://swapi.dev/api/people/{{http_0[0].data.usage.prompt_tokens}}";
const data = {
    http_0: [
        {
            data: {
                usage: {
                    prompt_tokens: 42
                }
            }
        }
    ]
};
    const url =  replaceTemplateVariables(urlTemplate, data) || node.data?.inputParameters?.url ;
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
