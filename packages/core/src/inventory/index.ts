/**
 * Inventory/bag reading
 *
 * Reads bag contents from Pokemon Emerald memory, including
 * decryption of item quantities using the security key.
 */

import { readUint16, readUint32, readRange } from '../memory/client';
import {
    SAVE_BLOCK_1_PTR_ADDR,
    SAVE_BLOCK_2_PTR_ADDR,
    BAG_OFFSET,
    SECURITY_KEY_OFFSET,
    MONEY_OFFSET,
    ITEM_SLOT_SIZE,
    BAG_POCKETS,
    ITEMS_POCKET_CAPACITY,
    type PocketName,
} from '../addresses';
import { getItemName } from '../constants/itemMap';

// ============================================================================
// Types
// ============================================================================

export interface BagItem {
    /** Raw item ID */
    id: number;
    /** Human-readable item name */
    name: string;
    /** Decrypted quantity */
    quantity: number;
}

export interface BagContents {
    items: BagItem[];
    keyItems: BagItem[];
    pokeBalls: BagItem[];
    tmsHms: BagItem[];
    berries: BagItem[];
}

export interface BagWarnings {
    /** True if Items pocket is at or near capacity (>= 27/30) */
    itemsPocketNearFull: boolean;
    /** Number of slots used in Items pocket */
    itemsPocketUsed: number;
}

// ============================================================================
// Security Key
// ============================================================================

/**
 * Get the security key used for quantity decryption
 *
 * @returns The 32-bit security key
 */
export async function getSecurityKey(): Promise<number> {
    const saveBlock2Ptr = await readUint32(SAVE_BLOCK_2_PTR_ADDR);
    return await readUint32(saveBlock2Ptr + SECURITY_KEY_OFFSET);
}

/**
 * Decrypt an encrypted quantity using the security key
 *
 * @param encryptedQuantity - The encrypted 16-bit quantity
 * @param securityKey - The 32-bit security key
 * @returns The decrypted quantity
 */
function decryptQuantity(encryptedQuantity: number, securityKey: number): number {
    // XOR with lower 16 bits of security key
    return encryptedQuantity ^ (securityKey & 0xffff);
}

// ============================================================================
// Money
// ============================================================================

/**
 * Get the player's current money (decrypted)
 *
 * @returns The player's money
 */
export async function getPlayerMoney(): Promise<number> {
    const saveBlock1Ptr = await readUint32(SAVE_BLOCK_1_PTR_ADDR);
    const encryptedMoney = await readUint32(saveBlock1Ptr + MONEY_OFFSET);
    const securityKey = await getSecurityKey();
    return encryptedMoney ^ securityKey;
}

// ============================================================================
// Pocket Reading
// ============================================================================

/**
 * Read all items from a specific bag pocket
 *
 * @param pocketName - The pocket to read
 * @param securityKey - Pre-fetched security key (optional, will fetch if not provided)
 * @returns Array of items in the pocket (excludes empty slots)
 */
export async function getPocket(
    pocketName: PocketName,
    securityKey?: number
): Promise<BagItem[]> {
    const pocket = BAG_POCKETS[pocketName];
    const key = securityKey ?? await getSecurityKey();

    // Get SaveBlock1 pointer and calculate pocket address
    const saveBlock1Ptr = await readUint32(SAVE_BLOCK_1_PTR_ADDR);
    const pocketAddr = saveBlock1Ptr + BAG_OFFSET + pocket.offset;

    // Read entire pocket at once
    const data = await readRange(pocketAddr, pocket.capacity * ITEM_SLOT_SIZE);

    const items: BagItem[] = [];
    const dataView = new DataView(data.buffer);

    for (let i = 0; i < pocket.capacity; i++) {
        const offset = i * ITEM_SLOT_SIZE;
        const itemId = dataView.getUint16(offset, true); // little-endian

        // Skip empty slots (itemId 0 = NONE)
        if (itemId === 0) continue;

        const encryptedQuantity = dataView.getUint16(offset + 2, true);
        const quantity = decryptQuantity(encryptedQuantity, key);
        const name = getItemName(itemId) ?? `UNKNOWN_${itemId}`;

        items.push({ id: itemId, name, quantity });
    }

    return items;
}

// ============================================================================
// Full Bag Reading
// ============================================================================

/**
 * Get the complete contents of all bag pockets
 *
 * @returns All bag contents organized by pocket
 */
export async function getBagContents(): Promise<BagContents> {
    // Fetch security key once for all pockets
    const securityKey = await getSecurityKey();

    // Read all pockets in parallel
    const [items, keyItems, pokeBalls, tmsHms, berries] = await Promise.all([
        getPocket('Items', securityKey),
        getPocket('KeyItems', securityKey),
        getPocket('PokeBalls', securityKey),
        getPocket('TMsHMs', securityKey),
        getPocket('Berries', securityKey),
    ]);

    return { items, keyItems, pokeBalls, tmsHms, berries };
}

/**
 * Get bag contents along with any warnings about capacity
 *
 * @returns Bag contents and warnings
 */
export async function getBagContentsWithWarnings(): Promise<{
    contents: BagContents;
    warnings: BagWarnings;
}> {
    const contents = await getBagContents();

    const itemsPocketUsed = contents.items.length;
    const warnings: BagWarnings = {
        itemsPocketNearFull: itemsPocketUsed >= ITEMS_POCKET_CAPACITY - 3,
        itemsPocketUsed,
    };

    return { contents, warnings };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a specific item is in the bag
 *
 * @param itemName - The item name to search for (case-sensitive)
 * @returns The item with quantity if found, null otherwise
 */
export async function findItem(itemName: string): Promise<BagItem | null> {
    const contents = await getBagContents();

    // Search all pockets
    for (const pocket of Object.values(contents)) {
        const item = pocket.find((i: { name: string; }) => i.name === itemName);
        if (item) return item;
    }

    return null;
}

/**
 * Check if player has a specific item with at least a certain quantity
 *
 * @param itemName - The item name to search for
 * @param minQuantity - Minimum required quantity (default 1)
 * @returns True if item exists with at least minQuantity
 */
export async function hasItem(itemName: string, minQuantity = 1): Promise<boolean> {
    const item = await findItem(itemName);
    return item !== null && item.quantity >= minQuantity;
}

/**
 * Get count of Poke Balls by type
 *
 * @returns Map of ball name to quantity
 */
export async function getPokeBallCounts(): Promise<Map<string, number>> {
    const pokeBalls = await getPocket('PokeBalls');
    const counts = new Map<string, number>();

    for (const ball of pokeBalls) {
        counts.set(ball.name, ball.quantity);
    }

    return counts;
}

/**
 * Get total count of all Poke Balls
 *
 * @returns Total number of Poke Balls across all types
 */
export async function getTotalPokeBalls(): Promise<number> {
    const pokeBalls = await getPocket('PokeBalls');
    return pokeBalls.reduce((sum, ball) => sum + ball.quantity, 0);
}
