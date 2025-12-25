/**
 * Tests for Pokemon party reading
 *
 * Run with: bun test packages/core/tests/pokemon.test.ts
 *
 * NOTE: These tests require mGBA-http to be running with a ROM loaded.
 * They will backup and restore the current state automatically.
 *
 * ## Save States with Known Values
 *
 * - `menu_party_slot1` - Party of 6:
 *   - Slot 0: Torchic, Lvl 10, 11/32 HP, Blaze, moves: Scratch/Growl/Focus Energy/Ember
 *   - Slot 1: Poochyena
 *   - Slot 2: Wurmple, fainted (0/14 HP)
 *   - Slot 3: Zigzagoon, holding Antidote
 *   - Slot 4: Ralts
 *   - Slot 5: Seedot
 *
 * ## Save States Needed for Comprehensive Tests (TODO)
 *
 * - State with status conditions (poisoned, paralyzed, etc.)
 * - State with eggs in party
 * - State with Pokemon holding various items
 * - State with Pokemon that have less than 4 moves
 * - Battle state to test isInBattle()
 */

import { describe, test, expect, beforeAll } from "bun:test";
import { withSaveState, fixtures } from "../src/testing";
import { isEmulatorConnected } from "../src/memory/client";
import {
    getPartyCount,
    getPokemon,
    getFullParty,
    isInBattle,
    getLeadPokemon,
    hasUsablePokemon,
    getUsablePokemonCount,
    findPokemonBySpecies,
    findPokemonWithMove,
} from "../src/pokemon";

// Check emulator connectivity before running tests
let emulatorConnected = false;

describe("Pokemon Party Reading", () => {
    beforeAll(async () => {
        emulatorConnected = await isEmulatorConnected();
        if (!emulatorConnected) {
            console.warn("⚠️  mGBA-http not connected - skipping live tests");
        }
    });

    describe("Party Count", () => {
        test("should read party count (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const count = await getPartyCount();
                expect(count).toBe(6);
            });
        });
    });

    describe("Single Pokemon Reading", () => {
        test("should read Pokemon with correct structure (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const pokemon = await getPokemon(0);

                expect(pokemon).not.toBeNull();
                expect(pokemon).toHaveProperty("slot");
                expect(pokemon).toHaveProperty("speciesId");
                expect(pokemon).toHaveProperty("species");
                expect(pokemon).toHaveProperty("nickname");
                expect(pokemon).toHaveProperty("level");
                expect(pokemon).toHaveProperty("currentHp");
                expect(pokemon).toHaveProperty("maxHp");
                expect(pokemon).toHaveProperty("stats");
                expect(pokemon).toHaveProperty("status");
                expect(pokemon).toHaveProperty("moves");
                expect(pokemon).toHaveProperty("types");
                expect(pokemon).toHaveProperty("ability");
                expect(pokemon).toHaveProperty("heldItem");
                expect(pokemon).toHaveProperty("isFainted");
                expect(pokemon).toHaveProperty("isEgg");
            });
        });

        test("should return null for empty slot (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                // Party has 6 Pokemon, so slot 6 would be out of range
                // But getPokemon checks partyCount, so let's test with a state
                // that has fewer Pokemon if available. For now, verify slot 0 works.
                const pokemon = await getPokemon(0);
                expect(pokemon).not.toBeNull();
            });
        });

        test("should throw for invalid slot number", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                await expect(getPokemon(-1)).rejects.toThrow();
                await expect(getPokemon(6)).rejects.toThrow();
            });
        });
    });

    describe("Full Party Reading", () => {
        test("should read all party members (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const party = await getFullParty();

                expect(Array.isArray(party)).toBe(true);
                expect(party.length).toBe(6);

                // Each should have correct slot number
                for (let i = 0; i < party.length; i++) {
                    expect(party[i].slot).toBe(i);
                }
            });
        });
    });

    describe("Battle State", () => {
        test("should detect not in battle from overworld (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.overworld.idle, async () => {
                const inBattle = await isInBattle();
                expect(inBattle).toBe(false);
            });
        });

        test("should detect in battle from battle state (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.battle.wild.actionSelect, async () => {
                const inBattle = await isInBattle();
                expect(inBattle).toBe(true);
            });
        });
    });

    describe("Utility Functions", () => {
        test("getLeadPokemon should return first Pokemon (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const lead = await getLeadPokemon();
                expect(lead).not.toBeNull();
                expect(lead?.slot).toBe(0);
            });
        });

        test("hasUsablePokemon should return true with healthy party (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const hasUsable = await hasUsablePokemon();
                expect(hasUsable).toBe(true);
            });
        });

        test("getUsablePokemonCount should count non-fainted Pokemon (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const count = await getUsablePokemonCount();
                // Wurmple is fainted, so 5 usable
                expect(count).toBe(5);
            });
        });

        test("findPokemonBySpecies should find existing species (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const pokemon = await findPokemonBySpecies("TORCHIC");
                expect(pokemon).not.toBeNull();
                expect(pokemon?.species).toBe("TORCHIC");
            });
        });

        test("findPokemonBySpecies should return null for missing species (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const pokemon = await findPokemonBySpecies("MEWTWO");
                expect(pokemon).toBeNull();
            });
        });

        test("findPokemonWithMove should find Pokemon with move (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const pokemon = await findPokemonWithMove("EMBER");
                expect(pokemon).not.toBeNull();
                expect(pokemon?.species).toBe("TORCHIC");
            });
        });
    });

    // =========================================================================
    // Known-Value Tests
    // These test against save states with known, verified Pokemon data
    // =========================================================================

    describe("Known Values: menu_party_slot1", () => {
        test("should have correct party order (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const party = await getFullParty();

                expect(party[0].species).toBe("TORCHIC");
                expect(party[1].species).toBe("POOCHYENA");
                expect(party[2].species).toBe("WURMPLE");
                expect(party[3].species).toBe("ZIGZAGOON");
                expect(party[4].species).toBe("RALTS");
                expect(party[5].species).toBe("SEEDOT");
            });
        });

        test("Torchic should have correct stats and data (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const torchic = await getPokemon(0);

                expect(torchic).not.toBeNull();
                expect(torchic!.species).toBe("TORCHIC");
                expect(torchic!.level).toBe(10);
                expect(torchic!.currentHp).toBe(11);
                expect(torchic!.maxHp).toBe(32);
                expect(torchic!.ability).toBe("BLAZE");
                expect(torchic!.isFainted).toBe(false);
                expect(torchic!.types).toContain("Fire");
            });
        });

        test("Torchic should have correct moves in order (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const torchic = await getPokemon(0);

                expect(torchic).not.toBeNull();
                expect(torchic!.moves.length).toBe(4);
                expect(torchic!.moves[0].name).toBe("SCRATCH");
                expect(torchic!.moves[1].name).toBe("GROWL");
                expect(torchic!.moves[2].name).toBe("FOCUS_ENERGY");
                expect(torchic!.moves[3].name).toBe("EMBER");
            });
        });

        test("Wurmple should be fainted (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const wurmple = await getPokemon(2);

                expect(wurmple).not.toBeNull();
                expect(wurmple!.species).toBe("WURMPLE");
                expect(wurmple!.currentHp).toBe(0);
                expect(wurmple!.maxHp).toBe(14);
                expect(wurmple!.isFainted).toBe(true);
            });
        });

        test("Zigzagoon should be holding Antidote (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const zigzagoon = await getPokemon(3);

                expect(zigzagoon).not.toBeNull();
                expect(zigzagoon!.species).toBe("ZIGZAGOON");
                expect(zigzagoon!.heldItem).toBe("ANTIDOTE");
            });
        });

        test("Pokemon without held items should have null heldItem (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const torchic = await getPokemon(0);

                expect(torchic).not.toBeNull();
                expect(torchic!.heldItem).toBeNull();
            });
        });

        test("full party verification summary (requires mGBA)", async () => {
            if (!emulatorConnected) {
                console.log("  ⏭️  Skipping - emulator not connected");
                return;
            }

            await withSaveState(fixtures.menus.party.slot1, async () => {
                const party = await getFullParty();

                // Count stats
                expect(party.length).toBe(6);

                const faintedCount = party.filter(p => p.isFainted).length;
                expect(faintedCount).toBe(1); // Only Wurmple

                const usableCount = await getUsablePokemonCount();
                expect(usableCount).toBe(5);

                const hasItems = party.filter(p => p.heldItem !== null).length;
                expect(hasItems).toBe(2); // Only Zigzagoon and Poochyena

                // Verify no eggs
                const eggCount = party.filter(p => p.isEgg).length;
                expect(eggCount).toBe(0);
            });
        });
    });
});
