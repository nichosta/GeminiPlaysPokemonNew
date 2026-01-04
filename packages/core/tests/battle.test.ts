/**
 * Battle state reading tests
 * 
 * Tests the battle menu cursor reading and state detection functions
 * using save state fixtures with mGBA-http.
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
    isInBattle,
    getActionSelectionCursor,
    getMoveSelectionCursor,
    getBattlerInMenuId,
    getBattleMenuState,
    getBattlerControllerFunc,
    getActionCursorLabel,
    getMoveCursorLabel,
    getCurrentBattleMenuType,
    isInActionMenu,
    isInMoveMenu,
    ACTION_CURSOR,
    MOVE_CURSOR,
    BattleMenuType,
    CONTROLLER_FUNCS,
} from "../src/battle/index";
import { SaveStateManager } from "../src/testing/emulator";
import { fixtures } from "../src/testing/fixtures";

// ============================================================================
// Test Setup
// ============================================================================

let stateManager: SaveStateManager;

beforeAll(async () => {
    stateManager = new SaveStateManager();
    await stateManager.backup();
});

afterAll(async () => {
    await stateManager.restore();
});

// ============================================================================
// isInBattle Tests
// ============================================================================

describe("isInBattle", () => {
    test("should return true when in wild battle action select", async () => {
        await stateManager.load(fixtures.battle.wild.actionSelect);
        const inBattle = await isInBattle();
        expect(inBattle).toBe(true);
    });

    test("should return true when in wild battle move select", async () => {
        await stateManager.load(fixtures.battle.wild.moveSelect);
        const inBattle = await isInBattle();
        expect(inBattle).toBe(true);
    });

    test("should return true when in trainer battle", async () => {
        await stateManager.load(fixtures.battle.trainer.action);
        const inBattle = await isInBattle();
        expect(inBattle).toBe(true);
    });

    test("should return false when in overworld", async () => {
        await stateManager.load(fixtures.overworld.idle);
        const inBattle = await isInBattle();
        expect(inBattle).toBe(false);
    });

    test("should return false when in party menu (not in battle)", async () => {
        await stateManager.load(fixtures.menus.party.slot0);
        const inBattle = await isInBattle();
        expect(inBattle).toBe(false);
    });
});

// ============================================================================
// Action Cursor Tests
// ============================================================================

describe("getActionSelectionCursor", () => {
    test("should read action cursor in wild battle action select", async () => {
        await stateManager.load(fixtures.battle.wild.actionSelect);
        const cursor = await getActionSelectionCursor(0);
        // The cursor value should be 0-3
        expect(cursor).toBeGreaterThanOrEqual(0);
        expect(cursor).toBeLessThanOrEqual(3);
    });

    test("should read action cursor in trainer battle", async () => {
        await stateManager.load(fixtures.battle.trainer.action);
        const cursor = await getActionSelectionCursor(0);
        expect(cursor).toBeGreaterThanOrEqual(0);
        expect(cursor).toBeLessThanOrEqual(3);
    });
});

// ============================================================================
// Move Cursor Tests
// ============================================================================

describe("getMoveSelectionCursor", () => {
    test("should read move cursor in move select screen", async () => {
        await stateManager.load(fixtures.battle.wild.moveSelect);
        const cursor = await getMoveSelectionCursor(0);
        // The cursor value should be 0-3
        expect(cursor).toBeGreaterThanOrEqual(0);
        expect(cursor).toBeLessThanOrEqual(3);
    });
});

// ============================================================================
// BattlerInMenuId Tests
// ============================================================================

describe("getBattlerInMenuId", () => {
    test("should return valid battler ID in battle", async () => {
        await stateManager.load(fixtures.battle.wild.actionSelect);
        const battlerId = await getBattlerInMenuId();
        // In single battles, this should typically be 0 for the player's Pokemon
        expect(battlerId).toBeGreaterThanOrEqual(0);
        expect(battlerId).toBeLessThan(4);
    });
});

// ============================================================================
// Complete State Tests
// ============================================================================

describe("getBattleMenuState", () => {
    test("should return complete battle state for action select", async () => {
        await stateManager.load(fixtures.battle.wild.actionSelect);
        const state = await getBattleMenuState();

        expect(state.inBattle).toBe(true);
        expect(state.battlerInMenuId).toBeGreaterThanOrEqual(0);
        expect(state.actionCursor).toBeGreaterThanOrEqual(0);
        expect(state.actionCursor).toBeLessThanOrEqual(3);
        expect(state.moveCursor).toBeGreaterThanOrEqual(0);
        expect(state.moveCursor).toBeLessThanOrEqual(3);
        expect(typeof state.controllerFunc).toBe("number");
    });

    test("should return inBattle=false for overworld", async () => {
        await stateManager.load(fixtures.overworld.idle);
        const state = await getBattleMenuState();
        expect(state.inBattle).toBe(false);
    });
});

// ============================================================================
// Label Helper Tests
// ============================================================================

describe("getActionCursorLabel", () => {
    test("should return FIGHT for position 0", () => {
        expect(getActionCursorLabel(ACTION_CURSOR.FIGHT)).toBe("FIGHT");
    });

    test("should return BAG for position 1", () => {
        expect(getActionCursorLabel(ACTION_CURSOR.BAG)).toBe("BAG");
    });

    test("should return POKEMON for position 2", () => {
        expect(getActionCursorLabel(ACTION_CURSOR.POKEMON)).toBe("POKEMON");
    });

    test("should return RUN for position 3", () => {
        expect(getActionCursorLabel(ACTION_CURSOR.RUN)).toBe("RUN");
    });
});

describe("getMoveCursorLabel", () => {
    test("should return Move 1 for position 0", () => {
        expect(getMoveCursorLabel(MOVE_CURSOR.MOVE_1)).toBe("Move 1");
    });

    test("should return Move 2 for position 1", () => {
        expect(getMoveCursorLabel(MOVE_CURSOR.MOVE_2)).toBe("Move 2");
    });

    test("should return Move 3 for position 2", () => {
        expect(getMoveCursorLabel(MOVE_CURSOR.MOVE_3)).toBe("Move 3");
    });

    test("should return Move 4 for position 3", () => {
        expect(getMoveCursorLabel(MOVE_CURSOR.MOVE_4)).toBe("Move 4");
    });
});

// ============================================================================
// Edge Case Tests
// ============================================================================

describe("edge cases", () => {
    test("should throw error for invalid battler ID", async () => {
        await stateManager.load(fixtures.battle.wild.actionSelect);

        await expect(getActionSelectionCursor(5)).rejects.toThrow("Invalid battler ID");
        await expect(getMoveSelectionCursor(-1)).rejects.toThrow("Invalid battler ID");
    });
});

// ============================================================================
// Menu Type Detection Tests
// ============================================================================

describe("getCurrentBattleMenuType", () => {
    test("should return ACTION_SELECTION in action select screen", async () => {
        await stateManager.load(fixtures.battle.wild.actionSelect);
        const menuType = await getCurrentBattleMenuType(0);
        expect(menuType).toBe(BattleMenuType.ACTION_SELECTION);
    });

    test("should return MOVE_SELECTION in move select screen", async () => {
        await stateManager.load(fixtures.battle.wild.moveSelect);
        const menuType = await getCurrentBattleMenuType(0);
        expect(menuType).toBe(BattleMenuType.MOVE_SELECTION);
    });
});

describe("isInActionMenu / isInMoveMenu", () => {
    test("isInActionMenu should be true in action select screen", async () => {
        await stateManager.load(fixtures.battle.wild.actionSelect);
        expect(await isInActionMenu()).toBe(true);
        expect(await isInMoveMenu()).toBe(false);
    });

    test("isInMoveMenu should be true in move select screen", async () => {
        await stateManager.load(fixtures.battle.wild.moveSelect);
        expect(await isInActionMenu()).toBe(false);
        expect(await isInMoveMenu()).toBe(true);
    });
});

// ============================================================================
// Discovery Test - Use this to find controller function pointer values
// ============================================================================

describe("function pointer discovery (for debugging)", () => {
    test("log controller function pointers from both menu states", async () => {
        // This test is for discovering the correct function pointer values
        const { readUint8 } = await import("../src/memory/client");

        // gBattleBufferA address - first byte is the command
        const BATTLE_BUFFER_A_ADDR = 0x02023064;
        const BUFFER_SIZE = 0x200; // Each battler has 512 bytes

        console.log("\n=== Controller Function Pointer Discovery ===\n");

        await stateManager.load(fixtures.battle.wild.actionSelect);
        const actionBattler = await getBattlerInMenuId();
        const actionState = await getBattleMenuState();
        const actionCmd = await readUint8(BATTLE_BUFFER_A_ADDR + actionBattler * BUFFER_SIZE);
        console.log("Action Select State:");
        console.log(`  battlerInMenuId = ${actionBattler}`);
        console.log(`  gBattleBufferA[${actionBattler}][0] = ${actionCmd} (CONTROLLER_CHOOSEACTION = 18)`);
        console.log(`  controllerFunc[0] = 0x${(await getBattlerControllerFunc(0)).toString(16).padStart(8, '0')}`);
        console.log(`  actionCursor = ${actionState.actionCursor}`);

        await stateManager.load(fixtures.battle.wild.moveSelect);
        const moveBattler = await getBattlerInMenuId();
        const moveState = await getBattleMenuState();
        const moveCmd = await readUint8(BATTLE_BUFFER_A_ADDR + moveBattler * BUFFER_SIZE);
        console.log("\nMove Select State:");
        console.log(`  battlerInMenuId = ${moveBattler}`);
        console.log(`  gBattleBufferA[${moveBattler}][0] = ${moveCmd} (CONTROLLER_CHOOSEMOVE = 20)`);
        console.log(`  controllerFunc[0] = 0x${(await getBattlerControllerFunc(0)).toString(16).padStart(8, '0')}`);
        console.log(`  moveCursor = ${moveState.moveCursor}`);

        console.log("\nController commands:");
        console.log("  CONTROLLER_CHOOSEACTION = 18 (0x12)");
        console.log("  CONTROLLER_CHOOSEMOVE = 20 (0x14)");
    });
});
