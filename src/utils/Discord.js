import axios from 'axios';

export async function executeDiscordNode(node) {
    try {    
        // Implement the logic to send message to Discord webhook here
        const message = node.data?.inputParameters?.content;
        const webhookUrl = node.data?.inputParameters?.webhookUrl + "?wait=true";
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
