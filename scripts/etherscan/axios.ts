import axios, { AxiosRequestConfig } from "axios";

export async function get(url: string, config?: AxiosRequestConfig) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error: any) {
        throw new Error(`Failed to retrieve data: ${error.message}`);
    }
}