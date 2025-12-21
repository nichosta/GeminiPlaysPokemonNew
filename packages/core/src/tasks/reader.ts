/**
 * Task System Reader
 * 
 * Reads the gTasks array from Pokemon Emerald memory and provides
 * high-level functions for detecting game state (menus, battle, etc.)
 */

import { readUint8, readUint32 } from '../memory/client';
import {
    GTASKS_ADDR,
    TASK_SIZE,
    TASK_COUNT,
    TASK_OFFSETS,
    HEAD_SENTINEL,
} from '../addresses';
import { getTaskFunctionName } from '../constants/taskFunctions';

// ============================================================================
// Types
// ============================================================================

/**
 * Represents an active task in the game's task system
 */
export interface ActiveTask {
    /** Task slot ID (0-15) */
    id: number;
    /** Raw function pointer address from memory */
    funcAddress: number;
    /** Human-readable function name, or null if not in lookup table */
    funcName: string | null;
    /** Task priority (lower = higher priority) */
    priority: number;
    /** True if this is the head of the priority chain (prev == HEAD_SENTINEL) */
    isHead: boolean;
}

// ============================================================================
// Core Task Reading
// ============================================================================

/**
 * Read all active tasks from gTasks array
 * 
 * @returns Array of active tasks with their function names resolved
 */
export async function getActiveTasks(): Promise<ActiveTask[]> {
    const tasks: ActiveTask[] = [];

    for (let i = 0; i < TASK_COUNT; i++) {
        const taskAddr = GTASKS_ADDR + (i * TASK_SIZE);

        // Read isActive flag
        const isActive = await readUint8(taskAddr + TASK_OFFSETS.IS_ACTIVE);
        if (!isActive) continue;

        // Read task fields
        const funcAddress = await readUint32(taskAddr + TASK_OFFSETS.FUNC);
        const prev = await readUint8(taskAddr + TASK_OFFSETS.PREV);
        const priority = await readUint8(taskAddr + TASK_OFFSETS.PRIORITY);

        // Resolve function name (handles Thumb bit internally)
        const funcName = getTaskFunctionName(funcAddress);

        tasks.push({
            id: i,
            funcAddress,
            funcName,
            priority,
            isHead: prev === HEAD_SENTINEL,
        });
    }

    return tasks;
}

/**
 * Check if a specific task function is currently active
 * 
 * @param funcName - The function name to check for
 * @returns True if a task with this function is active
 */
export async function isTaskActive(funcName: string): Promise<boolean> {
    const tasks = await getActiveTasks();
    return tasks.some(t => t.funcName === funcName);
}

/**
 * Get the highest-priority (head) task
 * 
 * @returns The head task, or null if no tasks are active
 */
export async function getHeadTask(): Promise<ActiveTask | null> {
    const tasks = await getActiveTasks();
    return tasks.find(t => t.isHead) ?? null;
}

// ============================================================================
// High-Level State Detection
// ============================================================================

/** Known party menu task functions (exported) */
const PARTY_MENU_TASKS = [
    "Task_HandleChooseMonInput",
    "Task_HandleSelectionMenuInput", // May not be exported
    "Task_TryCreateSelectionWindow", // May not be exported
] as const;

/**
 * Address ranges for static functions in source files (from linker map)
 * Format: [start, end] (after masking Thumb bit)
 */
const PARTY_MENU_RANGE: [number, number] = [0x081b0038, 0x081b99b4]; // party_menu.o
const ITEM_MENU_RANGE: [number, number] = [0x081a94e4, 0x081ae238]; // item_menu.o (bag)
const LIST_MENU_RANGE: [number, number] = [0x081ae458, 0x081afbf0]; // list_menu.o

/** Check if an address falls within a range */
function isAddressInRange(address: number, range: [number, number]): boolean {
    const masked = address & ~1; // Mask Thumb bit
    return masked >= range[0] && masked < range[1];
}

/** Known start menu task functions */
const START_MENU_TASKS = [
    "Task_ShowStartMenu",
] as const;

/** Known bag menu task functions */
const BAG_MENU_TASKS = [
    "Task_FadeAndCloseBagMenu",
    "Task_ScrollIndicatorArrowPairOnMainMenu",
] as const;

/**
 * Check if the party menu is currently open
 * 
 * This is the critical function for reliable party menu detection,
 * fixing the bug from the old project where the pointer wasn't cleared.
 * 
 * Detection strategy:
 * 1. Check for known exported task functions
 * 2. Check if any task's address falls within party_menu.o range
 */
export async function isPartyMenuOpen(): Promise<boolean> {
    const tasks = await getActiveTasks();
    return tasks.some(t =>
        // Check exported function names
        (t.funcName !== null &&
            PARTY_MENU_TASKS.includes(t.funcName as typeof PARTY_MENU_TASKS[number])) ||
        // Check address range for static functions
        isAddressInRange(t.funcAddress, PARTY_MENU_RANGE)
    );
}

/**
 * Check if the start menu is currently open
 */
export async function isStartMenuOpen(): Promise<boolean> {
    const tasks = await getActiveTasks();
    return tasks.some(t =>
        t.funcName !== null &&
        START_MENU_TASKS.includes(t.funcName as typeof START_MENU_TASKS[number])
    );
}

/**
 * Check if the bag menu is currently open
 * 
 * Detection strategy:
 * 1. Check for known exported task functions
 * 2. Check if any task's address falls within item_menu.o or list_menu.o range
 */
export async function isBagMenuOpen(): Promise<boolean> {
    const tasks = await getActiveTasks();
    return tasks.some(t =>
        // Check exported function names
        (t.funcName !== null &&
            BAG_MENU_TASKS.includes(t.funcName as typeof BAG_MENU_TASKS[number])) ||
        // Check address ranges for static functions
        isAddressInRange(t.funcAddress, ITEM_MENU_RANGE) ||
        isAddressInRange(t.funcAddress, LIST_MENU_RANGE)
    );
}

/**
 * Check if any menu is currently open
 */
export async function isAnyMenuOpen(): Promise<boolean> {
    return await isPartyMenuOpen() ||
        await isStartMenuOpen() ||
        await isBagMenuOpen();
}

// ============================================================================
// Debug / Introspection
// ============================================================================

/**
 * Dump all active tasks for debugging
 * 
 * @returns Formatted string showing all active tasks
 */
export async function dumpActiveTasks(): Promise<string> {
    const tasks = await getActiveTasks();

    if (tasks.length === 0) {
        return "No active tasks";
    }

    const lines = tasks.map(t => {
        const nameStr = t.funcName ?? `unknown (0x${t.funcAddress.toString(16)})`;
        const headStr = t.isHead ? " [HEAD]" : "";
        return `[${t.id}] ${nameStr} (pri=${t.priority})${headStr}`;
    });

    return lines.join("\n");
}
