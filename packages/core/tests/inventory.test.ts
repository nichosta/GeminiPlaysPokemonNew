/**
 * Tests for inventory/bag reading
 *
 * Run with: bun test packages/core/tests/inventory.test.ts
 *
 * NOTE: These tests require mGBA-http to be running with a ROM loaded.
 * They will backup and restore the current state automatically.
 *
 * ## Save States with Known Values
 *
 * - `overworld_ledges` - Early game: 330 money, 6 Poke Balls, no other items
 *
 * ## Save States Needed for Comprehensive Tests (TODO)
 *
 * - Mid-game state with varied inventory:
 *   - Multiple item types in Items pocket (potions, status heals, etc.)
 *   - Multiple ball types (Great Balls, Ultra Balls)
 *   - Several TMs/HMs acquired
 *   - Key items (e.g., Bike, fishing rods)
 *   - Some berries
 *   - Money in the thousands
 *
 * - Late-game state with near-full Items pocket:
 *   - 27+ items in Items pocket (to test capacity warning)
 *   - Rare items, held items
 *   - All HMs
 */

import { describe, test, expect, beforeAll } from "bun:test";
import { withSaveState, fixtures } from "../src/testing";
import { isEmulatorConnected } from "../src/memory/client";
import {
    getSecurityKey,
    getPlayerMoney,
    getPocket,
    getBagContents,
    getBagContentsWithWarnings,
    findItem,
    hasItem,
    getPokeBallCounts,
    getTotalPokeBalls,
} from "../src/inventory";

// Check emulator connectivity before running tests
let emulatorConnected = false;

describe("Inventory / Bag Reading", () => {
    beforeAll(async () => {
        emulatorConnected = await isEmulatorConnected();
        if (!emulatorConnected) {
            console.warn("⚠️  mGBA-http not connected - skipping live tests");
        }
    });

    describe("Security Key", () => {
        test("should read security key (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const key = await getSecurityKey();
                // Security key is a 32-bit value, should be non-zero for an active save
                expect(typeof key).toBe("number");
                expect(key).toBeGreaterThan(0);
            });
        });
    });

    describe("Player Money", () => {
        test("should read player money (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const money = await getPlayerMoney();
                // Money should be a reasonable value (0 to 999999)
                expect(typeof money).toBe("number");
                expect(money).toBeGreaterThanOrEqual(0);
                expect(money).toBeLessThanOrEqual(999999);
            });
        });
    });

    describe("Pocket Reading", () => {
        test("should read Items pocket (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.bag.items, async () => {
                const items = await getPocket("Items");
                expect(Array.isArray(items)).toBe(true);

                // Each item should have the right structure
                for (const item of items) {
                    expect(item).toHaveProperty("id");
                    expect(item).toHaveProperty("name");
                    expect(item).toHaveProperty("quantity");
                    expect(typeof item.id).toBe("number");
                    expect(typeof item.name).toBe("string");
                    expect(typeof item.quantity).toBe("number");
                    expect(item.quantity).toBeGreaterThan(0);
                }
            });
        });

        test("should read PokeBalls pocket (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.bag.pokeballs, async () => {
                const balls = await getPocket("PokeBalls");
                expect(Array.isArray(balls)).toBe(true);

                // Verify ball names look correct
                for (const ball of balls) {
                    expect(ball.name).toMatch(/BALL/i);
                }
            });
        });

        test("should read TMsHMs pocket (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.bag.tms, async () => {
                const tms = await getPocket("TMsHMs");
                expect(Array.isArray(tms)).toBe(true);

                // TMs/HMs should have names starting with TM or HM
                for (const tm of tms) {
                    expect(tm.name).toMatch(/^(TM|HM)/);
                }
            });
        });
    });

    describe("Full Bag Contents", () => {
        test("should read all bag pockets (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.bag.items, async () => {
                const bag = await getBagContents();

                expect(bag).toHaveProperty("items");
                expect(bag).toHaveProperty("keyItems");
                expect(bag).toHaveProperty("pokeBalls");
                expect(bag).toHaveProperty("tmsHms");
                expect(bag).toHaveProperty("berries");

                expect(Array.isArray(bag.items)).toBe(true);
                expect(Array.isArray(bag.keyItems)).toBe(true);
                expect(Array.isArray(bag.pokeBalls)).toBe(true);
                expect(Array.isArray(bag.tmsHms)).toBe(true);
                expect(Array.isArray(bag.berries)).toBe(true);
            });
        });

        test("should include warnings about pocket capacity (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.bag.items, async () => {
                const { contents, warnings } = await getBagContentsWithWarnings();

                expect(contents).toHaveProperty("items");
                expect(warnings).toHaveProperty("itemsPocketNearFull");
                expect(warnings).toHaveProperty("itemsPocketUsed");
                expect(typeof warnings.itemsPocketNearFull).toBe("boolean");
                expect(typeof warnings.itemsPocketUsed).toBe("number");
            });
        });
    });

    describe("Item Search Utilities", () => {
        test("findItem should find existing items (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.bag.items, async () => {
                // First get what's in the bag
                const bag = await getBagContents();
                const allItems = [
                    ...bag.items,
                    ...bag.keyItems,
                    ...bag.pokeBalls,
                    ...bag.tmsHms,
                    ...bag.berries,
                ];

                if (allItems.length > 0) {
                    // Search for an item we know exists
                    const knownItem = allItems[0];
                    const found = await findItem(knownItem.name);

                    expect(found).not.toBeNull();
                    expect(found?.name).toBe(knownItem.name);
                    expect(found?.quantity).toBe(knownItem.quantity);
                }
            });
        });

        test("findItem should return null for non-existent items (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const found = await findItem("DEFINITELY_NOT_A_REAL_ITEM_12345");
                expect(found).toBeNull();
            });
        });

        test("hasItem should check quantity correctly (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.bag.items, async () => {
                const bag = await getBagContents();
                const allItems = [...bag.items, ...bag.pokeBalls];

                if (allItems.length > 0) {
                    const item = allItems[0];

                    // Should have at least 1
                    expect(await hasItem(item.name, 1)).toBe(true);

                    // Should have the exact quantity
                    expect(await hasItem(item.name, item.quantity)).toBe(true);

                    // Should not have more than exists
                    expect(await hasItem(item.name, item.quantity + 1)).toBe(false);
                }
            });
        });
    });

    describe("PokeBall Utilities", () => {
        test("getPokeBallCounts should return map of balls (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.bag.pokeballs, async () => {
                const counts = await getPokeBallCounts();
                expect(counts instanceof Map).toBe(true);

                // Each entry should have a valid count
                for (const [name, count] of counts) {
                    expect(typeof name).toBe("string");
                    expect(typeof count).toBe("number");
                    expect(count).toBeGreaterThan(0);
                }
            });
        });

        test("getTotalPokeBalls should sum all balls (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.bag.pokeballs, async () => {
                const total = await getTotalPokeBalls();
                const counts = await getPokeBallCounts();

                // Total should equal sum of individual counts
                let sum = 0;
                for (const count of counts.values()) {
                    sum += count;
                }

                expect(total).toBe(sum);
            });
        });
    });

    // =========================================================================
    // Known-Value Tests
    // These test against save states with known, verified inventory contents
    // =========================================================================

    describe("Known Values: overworld_ledges (early game)", () => {
        test("should have exactly 330 money (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.ledges, async () => {
                const money = await getPlayerMoney();
                expect(money).toBe(330);
            });
        });

        test("should have exactly 6 Poke Balls (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.ledges, async () => {
                const pokeBalls = await getPocket("PokeBalls");

                // Should have exactly one entry: 6 Poke Balls
                expect(pokeBalls.length).toBe(1);
                expect(pokeBalls[0].name).toBe("POKE_BALL");
                expect(pokeBalls[0].quantity).toBe(6);

                // Total should also be 6
                const total = await getTotalPokeBalls();
                expect(total).toBe(6);
            });
        });

        test("should have empty Items pocket (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.ledges, async () => {
                const items = await getPocket("Items");
                expect(items.length).toBe(0);
            });
        });

        test("should have empty KeyItems pocket (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.ledges, async () => {
                const keyItems = await getPocket("KeyItems");
                expect(keyItems.length).toBe(0);
            });
        });

        test("should have empty TMsHMs pocket (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.ledges, async () => {
                const tms = await getPocket("TMsHMs");
                expect(tms.length).toBe(0);
            });
        });

        test("should have empty Berries pocket (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.ledges, async () => {
                const berries = await getPocket("Berries");
                expect(berries.length).toBe(0);
            });
        });

        test("full bag verification (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.ledges, async () => {
                const { contents, warnings } = await getBagContentsWithWarnings();

                // Verify complete bag state
                expect(contents.items.length).toBe(0);
                expect(contents.keyItems.length).toBe(0);
                expect(contents.pokeBalls.length).toBe(1);
                expect(contents.tmsHms.length).toBe(0);
                expect(contents.berries.length).toBe(0);

                // Items pocket should not be near full
                expect(warnings.itemsPocketNearFull).toBe(false);
                expect(warnings.itemsPocketUsed).toBe(0);
            });
        });
    });
});
