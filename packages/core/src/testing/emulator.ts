/**
 * Emulator control utilities for testing via mGBA-http
 * 
 * Provides save state management for automated testing:
 * - Load/save state files
 * - Backup current state before tests
 * - Restore state after tests
 */

import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";

const MGBA_HTTP_BASE = process.env.MGBA_HTTP_URL ?? "http://localhost:5000";

/**
 * Convert a path to a format that mGBA (running on Windows) can understand.
 * 
 * When running from WSL, paths like `/mnt/c/repositories/...` need to be
 * converted to Windows paths like `C:\repositories\...`.
 * 
 * @param filePath - The path to convert
 * @returns Windows-compatible path
 */
function toMgbaPath(filePath: string): string {
    // Check if this is a WSL path (starts with /mnt/)
    const wslMatch = filePath.match(/^\/mnt\/([a-zA-Z])\/(.*)/);
    if (wslMatch) {
        const [, drive, rest] = wslMatch;
        // Convert to Windows path: C:\repositories\...
        return `${drive!.toUpperCase()}:\\${rest!.replace(/\//g, "\\")}`;
    }

    // Not a WSL path, just normalize backslashes to forward slashes
    // (in case we get a Windows path with forward slashes)
    return filePath.replace(/\//g, "\\");
}
/**
 * Release all buttons to ensure clean input state.
 * This should be called after loading a save state to prevent
 * button presses from previous operations from persisting.
 */
async function releaseAllButtons(): Promise<void> {
    const buttons = ["A", "B", "Start", "Select", "Up", "Down", "Left", "Right", "L", "R"];

    // Construct URL manually to handle array parameters
    const url = new URL(`${MGBA_HTTP_BASE}/mgba-http/button/clearmany`);
    for (const button of buttons) {
        url.searchParams.append("buttons", button);
    }

    await fetch(url.toString(), { method: "POST" })
        .catch(err => console.error("releaseAllButtons failed:", err));
}

/**
 * Load a save state file into the emulator
 * @param statePath - Absolute path to the .ss1 save state file
 */
export async function loadStateFile(statePath: string): Promise<void> {
    // Convert path for mGBA (handles WSL -> Windows conversion)
    const mgbaPath = toMgbaPath(statePath);

    // Release all buttons to ensure clean input state BEFORE loading
    await releaseAllButtons();

    // Load the state file
    const response = await fetch(
        `${MGBA_HTTP_BASE}/core/loadstatefile?path=${encodeURIComponent(mgbaPath)}`,
        { method: "POST" }
    );

    if (!response.ok) {
        throw new Error(`Failed to load state file "${mgbaPath}": ${response.statusText}`);
    }

    // Wait for the state to load and the emulator to settle.
    // We wait 500ms to ensure the emulator has processed the load and any initial frames.
    await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Save the current emulator state to a file
 * @param statePath - Absolute path where the .ss1 file should be saved
 */
export async function saveStateFile(statePath: string): Promise<void> {
    // Ensure directory exists (use the original path for fs operations)
    const dir = path.dirname(statePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Convert path for mGBA (handles WSL -> Windows conversion)
    const mgbaPath = toMgbaPath(statePath);

    const response = await fetch(
        `${MGBA_HTTP_BASE}/core/savestatefile?path=${encodeURIComponent(mgbaPath)}`,
        { method: "POST" }
    );

    if (!response.ok) {
        throw new Error(`Failed to save state file "${mgbaPath}": ${response.statusText}`);
    }
}

/**
 * Generate a unique temporary file path for state backups
 */
function getTempStatePath(): string {
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return path.join(tempDir, `gempp_backup_${timestamp}_${random}.ss1`);
}

/**
 * Manages save state backup and restoration for testing.
 * 
 * Usage:
 * ```typescript
 * const manager = new SaveStateManager();
 * await manager.backup();
 * await manager.load(fixtures.menus.partySlot0);
 * // ... run tests ...
 * await manager.restore(); // Restores backup and cleans up temp file
 * ```
 */
export class SaveStateManager {
    private backupPath: string | null = null;

    /**
     * Backup the current emulator state to a temp file.
     * Call this before loading test fixtures.
     */
    async backup(): Promise<void> {
        if (this.backupPath) {
            throw new Error("Backup already exists. Call restore() first.");
        }

        this.backupPath = getTempStatePath();
        await saveStateFile(this.backupPath);
    }

    /**
     * Load a save state file into the emulator
     */
    async load(statePath: string): Promise<void> {
        await loadStateFile(statePath);
    }

    /**
     * Restore the backed-up state and delete the temp file.
     * Safe to call even if no backup exists (will be a no-op).
     */
    async restore(): Promise<void> {
        if (!this.backupPath) {
            return; // No backup to restore
        }

        try {
            await loadStateFile(this.backupPath);
        } finally {
            // Always try to clean up the temp file
            try {
                if (fs.existsSync(this.backupPath)) {
                    fs.unlinkSync(this.backupPath);
                }
            } catch {
                // Ignore cleanup errors
            }
            this.backupPath = null;
        }
    }

    /**
     * Check if a backup currently exists
     */
    hasBackup(): boolean {
        return this.backupPath !== null;
    }
}

/**
 * Run a test function with a specific save state, automatically
 * backing up and restoring the current state.
 * 
 * Usage:
 * ```typescript
 * import { withSaveState, fixtures } from "@gempp/core/testing";
 * 
 * test("party menu detection", async () => {
 *   await withSaveState(fixtures.menus.partySlot0, async () => {
 *     const isOpen = await isPartyMenuOpen();
 *     expect(isOpen).toBe(true);
 *   });
 * });
 * ```
 * 
 * @param statePath - Path to the save state file to load
 * @param testFn - Test function to run while the state is loaded
 */
export async function withSaveState<T>(
    statePath: string,
    testFn: () => Promise<T>
): Promise<T> {
    const manager = new SaveStateManager();

    await manager.backup();

    try {
        await manager.load(statePath);
        return await testFn();
    } finally {
        await manager.restore();
    }
}
