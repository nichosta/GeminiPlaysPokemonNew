import { postToMgba } from "../mgba/client";
import { readUint32, readUint8, readUint16, EMERALD } from "@gempp/core";

// Constants
const PLAYER_AVATAR_ADDR = EMERALD.PLAYER_AVATAR_ADDR;
const PLAYER_OBJ_ID_OFFSET = 0x05;
const OBJECT_EVENTS_ADDR = EMERALD.OBJECT_EVENTS_ADDR; // Should be exported by core
const OBJECT_EVENT_SIZE = 0x24;
const COORDS_OFFSET = 0x10; // X is 0x10, Y is 0x12

const STEP_DURATION_MS = 250; // Conservative walking speed per tile

interface Point {
    x: number;
    y: number;
}

async function getPlayerPosition(): Promise<Point> {
    // 1. Get Player Object ID
    const playerId = await readUint8(PLAYER_AVATAR_ADDR + PLAYER_OBJ_ID_OFFSET);

    // 2. Get Object Address
    const playerObjAddr = OBJECT_EVENTS_ADDR + (playerId * OBJECT_EVENT_SIZE);

    // 3. Read Coords
    // We can read 32 bits at 0x10 to get X (low 16) and Y (high 16) together or separately
    // Structure is Coords16 { s16 x; s16 y; }
    // X at 0x10, Y at 0x12.
    // Let's read individually for clarity/safety with 16-bit reads if available, or 32-bit and shift.
    // Core likely exports readUint16.
    const x = await readUint16(playerObjAddr + COORDS_OFFSET);
    const y = await readUint16(playerObjAddr + COORDS_OFFSET + 2); // 0x10 + 2 = 0x12

    return { x, y };
}

export async function navigate(path: Point[]): Promise<boolean> {
    if (path.length === 0) return true;

    // Verify start position matches current position?
    // Not strictly required by spec ("Input: Array..."), but good practice.
    // We'll perform runtime verification of each step.

    for (const target of path) {
        const startPos = await getPlayerPosition();

        let button = "";
        if (target.y < startPos.y) button = "Up";
        else if (target.y > startPos.y) button = "Down";
        else if (target.x < startPos.x) button = "Left";
        else if (target.x > startPos.x) button = "Right";
        else {
            // Same position, skip
            continue;
        }

        // Execute Move
        await postToMgba("/buttons/press", { button });
        await new Promise(resolve => setTimeout(resolve, STEP_DURATION_MS));

        // Verify Position
        const newPos = await getPlayerPosition();
        if (newPos.x !== target.x || newPos.y !== target.y) {
            console.error(`Navigation blocked. Expected ${target.x},${target.y}, got ${newPos.x},${newPos.y}`);
            return false; // Stopped/Blocked
        }
    }

    return true;
}
