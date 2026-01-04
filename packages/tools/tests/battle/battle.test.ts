/**
 * Battle tools tests
 *
 * Tests the battle menu navigation tools using save state fixtures.
 * 
 * NOTE: These tests require mGBA-http to be running with a ROM loaded.
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
    selectAction,
    selectFight,
    selectBag,
    selectPokemon,
    selectRun,
    selectMove,
    cancelMenu,
    isInBattle,
    isInActionMenu,
    isInMoveMenu,
    getActionSelectionCursor,
    getMoveSelectionCursor,
    ACTION_CURSOR,
    MOVE_CURSOR,
} from "../../src/battle/index";
import { SaveStateManager, fixtures } from "@gempp/core/testing";
import { getBattlerControllerFunc, getCurrentBattleMenuType, isEmulatorConnected } from "@gempp/core";

// ============================================================================
// Test Setup
// ============================================================================

let stateManager: SaveStateManager;
let emulatorConnected = false;

beforeAll(async () => {
    emulatorConnected = await isEmulatorConnected();
    if (!emulatorConnected) {
        console.warn("⚠️  mGBA-http not connected - skipping live tests");
        return;
    }
    stateManager = new SaveStateManager();
    await stateManager.backup();
});

afterAll(async () => {
    if (emulatorConnected && stateManager) {
        await stateManager.restore();
    }
});

// ============================================================================
// State Detection Tests
// ============================================================================

describe("Battle State Detection", () => {
    test("should detect action menu correctly (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.battle.wild.actionSelect);

        expect(await isInBattle()).toBe(true);
        expect(await isInActionMenu()).toBe(true);
        expect(await isInMoveMenu()).toBe(false);
    });

    test("should detect move menu correctly (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.battle.wild.moveSelect);

        expect(await isInBattle()).toBe(true);
        expect(await isInActionMenu()).toBe(false);
        expect(await isInMoveMenu()).toBe(true);
    });

    test("should detect non-battle state correctly (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.overworld.idle);

        expect(await isInBattle()).toBe(false);
    });
});

// ============================================================================
// Action Selection Tests
// ============================================================================

describe("selectAction", () => {
    test("should fail when not in battle (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.overworld.idle);

        const result = await selectAction("fight");
        expect(result.success).toBe(false);
        expect(result.error).toBe("Not in battle");
    });

    test("should fail when not in action menu (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.battle.wild.moveSelect);

        const result = await selectAction("fight");
        expect(result.success).toBe(false);
        expect(result.error).toBe("Not in action selection menu");
    });

    test("should succeed when in action menu (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.battle.wild.actionSelect);

        const result = await selectFight();
        expect(result.success).toBe(true);
    });
});

describe("individual action selectors", () => {
    test("selectFight should work from action menu (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.battle.wild.actionSelect);

        const result = await selectFight();
        expect(result.success).toBe(true);
    });

    test("selectBag should work from action menu (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.battle.wild.actionSelect);

        const result = await selectBag();
        expect(result.success).toBe(true);
    });

    test("selectPokemon should work from action menu (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.battle.wild.actionSelect);
        await stateManager.load(fixtures.battle.wild.actionSelect);
        const result = await selectPokemon();
        expect(result.success).toBe(true);
    });

    test("selectRun should work from action menu (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.battle.wild.actionSelect);
        await stateManager.load(fixtures.battle.wild.actionSelect);
        const result = await selectRun();
        expect(result.success).toBe(true);
    });
});

// ============================================================================
// Move Selection Tests
// ============================================================================

describe("selectMove", () => {
    test("should fail with invalid slot number", async () => {
        // This test doesn't need emulator - it's just validation
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.battle.wild.moveSelect);

        const result0 = await selectMove(0);
        expect(result0.success).toBe(false);
        expect(result0.error).toBe("Move slot must be 1-4");

        const result5 = await selectMove(5);
        expect(result5.success).toBe(false);
        expect(result5.error).toBe("Move slot must be 1-4");
    });

    test("should fail when not in battle (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.overworld.idle);

        const result = await selectMove(1);
        expect(result.success).toBe(false);
        expect(result.error).toBe("Not in battle");
    });

    test("should fail when not in move menu (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.battle.wild.actionSelect);

        const result = await selectMove(1);
        expect(result.success).toBe(false);
        expect(result.error).toBe("Not in move selection menu");
    });

    test("should succeed for valid slot when in move menu (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.battle.wild.moveSelect);

        const result = await selectMove(1);
        expect(result.success).toBe(true);
    });

    test("should succeed for all valid slots (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        for (let slot = 1; slot <= 4; slot++) {
            await stateManager.load(fixtures.battle.wild.moveSelect);
            const result = await selectMove(slot);
            expect(result.success).toBe(true);
        }
    });
});

// ============================================================================
// Cancel Menu Tests
// ============================================================================

describe("cancelMenu", () => {
    test("should always succeed (just presses B) (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.battle.wild.moveSelect);

        const result = await cancelMenu();
        expect(result.success).toBe(true);
    });
});

// ============================================================================
// Cursor Reading Tests
// ============================================================================

describe("cursor reading", () => {
    test("should read action cursor in action menu (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.battle.wild.actionSelect);

        const cursor = await getActionSelectionCursor();
        expect(cursor).toBeGreaterThanOrEqual(0);
        expect(cursor).toBeLessThanOrEqual(3);
    });

    test("should read move cursor in move menu (requires mGBA)", async () => {
        if (!emulatorConnected) {
            console.log("  ⏭️  Skipping - emulator not connected");
            return;
        }
        await stateManager.load(fixtures.battle.wild.moveSelect);

        const cursor = await getMoveSelectionCursor();
        expect(cursor).toBeGreaterThanOrEqual(0);
        expect(cursor).toBeLessThanOrEqual(3);
    });
});

// ============================================================================
// Constants Tests (no emulator needed)
// ============================================================================

describe("cursor constants", () => {
    test("ACTION_CURSOR should have correct values", () => {
        expect(ACTION_CURSOR.FIGHT).toBe(0);
        expect(ACTION_CURSOR.BAG).toBe(1);
        expect(ACTION_CURSOR.POKEMON).toBe(2);
        expect(ACTION_CURSOR.RUN).toBe(3);
    });

    test("MOVE_CURSOR should have correct values", () => {
        expect(MOVE_CURSOR.MOVE_1).toBe(0);
        expect(MOVE_CURSOR.MOVE_2).toBe(1);
        expect(MOVE_CURSOR.MOVE_3).toBe(2);
        expect(MOVE_CURSOR.MOVE_4).toBe(3);
    });
});
