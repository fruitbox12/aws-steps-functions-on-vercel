import axios from 'axios';

/**
 * Registers a cron job based on scheduler node details.
 * @param {Object} schedulerNode - The scheduler node containing the cron job details.
 * @returns {Promise<Object>} - The response from the cron job service.
 */
export async function registerCron(schedulerNode) {
    const cronJobPayload = {
        job: {
            url: "https://swapi.dev/api/people/1", // Replace with your actual URL
            enabled: "true",
            saveResponses: true,
            schedule: {
                timezone: "Europe/Berlin",
                expiresAt: 0,
                hours: [schedulerNode.data.inputParameters.scheduleTimes[0].hour],
                mdays: [schedulerNode.data.inputParameters.scheduleTimes[0].dayOfMonth],
                minutes: [schedulerNode.data.inputParameters.scheduleTimes[0].minute],
                months: [-1], // Assuming every month
                wdays: [-1] // Assuming every day of the week
            }
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
