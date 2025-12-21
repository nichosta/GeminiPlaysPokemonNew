import { postToMgba } from "./client";
import { readUint32, EMERALD } from "@gempp/core";

// Address constants
const PLAYER_AVATAR_ADDR = EMERALD.PLAYER_AVATAR_ADDR;
const PLAYER_AVATAR_FLAGS_OFFSET = 0x00;
const MACH_BIKE_FLAG = 1 << 1; // 0x02

/**
 * Presses a sequence of buttons.
 */
export async function pressButtons(buttons: string[]): Promise<boolean> {
    try {
        // The mGBA endpoint might accept a list or single. Assuming list based on typical implementations.
        // If the endpoint is strictly one-by-one, we loop. 
        // Based on spec "Sends sequence to mGBA", we'll post to /buttons/press.
        // If the server expects { buttons: [...] }, we send that.
        // Verify payload format from old project? old project used `sendButtonHoldCommand` which was singular.
        // But here we are defining a new standard. I will assume the server accepts `buttons: string[]`.
        // If strictly replicating old server, I might need to loop input.
        // For now, I'll loop to be safe and compatible with simple endpoints.

        for (const btn of buttons) {
            await postToMgba("/buttons/press", { button: btn });
            // Small delay? usually handled by server or not needed for purely press.
        }
        return true;
    } catch (error) {
        console.error("pressButtons failed:", error);
        return false;
    }
}

/**
 * Holds a button for a specific duration.
 * RESTRICTED: Only allowed if Player is on a Mach Bike.
 */
export async function holdButtons(button: string, duration: number): Promise<boolean> {
    // 1. Validate Mach Bike State
    const flags = await readUint32(PLAYER_AVATAR_ADDR + PLAYER_AVATAR_FLAGS_OFFSET);
    const isMachBike = (flags & MACH_BIKE_FLAG) !== 0;

    if (!isMachBike) {
        throw new Error("Safety Constraint: 'hold_buttons' is only allowed when riding the Mach Bike.");
    }

    // 2. Execute Hold
    try {
        await postToMgba("/buttons/hold", { button, duration });
        return true;
    } catch (error) {
        console.error("holdButtons failed:", error);
        return false;
    }
}
