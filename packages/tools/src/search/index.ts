/**
 * Searches the web for game information.
 * Implementation requires an API key (e.g. Google Custom Search).
 * Currently a placeholder.
 */
export async function webSearch(query: string): Promise<string> {
    console.warn("webSearch: External search API not configured.");
    return `[Mock Result] Search for "${query}" not implemented.`;
}
