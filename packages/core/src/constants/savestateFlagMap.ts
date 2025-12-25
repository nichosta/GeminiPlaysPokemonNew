// packages/core/src/constants/savestate_flag_map_emerald.ts

export const flagMap = new Map<string, number>([
    ["FLAG_BADGE01_GET", 0x867],
    ["FLAG_BADGE02_GET", 0x868],
    ["FLAG_BADGE03_GET", 0x869],
    ["FLAG_BADGE04_GET", 0x86A],
    ["FLAG_BADGE05_GET", 0x86B],
    ["FLAG_BADGE06_GET", 0x86C],
    ["FLAG_BADGE07_GET", 0x86D],
    ["FLAG_BADGE08_GET", 0x86E],
]);

/**
 * Definitions for Emerald badges, mapping display names to flag constants.
 */
export const BADGE_DEFINITIONS: { name: string; flagConstant: string }[] = [
    { name: "Stone Badge", flagConstant: "FLAG_BADGE01_GET" },
    { name: "Knuckle Badge", flagConstant: "FLAG_BADGE02_GET" },
    { name: "Dynamo Badge", flagConstant: "FLAG_BADGE03_GET" },
    { name: "Heat Badge", flagConstant: "FLAG_BADGE04_GET" },
    { name: "Balance Badge", flagConstant: "FLAG_BADGE05_GET" },
    { name: "Feather Badge", flagConstant: "FLAG_BADGE06_GET" },
    { name: "Mind Badge", flagConstant: "FLAG_BADGE07_GET" },
    { name: "Rain Badge", flagConstant: "FLAG_BADGE08_GET" },
];

/**
 * Gets the flag address from the flag name.
 * @param flagName - The flag name.
 * @returns The flag address or undefined if not found.
 */
export function getFlagAddress(flagName: string): number | undefined {
    return flagMap.get(flagName);
}
