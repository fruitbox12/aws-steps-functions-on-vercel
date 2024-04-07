import axios from 'axios';

/**
 * Registers a cron job based on scheduler node details.
 * @param {Object} schedulerNode - The scheduler node containing the cron job details.
 * @param {Object} schedulerNodes - The scheduler node containing the cron job details.

 * @returns {Promise<Object>} - The response from the cron job service.
 */

export async function registerCron(schedulerNode, schedulerNodes, shortId, tenantId) {
        const scheduleTime = schedulerNode.data.inputParameters.scheduleTimes[0];

    const cronJobPayload = {



        job: {
           url: `https://deployworkflow.vercel.app/api/step/1?stepEnd=1`, // Your actual URL
    enabled: true, // Assuming this should be a boolean
    saveResponses: true,
    schedule: {
        timezone: "Europe/Berlin", // Static value; adjust as necessary
        expiresAt: 0, // Static value; adjust as necessary
        hours: [scheduleTime.hour], // Dynamically set from schedulerNode
        mdays: [scheduleTime.dayOfMonth], // Dynamically set from schedulerNode
        minutes: [scheduleTime.minute], // Dynamically set from schedulerNode
        months: [-1], // Assuming every month, adjust if needed
        wdays: scheduleTime.weekday ? [parseInt(scheduleTime.weekday, 10)] : [-1] // Dynamically set from schedulerNode, with fallback to every day of the week

            },
            extendedData: {
                body: JSON.stringify({ nodes: schedulerNodes.map(node => node.data), shortId, tenantId }),  // Assuming schedulerNodes is an array of nodes
                headers: { "Content-Type": "application/json" }
            },            
            "requestMethod": 1

        }
    };

    try {
        const response = await axios.put('https://api.cron-job.org/jobs', cronJobPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 0KmI0NbwJZslG0Nam612DRaGhT/clSVvX1eGCdGncak=', // Securely manage this token
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error registering cron job:', error);
        throw error; // Rethrow the error to handle it in the calling function
    }
}
