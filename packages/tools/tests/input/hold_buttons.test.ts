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
                await expect(holdButtons("Up", 100)).rejects.toThrow("Safety Constraint");
            });
        });

        test("should NOT throw when ON Mach Bike (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.machBike, async () => {
                // Player is on Mach Bike in overworld_mach_bike
                // This will likely fail the HTTP call since mGBA-http might not be fully configured,
                // but it should NOT throw the Safety Constraint error
                try {
                    await holdButtons("Up", 100);
                    // If we get here, the safety check passed (HTTP might have succeeded or failed after)
                } catch (error) {
                    // The error should NOT be the safety constraint
                    expect((error as Error).message).not.toContain("Safety Constraint");
                }
            });
        });
    });

    describe("Input Validation", () => {
        test("should pass button and duration to mGBA endpoint (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.machBike, async () => {
                // If mGBA-http /buttons/hold endpoint is available, this should succeed
                // The actual button hold behavior depends on the server implementation
                const result = await holdButtons("A", 500);
                expect(result).toBe(true);
            });
        });
    });
});
