import axios from 'axios';

export async function executeDiscordNode(inputParameters) {
    try {
        // Implement the logic to send message to Discord webhook here
        const message = inputParameters.content;
        const webhookUrl = inputParameters.webhookUrl + "?wait=true";
        // Construct the message body
        const body = {
            content: message
        };
        // Send the message to Discord webhook
        const response = await axios.post(webhookUrl, body);
        return { data: response.data };
    } catch (error) {
        console.error('Error executing Discord node:', error);
        return { error: error.message || 'Unknown error during Discord node execution' };
    }
}
