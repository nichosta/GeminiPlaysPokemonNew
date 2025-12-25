/**
 * Player state reading
 *
 * Reads player position, facing direction, movement state (surf/bike/dive),
 * controls locked status, and badges from memory.
 */

import { readUint8, readUint16, readUint32 } from '../memory/client';
import {
    SAVESTATE_OBJECT_POINTER_ADDR,
    SAVESTATE_PLAYER_X_OFFSET,
    SAVESTATE_PLAYER_Y_OFFSET,
    SAVESTATE_FLAGS_OFFSET,
    MAP_BANK_ADDR,
    MAP_NUMBER_ADDR,
    SCRIPT_LOCK_FIELD_CONTROLS,
    PLAYER_AVATAR_FLAGS_ADDR,
    AVATAR_FLAG_SURFING,
    AVATAR_FLAG_MACH_BIKE,
    AVATAR_FLAG_ACRO_BIKE,
    AVATAR_FLAG_DIVING,
    FACING_DIRECTION_ADDR,
    FACING_DIRECTION_MASK,
    FACING_DIRECTIONS,
    type FacingDirection,
} from '../addresses';
import { getMapName } from '../constants/overworldMapMap';
import { flagMap, BADGE_DEFINITIONS } from '../constants/savestateFlagMap';

// ============================================================================
// Types
// ============================================================================

export interface PlayerPosition {
    x: number;
    y: number;
}

export interface PlayerState {
    /** Current map bank/group number */
    mapBank: number;
    /** Current map number within the bank */
    mapNumber: number;
    /** Human-readable map name */
    mapName: string;
    /** Player position on current map */
    position: PlayerPosition;
    /** Direction the player is facing */
    facing: FacingDirection;
    /** True if player is surfing */
    isSurfing: boolean;
    /** True if player is on a bike (Mach or Acro) */
    isBiking: boolean;
    /** True if player is on Mach Bike specifically */
    isMachBike: boolean;
    /** True if player is on Acro Bike specifically */
    isAcroBike: boolean;
    /** True if player is diving underwater */
    isDiving: boolean;
    /** True if field controls are locked (in menu, dialogue, etc.) */
    controlsLocked: boolean;
}

export interface Badge {
    /** Badge name (e.g., "Stone Badge") */
    name: string;
    /** True if the player has earned this badge */
    obtained: boolean;
}

// ============================================================================
// Map Location
// ============================================================================

/**
 * Get the current map bank (group) number
 */
export async function getMapBank(): Promise<number> {
    return await readUint8(MAP_BANK_ADDR);
}

/**
 * Get the current map number within the bank
 */
export async function getMapNumber(): Promise<number> {
    return await readUint8(MAP_NUMBER_ADDR);
}

/**
 * Get the current map name
 */
export async function getCurrentMapName(): Promise<string> {
    const bank = await getMapBank();
    const num = await getMapNumber();
    return getMapName(bank, num) ?? `UNKNOWN_${bank}_${num}`;
}

// ============================================================================
// Player Position
// ============================================================================

/**
 * Get the player's current position
 */
export async function getPlayerPosition(): Promise<PlayerPosition> {
    const saveBlockPtr = await readUint32(SAVESTATE_OBJECT_POINTER_ADDR);
    const x = await readUint16(saveBlockPtr + SAVESTATE_PLAYER_X_OFFSET);
    const y = await readUint16(saveBlockPtr + SAVESTATE_PLAYER_Y_OFFSET);
    return { x, y };
}

// ============================================================================
// Facing Direction
// ============================================================================

/**
 * Get the direction the player is facing
 */
export async function getFacingDirection(): Promise<FacingDirection> {
    const raw = await readUint8(FACING_DIRECTION_ADDR);
    const direction = raw & FACING_DIRECTION_MASK;

    switch (direction) {
        case FACING_DIRECTIONS.DOWN:
            return 'down';
        case FACING_DIRECTIONS.UP:
            return 'up';
        case FACING_DIRECTIONS.LEFT:
            return 'left';
        case FACING_DIRECTIONS.RIGHT:
            return 'right';
        default:
            // Default to down if unknown
            return 'down';
    }
}

// ============================================================================
// Movement State (Surf/Bike/Dive)
// ============================================================================

/**
 * Get the player's avatar flags byte
 */
async function getAvatarFlags(): Promise<number> {
    return await readUint8(PLAYER_AVATAR_FLAGS_ADDR);
}

/**
 * Check if the player is currently surfing
 */
export async function isSurfing(): Promise<boolean> {
    const flags = await getAvatarFlags();
    return (flags & AVATAR_FLAG_SURFING) !== 0;
}

/**
 * Check if the player is on the Mach Bike
 */
export async function isMachBike(): Promise<boolean> {
    const flags = await getAvatarFlags();
    return (flags & AVATAR_FLAG_MACH_BIKE) !== 0;
}

/**
 * Check if the player is on the Acro Bike
 */
export async function isAcroBike(): Promise<boolean> {
    const flags = await getAvatarFlags();
    return (flags & AVATAR_FLAG_ACRO_BIKE) !== 0;
}

/**
 * Check if the player is on any bike (Mach or Acro)
 */
export async function isBiking(): Promise<boolean> {
    const flags = await getAvatarFlags();
    return (flags & (AVATAR_FLAG_MACH_BIKE | AVATAR_FLAG_ACRO_BIKE)) !== 0;
}

/**
 * Check if the player is diving underwater
 */
export async function isDiving(): Promise<boolean> {
    const flags = await getAvatarFlags();
    return (flags & AVATAR_FLAG_DIVING) !== 0;
}

// ============================================================================
// Controls Locked
// ============================================================================

/**
 * Check if field controls are locked (player cannot move)
 *
 * This is true when in menus, dialogue, cutscenes, etc.
 */
export async function areControlsLocked(): Promise<boolean> {
    const lockByte = await readUint8(SCRIPT_LOCK_FIELD_CONTROLS);
    return lockByte !== 0;
}

// ============================================================================
// Badges
// ============================================================================

/**
 * Check if a specific flag is set in the save data
 *
 * @param flagId - The flag ID (from flagMap)
 * @returns True if the flag is set
 */
async function isFlagSet(flagId: number): Promise<boolean> {
    const saveBlockPtr = await readUint32(SAVESTATE_OBJECT_POINTER_ADDR);
    const flagsBase = saveBlockPtr + SAVESTATE_FLAGS_OFFSET;

    // Flags are stored as a bit array
    // Each flag ID corresponds to a bit: byte = flagId / 8, bit = flagId % 8
    const byteOffset = Math.floor(flagId / 8);
    const bitOffset = flagId % 8;

    const flagByte = await readUint8(flagsBase + byteOffset);
    return (flagByte & (1 << bitOffset)) !== 0;
}

/**
 * Get all badges with their obtained status
 */
export async function getBadges(): Promise<Badge[]> {
    const badges: Badge[] = [];

    for (const badge of BADGE_DEFINITIONS) {
        const flagId = flagMap.get(badge.flagConstant);
        if (flagId === undefined) continue;

        const obtained = await isFlagSet(flagId);
        badges.push({
            name: badge.name,
            obtained,
        });
    }

    return badges;
}

/**
 * Get the count of badges obtained
 */
export async function getBadgeCount(): Promise<number> {
    const badges = await getBadges();
    return badges.filter(b => b.obtained).length;
}

/**
 * Check if a specific badge has been obtained
 *
 * @param badgeName - The badge name (e.g., "Stone Badge")
 */
export async function hasBadge(badgeName: string): Promise<boolean> {
    const badges = await getBadges();
    const badge = badges.find(b => b.name === badgeName);
    return badge?.obtained ?? false;
}

// ============================================================================
// Full State
// ============================================================================

/**
 * Get the complete player state
 */
export async function getPlayerState(): Promise<PlayerState> {
    const [
        mapBank,
        mapNumber,
        position,
        facing,
        surfing,
        machBike,
        acroBike,
        diving,
        controlsLocked,
    ] = await Promise.all([
        getMapBank(),
        getMapNumber(),
        getPlayerPosition(),
        getFacingDirection(),
        isSurfing(),
        isMachBike(),
        isAcroBike(),
        isDiving(),
        areControlsLocked(),
    ]);

    const mapName = getMapName(mapBank, mapNumber) ?? `UNKNOWN_${mapBank}_${mapNumber}`;

    return {
        mapBank,
        mapNumber,
        mapName,
        position,
        facing,
        isSurfing: surfing,
        isBiking: machBike || acroBike,
        isMachBike: machBike,
        isAcroBike: acroBike,
        isDiving: diving,
        controlsLocked,
    };
}
