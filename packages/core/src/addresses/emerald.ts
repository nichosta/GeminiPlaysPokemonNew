/**
 * Pokemon Emerald memory addresses
 * 
 * These addresses are for Pokemon Emerald (U) v1.0
 * Sourced from pokeemerald decompilation project
 */

// ============================================================================
// Task System
// ============================================================================

/** 
 * Address of gTasks array - 16 task slots
 * Each task is 0x28 (40) bytes
 */
export const GTASKS_ADDR = 0x03005e00;

/** Size of each task struct in bytes */
export const TASK_SIZE = 0x28;

/** Number of task slots */
export const TASK_COUNT = 16;

/** Task struct field offsets */
export const TASK_OFFSETS = {
    /** Function pointer (u32) */
    FUNC: 0x00,
    /** Is task active (u8) */
    IS_ACTIVE: 0x04,
    /** Previous task in priority chain (u8), 0xFE = HEAD_SENTINEL */
    PREV: 0x05,
    /** Next task in priority chain (u8) */
    NEXT: 0x06,
    /** Task priority (u8), lower = higher priority */
    PRIORITY: 0x07,
    /** Task data array (s16[16]) */
    DATA: 0x08,
} as const;

/** Sentinel value indicating head of priority chain */
export const HEAD_SENTINEL = 0xfe;

/** Sentinel value indicating tail/no task */
export const TAIL_SENTINEL = 0xff;

// ============================================================================
// Battle State
// ============================================================================

/** Address to check if in battle (gMain + 0x439) */
export const IN_BATTLE_BIT_ADDR = 0x030026f9;

/** Bitmask for in-battle flag */
export const IN_BATTLE_BITMASK = 0x02;

// ============================================================================
// Player State
// ============================================================================

/** Pointer to savestate object (contains player position, etc.) */
export const SAVESTATE_OBJECT_POINTER_ADDR = 0x03005d8c;

/** Offsets from savestate object for player data */
export const SAVESTATE_PLAYER_X_OFFSET = 0x00;
export const SAVESTATE_PLAYER_Y_OFFSET = 0x02;

/** Script lock field controls (checks if in menu/dialogue) */
export const SCRIPT_LOCK_FIELD_CONTROLS = 0x03000f2c;

/** Player avatar flags address (gPlayerAvatar + 0x00) */
export const PLAYER_AVATAR_FLAGS_ADDR = 0x02037590;

/** Avatar flag masks */
export const AVATAR_FLAG_SURFING = 0x08;
export const AVATAR_FLAG_MACH_BIKE = 0x02;
export const AVATAR_FLAG_ACRO_BIKE = 0x04;
export const AVATAR_FLAG_DIVING = 0x10;

// ============================================================================
// Party Menu
// ============================================================================

/** Address of gPartyMenu struct */
export const PARTY_MENU_ADDR = 0x0203cec8;

/** Offset to slotId within gPartyMenu */
export const PARTY_MENU_SLOT_ID_OFFSET = 0x09;

// ============================================================================
// Pokemon Party
// ============================================================================

/** Address of gPlayerParty array */
export const PLAYER_PARTY_ADDR = 0x020244ec;

/** Size of each Pokemon struct */
export const POKEMON_SIZE = 100;

/** Address of gPlayerPartyCount */
export const PLAYER_PARTY_COUNT_ADDR = 0x020244e9;

// ============================================================================
// Bag / Inventory
// ============================================================================

/** Pointer to save block 1 (contains player pos, bag pointers, etc.) */
export const SAVE_BLOCK_1_PTR_ADDR = 0x03005d8c;

/** Pointer to save block 2 (contains set options, encryption key, etc.) */
export const SAVE_BLOCK_2_PTR_ADDR = 0x03005d90;

/** Offset to bag within save block 1 */
export const BAG_OFFSET = 0x0560;

/** Security key offset for decryption (within SaveBlock2) */
export const SECURITY_KEY_OFFSET = 0x00ac;

/** Pocket information (Internal Order: Items, PokeBalls, TMsHMs, Berries, KeyItems) */
export const POCKET_NAMES = ["Items", "PokeBalls", "TMsHMs", "Berries", "KeyItems"] as const;
export const POCKET_COUNT = 5;
