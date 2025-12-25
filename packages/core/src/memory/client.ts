/**
 * Memory reading client for mGBA-http
 * Provides typed access to emulator memory via HTTP API
 * 
 * Note: mGBA-http returns raw values as text, not JSON
 */

const MGBA_HTTP_BASE = process.env.MGBA_HTTP_URL ?? "http://localhost:5000";

/**
 * Read an unsigned 8-bit value from memory
 */
export async function readUint8(address: number): Promise<number> {
    const response = await fetch(`${MGBA_HTTP_BASE}/core/read8?address=0x${address.toString(16)}`);
    if (!response.ok) {
        throw new Error(`Failed to read memory at 0x${address.toString(16)}: ${response.statusText}`);
    }
    const data = await response.text();
    return parseInt(data, 10);
}

/**
 * Read an unsigned 16-bit value from memory (little-endian)
 */
export async function readUint16(address: number): Promise<number> {
    const response = await fetch(`${MGBA_HTTP_BASE}/core/read16?address=0x${address.toString(16)}`);
    if (!response.ok) {
        throw new Error(`Failed to read memory at 0x${address.toString(16)}: ${response.statusText}`);
    }
    const data = await response.text();
    return parseInt(data, 10);
}

/**
 * Read an unsigned 32-bit value from memory (little-endian)
 */
export async function readUint32(address: number): Promise<number> {
    const response = await fetch(`${MGBA_HTTP_BASE}/core/read32?address=0x${address.toString(16)}`);
    if (!response.ok) {
        throw new Error(`Failed to read memory at 0x${address.toString(16)}: ${response.statusText}`);
    }
    const data = await response.text();
    return parseInt(data, 10);
}

/**
 * Read a range of bytes from memory
 * 
 * Note: mGBA-http v0.8.0 changed the response format from a JSON array of decimal values
 * to a comma-separated string of hex values (e.g., "cb,15,00,08,0e,00").
 * The 1024 byte limit that existed in v0.5.0 was fixed in v0.6.0, so chunking is no longer needed.
 */
export async function readRange(address: number, length: number): Promise<Uint8Array> {
    const response = await fetch(`${MGBA_HTTP_BASE}/core/readrange?address=0x${address.toString(16)}&length=${length}`);
    if (!response.ok) {
        throw new Error(`Failed to read memory range at 0x${address.toString(16)}: ${response.statusText}`);
    }
    // mGBA-http v0.8.0 returns bytes as a comma-separated string of hex values like "cb,15,00,08"
    const data = await response.text();
    const hexValues = data.split(',');
    const bytes = hexValues.map(hex => parseInt(hex.trim(), 16));
    return new Uint8Array(bytes);
}

/**
 * Check if the emulator is connected and responding
 */
export async function isEmulatorConnected(): Promise<boolean> {
    try {
        const response = await fetch(`${MGBA_HTTP_BASE}/core/currentFrame`, {
            signal: AbortSignal.timeout(1000)
        });
        return response.ok;
    } catch {
        return false;
    }
}
