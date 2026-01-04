/**
 * mGBA-http client
 * 
 * Low-level HTTP client for mGBA-http API.
 * Uses query parameters as per the mGBA-http swagger schema.
 */

const BASE_URL = process.env.MGBA_HTTP_URL ?? "http://localhost:5000";

/**
 * Sends a POST request to the mGBA HTTP server with query parameters.
 * 
 * @param endpoint - The API endpoint (e.g., "/mgba-http/button/tap")
 * @param params - Query parameters to include
 */
export async function postToMgba(endpoint: string, params: Record<string, string | number>): Promise<void> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
    }

    const response = await fetch(url.toString(), { method: "POST" });

    if (!response.ok) {
        throw new Error(`mGBA HTTP request failed: ${response.status} ${response.statusText}`);
    }
}

/**
 * Sends a GET request to the mGBA HTTP server.
 * 
 * @param endpoint - The API endpoint
 * @param params - Query parameters to include
 * @returns The response text
 */
export async function getFromMgba(endpoint: string, params?: Record<string, string | number>): Promise<string> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, String(value));
        }
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`mGBA HTTP request failed: ${response.status} ${response.statusText}`);
    }

    return response.text();
}
