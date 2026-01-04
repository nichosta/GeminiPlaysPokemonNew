/**
 * Battle menu navigation tools
 *
 * These tools provide intelligent battle menu navigation by reading
 * the current menu state from memory and calculating the optimal
 * button presses to reach the desired selection.
 */

import { pressButtons, type ButtonName } from "../mgba/input";
import {
    isInBattle,
    isInActionMenu,
    isInMoveMenu,
    getActionSelectionCursor,
    getMoveSelectionCursor,
    ACTION_CURSOR,
    MOVE_CURSOR,
    type ActionCursorPosition,
    type MoveCursorPosition,
} from "@gempp/core";

// ============================================================================
// Types
// ============================================================================

export type ActionOption = "fight" | "bag" | "pokemon" | "run";

export interface BattleActionResult {
    success: boolean;
    error?: string;
}

// ============================================================================
// Navigation Helpers
// ============================================================================

/**
 * Calculate button presses needed to move from one position to another
 * in a 2x2 grid layout.
 *
 * Grid layout:
 *   0  1
 *   2  3
 *
 * Position encoding:
 *   - Bit 0 (1): column (0=left, 1=right)
 *   - Bit 1 (2): row (0=top, 1=bottom)
 */
function calculateGridNavigation(from: number, to: number): ButtonName[] {
    const buttons: ButtonName[] = [];

    const fromCol = from & 1;
    const fromRow = (from >> 1) & 1;
    const toCol = to & 1;
    const toRow = (to >> 1) & 1;

    // Navigate horizontally
    if (fromCol < toCol) {
        buttons.push("Right");
    } else if (fromCol > toCol) {
        buttons.push("Left");
    }

    // Navigate vertically
    if (fromRow < toRow) {
        buttons.push("Down");
    } else if (fromRow > toRow) {
        buttons.push("Up");
    }

    return buttons;
}

/**
 * Map action option name to cursor position
 */
function actionOptionToPosition(option: ActionOption): ActionCursorPosition {
    switch (option) {
        case "fight":
            return ACTION_CURSOR.FIGHT;
        case "bag":
            return ACTION_CURSOR.BAG;
        case "pokemon":
            return ACTION_CURSOR.POKEMON;
        case "run":
            return ACTION_CURSOR.RUN;
    }
}

// ============================================================================
// Action Menu Navigation
// ============================================================================

/**
 * Navigate to and select an action in the main battle menu.
 *
 * Reads the current cursor position and calculates the optimal
 * button presses to reach the target option.
 *
 * @param option - The action to select: "fight", "bag", "pokemon", or "run"
 * @returns Result with success status and optional error message
 */
export async function selectAction(option: ActionOption): Promise<BattleActionResult> {
    // Verify we're in battle
    if (!(await isInBattle())) {
        return { success: false, error: "Not in battle" };
    }

    // Verify we're in the action menu
    if (!(await isInActionMenu())) {
        return { success: false, error: "Not in action selection menu" };
    }

    // Get current cursor position
    const currentPos = await getActionSelectionCursor();
    const targetPos = actionOptionToPosition(option);

    // Calculate and execute navigation
    const navButtons = calculateGridNavigation(currentPos, targetPos);

    if (navButtons.length > 0) {
        await pressButtons(navButtons);
    }

    // Confirm selection
    await pressButtons(["A"]);

    return { success: true };
}

/**
 * Select "Fight" from the main battle menu.
 * This opens the move selection menu.
 */
export async function selectFight(): Promise<BattleActionResult> {
    return selectAction("fight");
}

/**
 * Select "Bag" from the main battle menu.
 * This opens the bag menu.
 */
export async function selectBag(): Promise<BattleActionResult> {
    return selectAction("bag");
}

/**
 * Select "Pokemon" from the main battle menu.
 * This opens the party menu for switching.
 */
export async function selectPokemon(): Promise<BattleActionResult> {
    return selectAction("pokemon");
}

/**
 * Select "Run" from the main battle menu.
 * Attempts to flee from the battle (may fail for trainer battles).
 */
export async function selectRun(): Promise<BattleActionResult> {
    return selectAction("run");
}

// ============================================================================
// Move Selection
// ============================================================================

/**
 * Navigate to and select a move in the move selection menu.
 *
 * Reads the current cursor position and calculates the optimal
 * button presses to reach the target move slot.
 *
 * @param slot - The move slot to select (1-4)
 * @returns Result with success status and optional error message
 */
export async function selectMove(slot: number): Promise<BattleActionResult> {
    if (slot < 1 || slot > 4) {
        return { success: false, error: "Move slot must be 1-4" };
    }

    // Verify we're in battle
    if (!(await isInBattle())) {
        return { success: false, error: "Not in battle" };
    }

    // Verify we're in the move menu
    if (!(await isInMoveMenu())) {
        return { success: false, error: "Not in move selection menu" };
    }

    // Convert 1-based slot to 0-based position
    const targetPos = (slot - 1) as MoveCursorPosition;

    // Get current cursor position
    const currentPos = await getMoveSelectionCursor();

    // Calculate and execute navigation
    const navButtons = calculateGridNavigation(currentPos, targetPos);

    if (navButtons.length > 0) {
        await pressButtons(navButtons);
    }

    // Confirm selection
    await pressButtons(["A"]);

    return { success: true };
}

// ============================================================================
// Combined Actions
// ============================================================================

/**
 * Select Fight and then select a specific move.
 *
 * This is a convenience function that handles the full flow
 * from the main battle menu to move confirmation.
 *
 * @param slot - The move slot to select (1-4)
 * @returns Result with success status and optional error message
 */
export async function useMove(slot: number): Promise<BattleActionResult> {
    if (slot < 1 || slot > 4) {
        return { success: false, error: "Move slot must be 1-4" };
    }

    // First, select Fight to open the move menu
    const fightResult = await selectFight();
    if (!fightResult.success) {
        return fightResult;
    }

    // Wait a frame for the menu to transition
    // (In practice, mGBA-http may need a delay here)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Now select the move
    return selectMove(slot);
}

/**
 * Cancel out of the current menu (press B).
 *
 * Useful for backing out of move selection to return to action menu.
 */
export async function cancelMenu(): Promise<BattleActionResult> {
    await pressButtons(["B"]);
    return { success: true };
}

// ============================================================================
// State Queries (re-exported for convenience)
// ============================================================================

export {
    isInBattle,
    isInActionMenu,
    isInMoveMenu,
    getActionSelectionCursor,
    getMoveSelectionCursor,
    ACTION_CURSOR,
    MOVE_CURSOR,
} from "@gempp/core";
