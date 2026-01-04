/**
 * Tests for holdButtons tool
 * 
 * Run with: bun test packages/tools/tests/input/hold_buttons.test.ts
 * 
 * NOTE: These tests require mGBA-http to be running with a ROM loaded.
 * They use save states to test the Mach Bike constraint.
 */

import { describe, test, expect, beforeAll } from "bun:test";
import { withSaveState, fixtures } from "@gempp/core/testing";
import { isEmulatorConnected } from "@gempp/core";
import { holdButtons } from "../../src/mgba/input";

let emulatorConnected = false;

describe("holdButtons", () => {
    beforeAll(async () => {
        emulatorConnected = await isEmulatorConnected();
        if (!emulatorConnected) {
            console.warn("⚠️  mGBA-http not connected - skipping live tests");
        }
    });

    describe("Mach Bike Safety Constraint", () => {
        test("should throw error when NOT on Mach Bike (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                // Player is walking in overworld_idle, not on Mach Bike
                // Duration is in frames (60 = ~1 second)
                await expect(holdButtons("Up", 60)).rejects.toThrow("Safety Constraint");
            });
        });

        test("should NOT throw when ON Mach Bike (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.machBike, async () => {
                // Player is on Mach Bike in overworld_mach_bike
                // This should pass the safety check and call the API
                try {
                    await holdButtons("Up", 30); // 30 frames = ~0.5 seconds
                    // If we get here, the safety check passed
                } catch (error) {
                    // The error should NOT be the safety constraint
                    expect((error as Error).message).not.toContain("Safety Constraint");
                }
            });
        });
    });

    describe("API Integration", () => {
        test("should successfully hold button when on Mach Bike (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.machBike, async () => {
                // This tests the full flow: safety check + API call
                const result = await holdButtons("A", 10);
                expect(result).toBe(true);
            });
        });
    });
});
