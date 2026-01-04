/**
 * Input tools for sending button presses to mGBA-http
 * 
 * Uses the mGBA-http convenience API endpoints:
 * - /mgba-http/button/tap - press and release a button
 * - /mgba-http/button/hold - hold a button for N frames
 */

import { postToMgba } from "./client";
import { isMachBike } from "@gempp/core";

/**
 * Valid button names for mGBA-http
 */
export type ButtonName = "A" | "B" | "Start" | "Select" | "Right" | "Left" | "Up" | "Down" | "R" | "L";

/**
 * Taps a single button (press and release).
 * 
 * @param button - Button to tap
 */
export async function tapButton(button: ButtonName): Promise<boolean> {
    try {
        await postToMgba("/mgba-http/button/tap", { button });
        return true;
    } catch (error) {
        console.error("tapButton failed:", error);
        return false;
    }
}

/**
 * Taps multiple buttons in sequence.
 * 
 * @param buttons - Array of buttons to tap in order
 */
export async function pressButtons(buttons: ButtonName[]): Promise<boolean> {
    try {
        for (const button of buttons) {
            await postToMgba("/mgba-http/button/tap", { button });
            // Wait for the game to process the input and potential menu transitions
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        return true;
    } catch (error) {
        console.error("pressButtons failed:", error);
        return false;
    }
}

/**
 * Taps multiple buttons simultaneously.
 * 
 * @param buttons - Array of buttons to press at the same time
 */
export async function tapManyButtons(buttons: ButtonName[]): Promise<boolean> {
    try {
        // mGBA-http expects buttons as array query param
        const url = new URL("http://localhost:5000/mgba-http/button/tapmany");
        for (const button of buttons) {
            url.searchParams.append("buttons", button);
        }
        const response = await fetch(url.toString(), { method: "POST" });
        if (!response.ok) {
            throw new Error(`mGBA HTTP request failed: ${response.status} ${response.statusText}`);
        }
        return true;
    } catch (error) {
        console.error("tapManyButtons failed:", error);
        return false;
    }
}

/**
 * Holds a button for a specific duration.
 * RESTRICTED: Only allowed if Player is on a Mach Bike.
 * 
 * @param button - The button to hold (e.g., "Up", "A")
 * @param durationFrames - Duration in frames (60 frames ≈ 1 second at 60fps)
 * @throws Error if player is not on Mach Bike
 */
export async function holdButtons(button: ButtonName, durationFrames: number): Promise<boolean> {
    // 1. Validate Mach Bike State using core's player state reading
    const onMachBike = await isMachBike();

    if (!onMachBike) {
        throw new Error("Safety Constraint: 'hold_buttons' is only allowed when riding the Mach Bike.");
    }

    // 2. Execute Hold
    try {
        await postToMgba("/mgba-http/button/hold", { button, duration: durationFrames });
        return true;
    } catch (error) {
        console.error("holdButtons failed:", error);
        return false;
    }
}

/**
 * Holds multiple buttons simultaneously for a specific duration.
 * RESTRICTED: Only allowed if Player is on a Mach Bike.
 * 
 * @param buttons - Array of buttons to hold
 * @param durationFrames - Duration in frames
 * @throws Error if player is not on Mach Bike
 */
export async function holdManyButtons(buttons: ButtonName[], durationFrames: number): Promise<boolean> {
    const onMachBike = await isMachBike();

    if (!onMachBike) {
        throw new Error("Safety Constraint: 'hold_buttons' is only allowed when riding the Mach Bike.");
    }

    try {
        const url = new URL("http://localhost:5000/mgba-http/button/holdmany");
        for (const button of buttons) {
            url.searchParams.append("buttons", button);
        }
        url.searchParams.set("duration", String(durationFrames));
        const response = await fetch(url.toString(), { method: "POST" });
        if (!response.ok) {
            throw new Error(`mGBA HTTP request failed: ${response.status} ${response.statusText}`);
        }
        return true;
    } catch (error) {
        console.error("holdManyButtons failed:", error);
        return false;
    }
}
