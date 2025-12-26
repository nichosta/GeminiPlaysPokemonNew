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
    getActionCursorLabel,
    getMoveCursorLabel,
    ACTION_CURSOR,
    MOVE_CURSOR,
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
