/**
 * Battle state reading utilities
 * 
 * Provides functions to read the current battle menu state,
 * cursor positions, and determine which menu is active.
 */

import {
    readUint8,
    readUint32,
    readRange
} from "../memory/index";
import {
    IN_BATTLE_BIT_ADDR,
    IN_BATTLE_BITMASK,
    GACTION_SELECTION_CURSOR_ADDR,
    GMOVE_SELECTION_CURSOR_ADDR,
    GBATTLER_IN_MENU_ID_ADDR,
    GBATTLER_CONTROLLER_FUNCS_ADDR,
    ACTION_CURSOR,
    MOVE_CURSOR,
    type ActionCursorPosition,
    type MoveCursorPosition,
} from "../addresses/index";

/**
 * Maximum number of battlers (for array bounds)
 */
const MAX_BATTLERS = 4;

/**
 * Check if the player is currently in a battle
 */
export async function isInBattle(): Promise<boolean> {
    const value = await readUint8(IN_BATTLE_BIT_ADDR);
    return (value & IN_BATTLE_BITMASK) !== 0;
}

/**
 * Get the current action selection cursor position for a battler.
 * 
 * Returns the position in the main battle menu:
 *   0 = FIGHT     1 = BAG
 *   2 = POKEMON   3 = RUN
 * 
 * @param battlerId - The battler index (0 for player in single battles)
 * @returns The cursor position (0-3)
 */
export async function getActionSelectionCursor(battlerId: number = 0): Promise<ActionCursorPosition> {
    if (battlerId < 0 || battlerId >= MAX_BATTLERS) {
        throw new Error(`Invalid battler ID: ${battlerId}`);
    }
    const value = await readUint8(GACTION_SELECTION_CURSOR_ADDR + battlerId);
    return value as ActionCursorPosition;
}

/**
 * Get the current move selection cursor position for a battler.
 * 
 * Returns the position in the move selection menu:
 *   0 = Move 1    1 = Move 2
 *   2 = Move 3    3 = Move 4
 * 
 * @param battlerId - The battler index (0 for player in single battles)
 * @returns The cursor position (0-3)
 */
export async function getMoveSelectionCursor(battlerId: number = 0): Promise<MoveCursorPosition> {
    if (battlerId < 0 || battlerId >= MAX_BATTLERS) {
        throw new Error(`Invalid battler ID: ${battlerId}`);
    }
    const value = await readUint8(GMOVE_SELECTION_CURSOR_ADDR + battlerId);
    return value as MoveCursorPosition;
}

/**
 * Get the battler ID of the battler currently in a menu.
 * 
 * In single battles, this is typically 0 (the player's Pokemon).
 */
export async function getBattlerInMenuId(): Promise<number> {
    return await readUint8(GBATTLER_IN_MENU_ID_ADDR);
}

/**
 * Get the controller function pointer for a specific battler.
 * 
 * This is the address of the function currently being executed
 * for the battler's battle controller state machine.
 * 
 * @param battlerId - The battler index
 * @returns The function pointer address
 */
export async function getBattlerControllerFunc(battlerId: number = 0): Promise<number> {
    if (battlerId < 0 || battlerId >= MAX_BATTLERS) {
        throw new Error(`Invalid battler ID: ${battlerId}`);
    }
    // Each function pointer is 4 bytes
    return await readUint32(GBATTLER_CONTROLLER_FUNCS_ADDR + (battlerId * 4));
}

/**
 * Human-readable label for the action cursor position
 */
export function getActionCursorLabel(position: ActionCursorPosition): string {
    switch (position) {
        case ACTION_CURSOR.FIGHT: return "FIGHT";
        case ACTION_CURSOR.BAG: return "BAG";
        case ACTION_CURSOR.POKEMON: return "POKEMON";
        case ACTION_CURSOR.RUN: return "RUN";
        default: return `UNKNOWN(${position})`;
    }
}

/**
 * Human-readable label for the move cursor position
 */
export function getMoveCursorLabel(position: MoveCursorPosition): string {
    switch (position) {
        case MOVE_CURSOR.MOVE_1: return "Move 1";
        case MOVE_CURSOR.MOVE_2: return "Move 2";
        case MOVE_CURSOR.MOVE_3: return "Move 3";
        case MOVE_CURSOR.MOVE_4: return "Move 4";
        default: return `UNKNOWN(${position})`;
    }
}

/**
 * Represents the current battle menu state
 */
export interface BattleMenuState {
    /** Whether the player is currently in a battle */
    inBattle: boolean;
    /** The battler ID currently in a menu (typically 0 for player) */
    battlerInMenuId: number;
    /** Current action selection cursor position (0-3) */
    actionCursor: ActionCursorPosition;
    /** Current move selection cursor position (0-3) */
    moveCursor: MoveCursorPosition;
    /** The controller function pointer for the active battler */
    controllerFunc: number;
}

/**
 * Get the complete current battle menu state.
 * 
 * This is a convenience function that reads all battle menu
 * state in a single call.
 * 
 * @returns The complete battle menu state
 */
export async function getBattleMenuState(): Promise<BattleMenuState> {
    const inBattle = await isInBattle();
    const battlerInMenuId = await getBattlerInMenuId();
    const actionCursor = await getActionSelectionCursor(battlerInMenuId);
    const moveCursor = await getMoveSelectionCursor(battlerInMenuId);
    const controllerFunc = await getBattlerControllerFunc(battlerInMenuId);

    return {
        inBattle,
        battlerInMenuId,
        actionCursor,
        moveCursor,
        controllerFunc,
    };
}

// Re-export cursor constants for convenience
export { ACTION_CURSOR, MOVE_CURSOR };
export type { ActionCursorPosition, MoveCursorPosition };
