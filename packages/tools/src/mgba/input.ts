import { postToMgba } from "./client";
import { isMachBike } from "@gempp/core";

/**
 * Presses a sequence of buttons.
 */
export async function pressButtons(buttons: string[]): Promise<boolean> {
    try {
        for (const btn of buttons) {
            await postToMgba("/buttons/press", { button: btn });
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
 * 
 * @param button - The button to hold (e.g., "Up", "A")
 * @param duration - Duration in milliseconds
 * @throws Error if player is not on Mach Bike
 */
export async function holdButtons(button: string, duration: number): Promise<boolean> {
    // 1. Validate Mach Bike State using core's player state reading
    const onMachBike = await isMachBike();

    if (!onMachBike) {
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
