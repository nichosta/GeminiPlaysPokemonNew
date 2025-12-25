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

/** Offset to flags array within savestate object (for badge reading) */
export const SAVESTATE_FLAGS_OFFSET = 0x1270;

/** Current map bank/group address (u8) */
export const MAP_BANK_ADDR = 0x020322e4;

/** Current map number address (u8) */
export const MAP_NUMBER_ADDR = 0x020322e5;

/** Script lock field controls (checks if in menu/dialogue) */
export const SCRIPT_LOCK_FIELD_CONTROLS = 0x03000f2c;

/** Player avatar flags address (gPlayerAvatar + 0x00) */
export const PLAYER_AVATAR_FLAGS_ADDR = 0x02037590;

/** Avatar flag masks */
export const AVATAR_FLAG_SURFING = 0x08;
export const AVATAR_FLAG_MACH_BIKE = 0x02;
export const AVATAR_FLAG_ACRO_BIKE = 0x04;
export const AVATAR_FLAG_DIVING = 0x10;

/** Address containing player facing direction (ObjectEvent struct) */
export const FACING_DIRECTION_ADDR = 0x02037368;

/** Mask to extract facing direction from the byte */
export const FACING_DIRECTION_MASK = 0x0f;

/** Facing direction values */
export const FACING_DIRECTIONS = {
    DOWN: 1,
    UP: 2,
    LEFT: 3,
    RIGHT: 4,
} as const;

export type FacingDirection = 'down' | 'up' | 'left' | 'right';

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

/** Size of each Pokemon struct (100 bytes) */
export const POKEMON_SIZE = 100;

/** Address of gPlayerPartyCount */
export const PLAYER_PARTY_COUNT_ADDR = 0x020244e9;

/** Maximum party size */
export const PARTY_SIZE = 6;

/**
 * Pokemon struct offsets (100-byte structure)
 *
 * Layout:
 * - 0x00-0x1F: Unencrypted header (32 bytes)
 * - 0x20-0x4F: Encrypted data block (48 bytes, 4 substructures of 12 bytes)
 * - 0x50-0x63: Unencrypted battle stats (20 bytes)
 */
export const POKEMON_OFFSETS = {
    // Unencrypted header (0x00-0x1F)
    PID: 0x00,              // u32 - Personality ID
    OTID: 0x04,             // u32 - Original Trainer ID
    NICKNAME: 0x08,         // 10 bytes - Nickname (custom encoding)
    LANGUAGE: 0x12,         // u8 - Language
    MISC_FLAGS: 0x13,       // u8 - Misc flags (bad egg, has species, is egg)
    OT_NAME: 0x14,          // 7 bytes - Original Trainer name
    MARKINGS: 0x1B,         // u8 - Box markings
    CHECKSUM: 0x1C,         // u16 - Data checksum
    SANITY: 0x1E,           // u16 - Sanity/padding

    // Encrypted block (0x20-0x4F)
    ENCRYPTED_START: 0x20,
    ENCRYPTED_SIZE: 48,

    // Unencrypted battle stats (0x50-0x63)
    STATUS: 0x50,           // u32 - Status condition
    LEVEL: 0x54,            // u8 - Current level
    POKERUS: 0x55,          // u8 - Pokerus status
    CURRENT_HP: 0x56,       // u16 - Current HP
    MAX_HP: 0x58,           // u16 - Max HP
    ATK: 0x5A,              // u16 - Attack stat
    DEF: 0x5C,              // u16 - Defense stat
    SPEED: 0x5E,            // u16 - Speed stat
    SPATK: 0x60,            // u16 - Special Attack stat
    SPDEF: 0x62,            // u16 - Special Defense stat
} as const;

/** Size of each encrypted substructure */
export const SUBSTRUCTURE_SIZE = 12;

/**
 * Substructure order lookup table based on PID % 24
 * G = Growth, A = Attacks, E = EVs/Condition, M = Misc
 */
export const SUBSTRUCTURE_ORDER = [
    "GAEM", "GAME", "GEAM", "GEMA", "GMAE", "GMEA", // 0-5
    "AGEM", "AGME", "AEGM", "AEMG", "AMGE", "AMEG", // 6-11
    "EGAM", "EGMA", "EAGM", "EAMG", "EMGA", "EMAG", // 12-17
    "MGAE", "MGEA", "MAGE", "MAEG", "MEGA", "MEAG", // 18-23
] as const;

/**
 * Offsets within the Growth substructure (12 bytes)
 */
export const GROWTH_OFFSETS = {
    SPECIES: 0x00,          // u16 - Species ID
    HELD_ITEM: 0x02,        // u16 - Held item ID
    EXPERIENCE: 0x04,       // u32 - Experience points
    PP_BONUSES: 0x08,       // u8 - PP bonus flags (2 bits per move)
    FRIENDSHIP: 0x09,       // u8 - Friendship/happiness
    UNKNOWN: 0x0A,          // u16 - Unknown/padding
} as const;

/**
 * Offsets within the Attacks substructure (12 bytes)
 */
export const ATTACKS_OFFSETS = {
    MOVE1: 0x00,            // u16 - Move 1 ID
    MOVE2: 0x02,            // u16 - Move 2 ID
    MOVE3: 0x04,            // u16 - Move 3 ID
    MOVE4: 0x06,            // u16 - Move 4 ID
    PP1: 0x08,              // u8 - Move 1 PP
    PP2: 0x09,              // u8 - Move 2 PP
    PP3: 0x0A,              // u8 - Move 3 PP
    PP4: 0x0B,              // u8 - Move 4 PP
} as const;

/**
 * Offsets within the EVs/Condition substructure (12 bytes)
 */
export const EVS_OFFSETS = {
    HP_EV: 0x00,            // u8
    ATK_EV: 0x01,           // u8
    DEF_EV: 0x02,           // u8
    SPEED_EV: 0x03,         // u8
    SPATK_EV: 0x04,         // u8
    SPDEF_EV: 0x05,         // u8
    COOLNESS: 0x06,         // u8 - Contest stat
    BEAUTY: 0x07,           // u8 - Contest stat
    CUTENESS: 0x08,         // u8 - Contest stat
    SMARTNESS: 0x09,        // u8 - Contest stat
    TOUGHNESS: 0x0A,        // u8 - Contest stat
    FEEL: 0x0B,             // u8 - Contest sheen
} as const;

/**
 * Offsets within the Misc substructure (12 bytes)
 */
export const MISC_OFFSETS = {
    POKERUS: 0x00,          // u8 - Pokerus strain/days
    MET_LOCATION: 0x01,     // u8 - Where caught
    ORIGINS: 0x02,          // u16 - Met level, game, ball type
    IVS_ABILITY: 0x04,      // u32 - IVs (5 bits each) + egg + ability bit
    RIBBONS: 0x08,          // u32 - Ribbon flags
} as const;

/**
 * Status condition bit masks
 * Sleep uses bits 0-2 (value = turns remaining)
 */
export const STATUS_MASKS = {
    SLEEP: 0b111,           // Bits 0-2: sleep turns (0 = not asleep)
    POISON: 1 << 3,         // Bit 3
    BURN: 1 << 4,           // Bit 4
    FREEZE: 1 << 5,         // Bit 5
    PARALYSIS: 1 << 6,      // Bit 6
    BAD_POISON: 1 << 7,     // Bit 7 (toxic)
} as const;

/**
 * Pokemon type IDs
 */
export const POKEMON_TYPES: Record<number, string> = {
    0: "Normal",
    1: "Fighting",
    2: "Flying",
    3: "Poison",
    4: "Ground",
    5: "Rock",
    6: "Bug",
    7: "Ghost",
    8: "Steel",
    9: "???",
    10: "Fire",
    11: "Water",
    12: "Grass",
    13: "Electric",
    14: "Psychic",
    15: "Ice",
    16: "Dragon",
    17: "Dark",
} as const;

/** Species info base address in ROM */
export const SPECIES_INFO_ADDR = 0x083203cc;

/** Size of SpeciesInfo struct */
export const SPECIES_INFO_SIZE = 0x1c;

/** Offsets within SpeciesInfo struct */
export const SPECIES_INFO_OFFSETS = {
    TYPES: 0x06,            // u8[2] - Type 1, Type 2
    ABILITIES: 0x16,        // u8[2] - Ability 1, Ability 2
} as const;

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

/** Money offset within SaveBlock1 (encrypted with security key) */
export const MONEY_OFFSET = 0x0490;

/** Size of each item slot (u16 itemId + u16 encryptedQuantity) */
export const ITEM_SLOT_SIZE = 4;

/**
 * Bag pocket definitions
 * Order in memory: Items, KeyItems, PokeBalls, TMsHMs, Berries
 * Offsets are relative to SaveBlock1 + BAG_OFFSET
 */
export const BAG_POCKETS = {
    Items: { offset: 0x0000, capacity: 30 },
    KeyItems: { offset: 0x0078, capacity: 30 },
    PokeBalls: { offset: 0x00f0, capacity: 16 },
    TMsHMs: { offset: 0x0130, capacity: 64 },
    Berries: { offset: 0x0230, capacity: 46 },
} as const;

export type PocketName = keyof typeof BAG_POCKETS;

/** Items pocket capacity - the only one that can realistically fill up */
export const ITEMS_POCKET_CAPACITY = 30;
