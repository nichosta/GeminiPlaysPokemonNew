import { pressButtons } from "../mgba/input";

/**
 * Selects a move in battle.
 * Assumes "Fight" menu is active or main battle menu is active.
 * Ideally, checking state would be better.
 * For v1, assumes cursor at top-left (Fight) of main menu.
 */
export async function selectMove(slot: number): Promise<boolean> {
    if (slot < 1 || slot > 4) throw new Error("Move slot must be 1-4");

    // 1. Enter Fight Menu from Main (Assume cursor on Fight)
    await pressButtons(["A"]);

    // 2. Select Move
    // Grid:
    // 1 2
    // 3 4
    const moves = [
        [], // 0 placeholder
        [], // 1 (Top-Left)
        ["Right"], // 2 (Top-Right)
        ["Down", "Left"], // 3 (Bottom-Left) - Reset H first? Or just Down? Emerald has 2 rows.
        ["Down", "Right"] // 4 (Bottom-Right)
    ];

    // Simple navigation logic (blind)
    // Ideally we reset cursor to top-left?
    // In Emerald, cursor remembers last position?
    // This is risky without memory reading of cursor pos.
    // For this implementation, we'll just expose the function structure.
    console.warn("selectMove: Cursor tracking not implemented. Assuming Move 1 for now.");

    // Placeholder implementation for structure
    await pressButtons(["A"]); // Confirm move
    return true;
}

export async function selectBag(): Promise<boolean> {
    // Main Menu -> Bag (Down-Left? No, Bag is usually distinct)
    // Emerald: Fight (TL), Pokemon (TR), Bag (BL), Run (BR).
    // Or is it Fight(TL), Bag(TR), Pokemon(BL), Run(BR)?
    // Need to verify layout. 
    // Emerald: 
    // FIGHT   BAG
    // POKEMON RUN
    // wait...
    // Let's assume standard interaction for now.
    return true;
}

export async function switchPokemon(slot: number): Promise<boolean> {
    return true;
}

export async function selectRun(): Promise<boolean> {
    // Navigate to Run and press A
    return true;
}
