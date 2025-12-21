import {
    readUint32,
    writeUint32,
    EMERALD
} from "@gempp/core";

const OBJECT_EVENT_SIZE = 0x24; // Size of one ObjectEvent struct
const OBJECT_EVENTS_ADDR = EMERALD.OBJECT_EVENTS_ADDR; // Base address
const OBJECT_EVENT_FLAGS_OFFSET = 0x00; // Offset to flags
const FROZEN_BIT = 8; // Bit 8: Frozen
const SINGLE_MOVEMENT_ACTIVE_BIT = 1; // Bit 1: singleMovementActive
const HELD_MOVEMENT_ACTIVE_BIT = 6; // Bit 6: heldMovementActive

const SAFETY_WAIT_MS = 32; // Wait ~2 frames between checks
const SAFETY_TIMEOUT_MS = 2000; // Max wait time

/**
 * Freezes an NPC to prevent movement.
 * Safe against softlocks by waiting for the NPC to finish any active movement.
 * @param id NPC Index (1-15). ID 0 is player.
 */
export async function stunNpc(id: number): Promise<boolean> {
    if (id < 1 || id > 15) {
        throw new Error(`Invalid NPC ID: ${id}. Must be between 1 and 15.`);
    }

    const npcBaseAddr = OBJECT_EVENTS_ADDR + (id * OBJECT_EVENT_SIZE);
    const flagsAddr = npcBaseAddr + OBJECT_EVENT_FLAGS_OFFSET;

    // Safety Wait Loop
    const startTime = Date.now();
    let isSafe = false;

    while (Date.now() - startTime < SAFETY_TIMEOUT_MS) {
        const flags = await readUint32(flagsAddr);
        const singleMovementActive = (flags >> SINGLE_MOVEMENT_ACTIVE_BIT) & 1;
        const heldMovementActive = (flags >> HELD_MOVEMENT_ACTIVE_BIT) & 1;

        if (!singleMovementActive && !heldMovementActive) {
            isSafe = true;
            break;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, SAFETY_WAIT_MS));
    }

    if (!isSafe) {
        throw new Error(`Failed to stun NPC ${id}: NPC is busy moving (timeout).`);
    }

    // Apply Stun
    // Re-read flags to ensure atomicity (as much as possible) and toggle bit
    const currentFlags = await readUint32(flagsAddr);
    const newFlags = currentFlags ^ (1 << FROZEN_BIT);
    await writeUint32(flagsAddr, newFlags);

    return true;
}
