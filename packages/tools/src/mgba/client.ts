
const BASE_URL = "http://localhost:5000";

/**
 * Sends a POST request to the mGBA HTTP server.
 */
export async function postToMgba(endpoint: string, body: any): Promise<void> {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`mGBA HTTP request failed: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error(`Failed to post to mGBA ${endpoint}:`, error);
        throw error;
    }
}
