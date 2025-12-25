/**
 * Typed fixture registry for test save states
 * 
 * Provides strongly-typed paths to all available save state fixtures.
 * See tests/fixtures/SAVE_STATES.md for detailed documentation.
 */

import * as path from "node:path";
import { fileURLToPath } from "node:url";

// Get the fixtures directory path relative to this file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_BASE = path.resolve(__dirname, "../../tests/fixtures/savestates");

/**
 * Helper to build absolute paths for fixtures
 */
function fixture(...parts: string[]): string {
    return path.join(FIXTURES_BASE, ...parts);
}

/**
 * All available test save state fixtures.
 * 
 * Organized by category matching the directory structure.
 * Each property returns the absolute path to the .ss1 file.
 */
export const fixtures = {
    /**
     * Overworld/exploration states
     */
    overworld: {
        /** OW-01: Standing still, no menu, no dialogue */
        idle: fixture("overworld", "overworld_idle.ss1"),
        /** OW-02: Mid-step movement */
        walking: fixture("overworld", "overworld_walking.ss1"),
        /** OW-05: Riding Mach Bike */
        machBike: fixture("overworld", "overworld_mach_bike.ss1"),
        /** OW-06: NPC mid-movement */
        activeNpc: fixture("overworld", "overworld_active_npc.ss1"),
        /** OW-07: Near one-way ledges */
        ledges: fixture("overworld", "overworld_ledges.ss1"),
    },

    /**
     * Menu navigation states
     */
    menus: {
        /**
         * Start menu states
         */
        start: {
            /** MN-01: Start menu visible, cursor on first option */
            open: fixture("menus", "menu_start_open.ss1"),
            /** MN-02: Start menu, POKEMON highlighted */
            pokemon: fixture("menus", "menu_start_pokemon.ss1"),
            /** MN-03: Start menu, BAG highlighted */
            bag: fixture("menus", "menu_start_bag.ss1"),
        },

        /**
         * Party menu states
         */
        party: {
            /** PM-01: Party menu, 1st Pokemon selected */
            slot0: fixture("menus", "menu_party_slot0.ss1"),
            /** PM-02: Party menu, 2nd Pokemon selected */
            slot1: fixture("menus", "menu_party_slot1.ss1"),
            /** PM-03: Party menu, 6th Pokemon selected */
            slot5: fixture("menus", "menu_party_slot5.ss1"),
            /** PM-04: Party menu, Cancel selected */
            cancel: fixture("menus", "menu_party_cancel.ss1"),
            /** PM-05: Action submenu, Summary highlighted */
            actionSummary: fixture("menus", "menu_party_action_summary.ss1"),
            /** PM-06: Action submenu, Switch highlighted */
            actionSwitch: fixture("menus", "menu_party_action_switch.ss1"),
            /** PM-07: Mid-switch, selecting second Pokemon */
            switching: fixture("menus", "menu_party_switching.ss1"),
        },

        /**
         * Bag menu states
         */
        bag: {
            /** BG-01: Bag open, Items pocket */
            items: fixture("menus", "menu_bag_items.ss1"),
            /** BG-02: Bag open, Poke Balls pocket */
            pokeballs: fixture("menus", "menu_bag_pokeballs.ss1"),
            /** BG-03: Bag open, TMs/HMs pocket */
            tms: fixture("menus", "menu_bag_tms.ss1"),
            /** BG-04: Item action menu open */
            itemSelected: fixture("menus", "menu_bag_item_selected.ss1"),
        },
    },

    /**
     * Battle states
     */
    battle: {
        /**
         * Wild battle states
         */
        wild: {
            /** BT-01: Wild battle, action menu */
            actionSelect: fixture("battle", "battle_wild_action_select.ss1"),
            /** BT-02: Wild battle, move selection */
            moveSelect: fixture("battle", "battle_wild_move_select.ss1"),
            /** BT-03: Wild battle, party menu open */
            partyMenu: fixture("battle", "battle_wild_party_menu.ss1"),
            /** BT-04: Wild battle, bag open */
            bag: fixture("battle", "battle_wild_bag.ss1"),
        },

        /**
         * Trainer battle states
         */
        trainer: {
            /** BT-10: Trainer battle, action menu */
            action: fixture("battle", "battle_trainer_action.ss1"),
            /** BT-11: Trainer battle, forced switch */
            forcedSwitch: fixture("battle", "battle_trainer_forced_switch.ss1"),
        },
    },

    /**
     * Special states (edge cases)
     */
    special: {
        /** SP-01: NPC dialogue box visible */
        dialogueNpcTalking: fixture("special", "dialogue_npc_talking.ss1"),
        /** SP-05: Screen transitioning */
        transitionFadeout: fixture("special", "transition_fadeout.ss1"),
    },
} as const;

/**
 * Type representing all fixture paths
 */
export type FixturePath = string;

/**
 * Get the base directory for all fixtures
 */
export function getFixturesBase(): string {
    return FIXTURES_BASE;
}
