/**
 * Tests for player state reading
 *
 * Run with: bun test packages/core/tests/player.test.ts
 *
 * NOTE: These tests require mGBA-http to be running with a ROM loaded.
 * They will backup and restore the current state automatically.
 *
 * ## Save States with Known Values
 *
 * - `overworld_idle` - Oldale Town:
 *   - Map: OLDALE_TOWN (bank 0, num 10)
 *   - Facing: down
 *   - Not surfing/biking/diving
 *   - Controls not locked
 *   - No badges
 *
 * - `overworld_mach_bike` - On Mach Bike:
 *   - isBiking: true
 *   - isMachBike: true
 *
 * ## Save States Needed for Comprehensive Tests (TODO)
 *
 * - State while surfing
 * - State while diving
 * - State on Acro Bike
 * - State in dialogue (controls locked)
 * - State with various badge counts (post-gym)
 */

import { describe, test, expect, beforeAll } from "bun:test";
import { withSaveState, fixtures } from "../src/testing";
import { isEmulatorConnected } from "../src/memory/client";
import {
    getMapBank,
    getMapNumber,
    getCurrentMapName,
    getPlayerPosition,
    getFacingDirection,
    isSurfing,
    isMachBike,
    isAcroBike,
    isBiking,
    isDiving,
    areControlsLocked,
    getBadges,
    getBadgeCount,
    hasBadge,
    getPlayerState,
} from "../src/player";

// Check emulator connectivity before running tests
let emulatorConnected = false;

describe("Player State Reading", () => {
    beforeAll(async () => {
        emulatorConnected = await isEmulatorConnected();
        if (!emulatorConnected) {
            console.warn("⚠️  mGBA-http not connected - skipping live tests");
        }
    });

    describe("Map Location", () => {
        test("should read map bank and number (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const bank = await getMapBank();
                const num = await getMapNumber();

                expect(typeof bank).toBe("number");
                expect(typeof num).toBe("number");
            });
        });

        test("should read map name (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const mapName = await getCurrentMapName();
                expect(typeof mapName).toBe("string");
                expect(mapName.length).toBeGreaterThan(0);
            });
        });
    });

    describe("Player Position", () => {
        test("should read player position (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const pos = await getPlayerPosition();

                expect(pos).toHaveProperty("x");
                expect(pos).toHaveProperty("y");
                expect(typeof pos.x).toBe("number");
                expect(typeof pos.y).toBe("number");
            });
        });
    });

    describe("Facing Direction", () => {
        test("should read facing direction (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const facing = await getFacingDirection();
                expect(["up", "down", "left", "right"]).toContain(facing);
            });
        });
    });

    describe("Movement State", () => {
        test("should detect not surfing in overworld (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const surfing = await isSurfing();
                expect(surfing).toBe(false);
            });
        });

        test("should detect not biking in idle overworld (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const biking = await isBiking();
                expect(biking).toBe(false);
            });
        });

        test("should detect biking on Mach Bike (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.machBike, async () => {
                const biking = await isBiking();
                const machBike = await isMachBike();

                expect(biking).toBe(true);
                expect(machBike).toBe(true);
            });
        });

        test("should detect not diving in overworld (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const diving = await isDiving();
                expect(diving).toBe(false);
            });
        });
    });

    describe("Controls Locked", () => {
        test("should detect controls not locked in idle overworld (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const locked = await areControlsLocked();
                expect(locked).toBe(false);
            });
        });

        test("should detect controls locked in menu (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.start.open, async () => {
                const locked = await areControlsLocked();
                expect(locked).toBe(true);
            });
        });
    });

    describe("Badges", () => {
        test("should read all 8 badges (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const badges = await getBadges();

                expect(badges.length).toBe(8);
                expect(badges[0].name).toBe("Stone Badge");
                expect(badges[7].name).toBe("Rain Badge");
            });
        });

        test("should count badges correctly (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const count = await getBadgeCount();
                expect(typeof count).toBe("number");
                expect(count).toBeGreaterThanOrEqual(0);
                expect(count).toBeLessThanOrEqual(8);
            });
        });

        test("hasBadge should work correctly (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                // Check a badge we know doesn't exist early game
                const hasMindBadge = await hasBadge("Mind Badge");
                expect(typeof hasMindBadge).toBe("boolean");
            });
        });
    });

    describe("Full Player State", () => {
        test("should read complete player state (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const state = await getPlayerState();

                expect(state).toHaveProperty("mapBank");
                expect(state).toHaveProperty("mapNumber");
                expect(state).toHaveProperty("mapName");
                expect(state).toHaveProperty("position");
                expect(state).toHaveProperty("facing");
                expect(state).toHaveProperty("isSurfing");
                expect(state).toHaveProperty("isBiking");
                expect(state).toHaveProperty("isMachBike");
                expect(state).toHaveProperty("isAcroBike");
                expect(state).toHaveProperty("isDiving");
                expect(state).toHaveProperty("controlsLocked");
            });
        });
    });

    // =========================================================================
    // Known-Value Tests
    // These test against save states with known, verified player state
    // =========================================================================

    describe("Known Values: overworld_idle (Oldale Town)", () => {
        test("should be in Oldale Town (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const bank = await getMapBank();
                const num = await getMapNumber();
                const mapName = await getCurrentMapName();

                expect(bank).toBe(0);
                expect(num).toBe(10);
                expect(mapName).toBe("OLDALE_TOWN");
            });
        });

        test("should be facing down (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const facing = await getFacingDirection();
                expect(facing).toBe("down");
            });
        });

        test("should not be surfing/biking/diving (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                expect(await isSurfing()).toBe(false);
                expect(await isBiking()).toBe(false);
                expect(await isDiving()).toBe(false);
            });
        });

        test("controls should not be locked (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const locked = await areControlsLocked();
                expect(locked).toBe(false);
            });
        });

        test("should have no badges (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const count = await getBadgeCount();
                expect(count).toBe(0);

                const badges = await getBadges();
                for (const badge of badges) {
                    expect(badge.obtained).toBe(false);
                }
            });
        });

        test("full state verification (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const state = await getPlayerState();

                expect(state.mapBank).toBe(0);
                expect(state.mapNumber).toBe(10);
                expect(state.mapName).toBe("OLDALE_TOWN");
                expect(state.facing).toBe("down");
                expect(state.isSurfing).toBe(false);
                expect(state.isBiking).toBe(false);
                expect(state.isDiving).toBe(false);
                expect(state.controlsLocked).toBe(false);
            });
        });
    });

    describe("Known Values: overworld_mach_bike", () => {
        test("should detect Mach Bike (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.machBike, async () => {
                const state = await getPlayerState();

                expect(state.isBiking).toBe(true);
                expect(state.isMachBike).toBe(true);
                expect(state.isAcroBike).toBe(false);
                expect(state.isSurfing).toBe(false);
                expect(state.isDiving).toBe(false);
            });
        });
    });
});
