/**
 * Pokemon party data reading and decryption
 *
 * Reads party Pokemon from memory, decrypts the encrypted data block,
 * and provides structured access to all Pokemon data.
 */

import { readUint8, readUint16, readUint32, readRange } from '../memory/client';
import {
    PLAYER_PARTY_ADDR,
    PLAYER_PARTY_COUNT_ADDR,
    POKEMON_SIZE,
    PARTY_SIZE,
    POKEMON_OFFSETS,
    SUBSTRUCTURE_SIZE,
    SUBSTRUCTURE_ORDER,
    GROWTH_OFFSETS,
    ATTACKS_OFFSETS,
    MISC_OFFSETS,
    STATUS_MASKS,
    POKEMON_TYPES,
    SPECIES_INFO_ADDR,
    SPECIES_INFO_SIZE,
    SPECIES_INFO_OFFSETS,
    IN_BATTLE_BIT_ADDR,
    IN_BATTLE_BITMASK,
} from '../addresses';
import { getSpeciesName } from '../constants/speciesMap';
import { getMoveName } from '../constants/movesMap';
import { getAbilityName } from '../constants/abilityMap';
import { getItemName } from '../constants/itemMap';
import { decodeByteArrayToString } from '../constants/textCharacterMap';

// ============================================================================
// Types
// ============================================================================

export interface PokemonMove {
    /** Move ID */
    id: number;
    /** Human-readable move name */
    name: string;
    /** Current PP */
    pp: number;
}

export interface PokemonStats {
    hp: number;
    atk: number;
    def: number;
    spatk: number;
    spdef: number;
    speed: number;
}

export type StatusCondition =
    | 'none'
    | 'sleep'
    | 'poison'
    | 'burn'
    | 'freeze'
    | 'paralysis'
    | 'bad_poison';

export interface PokemonData {
    /** Party slot (0-5) */
    slot: number;
    /** Species ID */
    speciesId: number;
    /** Human-readable species name */
    species: string;
    /** Pokemon nickname */
    nickname: string;
    /** Current level */
    level: number;
    /** Current HP */
    currentHp: number;
    /** Maximum HP */
    maxHp: number;
    /** Calculated stats */
    stats: PokemonStats;
    /** Current status condition */
    status: StatusCondition;
    /** Array of moves (up to 4, excludes empty slots) */
    moves: PokemonMove[];
    /** Pokemon types (1 or 2) */
    types: string[];
    /** Ability name */
    ability: string;
    /** Held item name, or null if none */
    heldItem: string | null;
    /** True if this Pokemon has fainted */
    isFainted: boolean;
    /** True if this is an egg */
    isEgg: boolean;
}

// ============================================================================
// Decryption
// ============================================================================

/**
 * Decrypt the 48-byte encrypted data block
 *
 * @param encryptedData - The 48-byte encrypted block
 * @param pid - Personality ID
 * @param otid - Original Trainer ID
 * @returns Decrypted data as Uint8Array
 */
function decryptDataBlock(encryptedData: Uint8Array, pid: number, otid: number): Uint8Array {
    const key = (pid ^ otid) >>> 0; // Ensure unsigned
    const decrypted = new Uint8Array(encryptedData.length);

    // XOR each 32-bit word with the key
    for (let i = 0; i < encryptedData.length; i += 4) {
        const word =
            encryptedData[i] |
            (encryptedData[i + 1] << 8) |
            (encryptedData[i + 2] << 16) |
            (encryptedData[i + 3] << 24);

        const decryptedWord = (word ^ key) >>> 0;

        decrypted[i] = decryptedWord & 0xff;
        decrypted[i + 1] = (decryptedWord >> 8) & 0xff;
        decrypted[i + 2] = (decryptedWord >> 16) & 0xff;
        decrypted[i + 3] = (decryptedWord >> 24) & 0xff;
    }

    return decrypted;
}

/**
 * Get the position of a substructure within the decrypted block
 *
 * @param pid - Personality ID
 * @param substructure - 'G', 'A', 'E', or 'M'
 * @returns Offset within the 48-byte decrypted block
 */
function getSubstructureOffset(pid: number, substructure: 'G' | 'A' | 'E' | 'M'): number {
    const orderIndex = pid % 24;
    const order = SUBSTRUCTURE_ORDER[orderIndex];
    const position = order.indexOf(substructure);
    return position * SUBSTRUCTURE_SIZE;
}

/**
 * Extract a substructure from the decrypted data block
 *
 * @param decryptedData - The 48-byte decrypted block
 * @param pid - Personality ID
 * @param substructure - Which substructure to extract
 * @returns 12-byte substructure data
 */
function getSubstructure(
    decryptedData: Uint8Array,
    pid: number,
    substructure: 'G' | 'A' | 'E' | 'M'
): DataView {
    const offset = getSubstructureOffset(pid, substructure);
    return new DataView(decryptedData.buffer, offset, SUBSTRUCTURE_SIZE);
}

// ============================================================================
// Status Condition Parsing
// ============================================================================

/**
 * Parse status condition from the status byte
 */
function parseStatusCondition(status: number): StatusCondition {
    if (status === 0) return 'none';
    if (status & STATUS_MASKS.BAD_POISON) return 'bad_poison';
    if (status & STATUS_MASKS.PARALYSIS) return 'paralysis';
    if (status & STATUS_MASKS.FREEZE) return 'freeze';
    if (status & STATUS_MASKS.BURN) return 'burn';
    if (status & STATUS_MASKS.POISON) return 'poison';
    if (status & STATUS_MASKS.SLEEP) return 'sleep';
    return 'none';
}

// ============================================================================
// Species Info Reading (ROM)
// ============================================================================

/**
 * Read species info from ROM (types and abilities)
 *
 * @param speciesId - Species ID
 * @returns Object with types and abilities arrays
 */
async function getSpeciesInfo(speciesId: number): Promise<{
    types: [number, number];
    abilities: [number, number];
}> {
    const addr = SPECIES_INFO_ADDR + speciesId * SPECIES_INFO_SIZE;

    // Read types (2 bytes)
    const typesAddr = addr + SPECIES_INFO_OFFSETS.TYPES;
    const type1 = await readUint8(typesAddr);
    const type2 = await readUint8(typesAddr + 1);

    // Read abilities (2 bytes)
    const abilitiesAddr = addr + SPECIES_INFO_OFFSETS.ABILITIES;
    const ability1 = await readUint8(abilitiesAddr);
    const ability2 = await readUint8(abilitiesAddr + 1);

    return {
        types: [type1, type2],
        abilities: [ability1, ability2],
    };
}

// ============================================================================
// Pokemon Reading
// ============================================================================

/**
 * Read the number of Pokemon in the party
 */
export async function getPartyCount(): Promise<number> {
    return await readUint8(PLAYER_PARTY_COUNT_ADDR);
}

/**
 * Read a single Pokemon from the party
 *
 * @param slot - Party slot (0-5)
 * @returns Pokemon data, or null if slot is empty
 */
export async function getPokemon(slot: number): Promise<PokemonData | null> {
    if (slot < 0 || slot >= PARTY_SIZE) {
        throw new Error(`Invalid party slot: ${slot}. Must be 0-5.`);
    }

    const partyCount = await getPartyCount();
    if (slot >= partyCount) {
        return null;
    }

    const baseAddr = PLAYER_PARTY_ADDR + slot * POKEMON_SIZE;

    // Read the entire Pokemon struct at once
    const rawData = await readRange(baseAddr, POKEMON_SIZE);
    const dataView = new DataView(rawData.buffer);

    // Read PID and OTID for decryption
    const pid = dataView.getUint32(POKEMON_OFFSETS.PID, true);
    const otid = dataView.getUint32(POKEMON_OFFSETS.OTID, true);

    // Check misc flags for egg status
    const miscFlags = dataView.getUint8(POKEMON_OFFSETS.MISC_FLAGS);
    const isEgg = (miscFlags & 0x04) !== 0;

    // Read and decode nickname
    const nicknameBytes: number[] = [];
    for (let i = 0; i < 10; i++) {
        nicknameBytes.push(rawData[POKEMON_OFFSETS.NICKNAME + i]);
    }
    const nickname = decodeByteArrayToString(nicknameBytes);

    // Read unencrypted battle stats
    const status = dataView.getUint32(POKEMON_OFFSETS.STATUS, true);
    const level = dataView.getUint8(POKEMON_OFFSETS.LEVEL);
    const currentHp = dataView.getUint16(POKEMON_OFFSETS.CURRENT_HP, true);
    const maxHp = dataView.getUint16(POKEMON_OFFSETS.MAX_HP, true);

    const stats: PokemonStats = {
        hp: maxHp,
        atk: dataView.getUint16(POKEMON_OFFSETS.ATK, true),
        def: dataView.getUint16(POKEMON_OFFSETS.DEF, true),
        speed: dataView.getUint16(POKEMON_OFFSETS.SPEED, true),
        spatk: dataView.getUint16(POKEMON_OFFSETS.SPATK, true),
        spdef: dataView.getUint16(POKEMON_OFFSETS.SPDEF, true),
    };

    // Extract and decrypt the encrypted block
    const encryptedBlock = rawData.slice(
        POKEMON_OFFSETS.ENCRYPTED_START,
        POKEMON_OFFSETS.ENCRYPTED_START + POKEMON_OFFSETS.ENCRYPTED_SIZE
    );
    const decryptedBlock = decryptDataBlock(encryptedBlock, pid, otid);

    // Get Growth substructure (species, held item)
    const growth = getSubstructure(decryptedBlock, pid, 'G');
    const speciesId = growth.getUint16(GROWTH_OFFSETS.SPECIES, true);
    const heldItemId = growth.getUint16(GROWTH_OFFSETS.HELD_ITEM, true);

    // Get Attacks substructure (moves, PP)
    const attacks = getSubstructure(decryptedBlock, pid, 'A');
    const moves: PokemonMove[] = [];

    const moveOffsets = [
        ATTACKS_OFFSETS.MOVE1,
        ATTACKS_OFFSETS.MOVE2,
        ATTACKS_OFFSETS.MOVE3,
        ATTACKS_OFFSETS.MOVE4,
    ];
    const ppOffsets = [
        ATTACKS_OFFSETS.PP1,
        ATTACKS_OFFSETS.PP2,
        ATTACKS_OFFSETS.PP3,
        ATTACKS_OFFSETS.PP4,
    ];

    for (let i = 0; i < 4; i++) {
        const moveId = attacks.getUint16(moveOffsets[i], true);
        if (moveId === 0) continue; // Skip empty move slots

        const pp = attacks.getUint8(ppOffsets[i]);
        const name = getMoveName(moveId) ?? `UNKNOWN_${moveId}`;
        moves.push({ id: moveId, name, pp });
    }

    // Get Misc substructure for ability bit
    const misc = getSubstructure(decryptedBlock, pid, 'M');
    const ivsAbility = misc.getUint32(MISC_OFFSETS.IVS_ABILITY, true);
    const abilityBit = (ivsAbility >> 31) & 1; // Bit 31 determines ability slot

    // Get species info from ROM
    const speciesInfo = await getSpeciesInfo(speciesId);

    // Determine types (filter out duplicate if both are same)
    const types: string[] = [];
    const type1 = POKEMON_TYPES[speciesInfo.types[0]] ?? 'Unknown';
    const type2 = POKEMON_TYPES[speciesInfo.types[1]] ?? 'Unknown';
    types.push(type1);
    if (type2 !== type1) {
        types.push(type2);
    }

    // Determine ability
    const abilityId = speciesInfo.abilities[abilityBit];
    const ability = getAbilityName(abilityId) ?? `UNKNOWN_${abilityId}`;

    // Get species and item names
    const species = getSpeciesName(speciesId) ?? `UNKNOWN_${speciesId}`;
    const heldItem = heldItemId !== 0 ? (getItemName(heldItemId) ?? `UNKNOWN_${heldItemId}`) : null;

    return {
        slot,
        speciesId,
        species,
        nickname,
        level,
        currentHp,
        maxHp,
        stats,
        status: parseStatusCondition(status),
        moves,
        types,
        ability,
        heldItem,
        isFainted: currentHp === 0,
        isEgg,
    };
}

/**
 * Read the full party
 *
 * @returns Array of Pokemon in the party (excluding empty slots)
 */
export async function getFullParty(): Promise<PokemonData[]> {
    const partyCount = await getPartyCount();
    const party: PokemonData[] = [];

    for (let i = 0; i < partyCount; i++) {
        const pokemon = await getPokemon(i);
        if (pokemon) {
            party.push(pokemon);
        }
    }

    return party;
}

/**
 * Check if the player is currently in a battle
 */
export async function isInBattle(): Promise<boolean> {
    const bitmask = await readUint8(IN_BATTLE_BIT_ADDR);
    return (bitmask & IN_BATTLE_BITMASK) !== 0;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the lead Pokemon (first in party)
 */
export async function getLeadPokemon(): Promise<PokemonData | null> {
    return getPokemon(0);
}

/**
 * Check if the party has any Pokemon that are not fainted
 */
export async function hasUsablePokemon(): Promise<boolean> {
    const party = await getFullParty();
    return party.some(p => !p.isFainted && !p.isEgg);
}

/**
 * Get count of usable (non-fainted, non-egg) Pokemon
 */
export async function getUsablePokemonCount(): Promise<number> {
    const party = await getFullParty();
    return party.filter(p => !p.isFainted && !p.isEgg).length;
}

/**
 * Find a Pokemon in the party by species name
 *
 * @param speciesName - Species name to search for (case-sensitive)
 * @returns First matching Pokemon, or null if not found
 */
export async function findPokemonBySpecies(speciesName: string): Promise<PokemonData | null> {
    const party = await getFullParty();
    return party.find(p => p.species === speciesName) ?? null;
}

/**
 * Check if party has a Pokemon that knows a specific move
 *
 * @param moveName - Move name to search for (case-sensitive)
 * @returns Pokemon that knows the move, or null if none
 */
export async function findPokemonWithMove(moveName: string): Promise<PokemonData | null> {
    const party = await getFullParty();
    return party.find(p => p.moves.some(m => m.name === moveName)) ?? null;
}
