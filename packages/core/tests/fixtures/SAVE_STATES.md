# Test Save States Catalog

This document catalogs all save states needed for testing the `@gempp/core` package. Save states are stored in mGBA's native `.ss1` format.

**Status:** ✅ = Available | ⏳ = Pending | ❌ = Not needed for initial testing

---

## Directory Structure

```
packages/core/tests/fixtures/savestates/
├── README.md           # This file (copy for reference)
├── overworld/          # Overworld/exploration states
├── menus/              # Menu navigation states
├── battle/             # Battle states
└── special/            # Edge cases and special scenarios
```

---

## Naming Convention

```
{category}_{subcategory}_{details}.ss1
```

Examples:
- `menu_party_slot0.ss1`
- `battle_wild_action_select.ss1`
- `overworld_route101_idle.ss1`

---

## Save State Requirements

### Overworld States

| ID | Status | Filename | Description |
|----|--------|----------|-------------|
| OW-01 | ✅ | `overworld_idle.ss1` | Standing still, no menu, no dialogue |
| OW-02 | ✅ | `overworld_walking.ss1` | Mid-step movement |
| OW-03 | ⏳ | `overworld_surfing.ss1` | Surfing on water (requires game progress) |
| OW-04 | ⏳ | `overworld_biking.ss1` | Riding bicycle (requires game progress) |
| OW-05 | ✅ | `overworld_mach_bike.ss1` | Riding Mach Bike (for hold_buttons) |
| OW-06 | ✅ | `overworld_active_npc.ss1` | NPC mid-movement (for stun_npc safety) |
| OW-07 | ✅ | `overworld_ledges.ss1` | Near one-way ledges (for navigate) |

**Used for:**
- Verifying no menu tasks are active
- Baseline for `areFieldControlsLocked() === false`
- Testing player state flags

---

### Menu States

#### Start Menu

| ID | Status | Filename | Description |
|----|--------|----------|-------------|
| MN-01 | ✅ | `menu_start_open.ss1` | Start menu visible, cursor on first option |
| MN-02 | ✅ | `menu_start_pokemon.ss1` | Start menu, POKEMON highlighted |
| MN-03 | ✅ | `menu_start_bag.ss1` | Start menu, BAG highlighted |

**Expected task:** `Task_ShowStartMenu` (0x0809fa34)

---

#### Party Menu

| ID | Status | Filename | Description |
|----|--------|----------|-------------|
| PM-01 | ✅ | `menu_party_slot0.ss1` | Party menu, 1st Pokemon selected |
| PM-02 | ✅ | `menu_party_slot1.ss1` | Party menu, 2nd Pokemon selected |
| PM-03 | ✅ | `menu_party_slot5.ss1` | Party menu, 6th Pokemon selected |
| PM-04 | ✅ | `menu_party_cancel.ss1` | Party menu, Cancel selected |
| PM-05 | ✅ | `menu_party_action_summary.ss1` | Action submenu, Summary highlighted |
| PM-06 | ✅ | `menu_party_action_switch.ss1` | Action submenu, Switch highlighted |
| PM-07 | ✅ | `menu_party_switching.ss1` | Mid-switch, selecting second Pokemon |

**Expected task:** `Task_HandleChooseMonInput` (0x081b1370)

**Critical test cases:**
- PM-01 vs PM-04: Verify we can distinguish slot 0 from Cancel (old bug)
- PM-05/06: May show different task if action menu uses separate handler

---

#### Bag Menu

| ID | Status | Filename | Description |
|----|--------|----------|-------------|
| BG-01 | ✅ | `menu_bag_items.ss1` | Bag open, Items pocket |
| BG-02 | ✅ | `menu_bag_pokeballs.ss1` | Bag open, Poke Balls pocket |
| BG-03 | ✅ | `menu_bag_tms.ss1` | Bag open, TMs/HMs pocket |
| BG-04 | ✅ | `menu_bag_item_selected.ss1` | Item action menu open |

**Expected task:** `Task_FadeAndCloseBagMenu` (or similar bag handler)

---

### Battle States

#### Wild Battle

| ID | Status | Filename | Description |
|----|--------|----------|-------------|
| BT-01 | ✅ | `battle_wild_action_select.ss1` | Wild battle, action menu |
| BT-02 | ✅ | `battle_wild_move_select.ss1` | Wild battle, move selection |
| BT-03 | ✅ | `battle_wild_party_menu.ss1` | Wild battle, party menu open |
| BT-04 | ✅ | `battle_wild_bag.ss1` | Wild battle, bag open |

---

#### Trainer Battle

| ID | Status | Filename | Description |
|----|--------|----------|-------------|
| BT-10 | ✅ | `battle_trainer_action.ss1` | Trainer battle, action menu |
| BT-11 | ✅ | `battle_trainer_forced_switch.ss1` | Trainer battle, forced switch |

---

#### Double Battle

| ID | Status | Filename | Description |
|----|--------|----------|-------------|
| BT-20 | ⏳ | `battle_double_action_select.ss1` | Double battle, action menu |
| BT-21 | ⏳ | `battle_double_move_select.ss1` | Double battle, move selection |
| BT-22 | ⏳ | `battle_double_target_select.ss1` | Double battle, target selection (for menu type detection) |

**Purpose:** Double battle save states are needed to:
- Verify `HandleInputChooseTarget` controller function address
- Test multi-target move selection
- Validate battle menu cursor reading with multiple active battlers

---

### Special States

| ID | Status | Filename | Description |
|----|--------|----------|-------------|
| SP-01 | ✅ | `dialogue_npc_talking.ss1` | NPC dialogue box visible |
| SP-02 | ⏳ | `cutscene_active.ss1` | Mid-cutscene (requires game progress) |
| SP-03 | ⏳ | `weather_rain.ss1` | Overworld with rain (requires game progress) |
| SP-04 | ⏳ | `weather_sandstorm.ss1` | Overworld with sandstorm (requires game progress) |
| SP-05 | ✅ | `transition_fadeout.ss1` | Screen transitioning |

---

## Party Requirements

For party-related tests, the save should have:

| Requirement | Details |
|-------------|---------|
| Full party | 6 Pokemon for testing all slots |
| Varied HP | At least one Pokemon not at full HP (for HP bar testing) |
| Status condition | At least one Pokemon with a status (for status icon testing) |
| Held items | At least one Pokemon holding an item |
| Varied moves | Pokemon with 1, 2, 3, and 4 moves (for move display testing) |
| Egg | Optional: one egg in party (for egg handling) |

---

## Creating Save States

### In mGBA:

1. **Load ROM:** Pokemon Emerald (U) v1.0
2. **Navigate to state:** Get the game into the exact state needed
3. **Create save state:** `Shift+F1` through `Shift+F9` (slots 1-9)
4. **Export:** File → Export Save State → Choose `.ss1` extension
5. **Rename:** Use the naming convention above

### Verification:

After creating each save state:
1. Load it fresh
2. Confirm the exact state matches the description
3. Take a screenshot for reference (optional but helpful)

---

## State Verification Checklist

When creating a save state, verify:

- [ ] Correct menu/screen is visible
- [ ] Cursor is in the expected position
- [ ] No animations are mid-frame (may cause inconsistency)
- [ ] Weather/time of day is appropriate
- [ ] Party composition matches requirements
- [ ] No unexpected dialogue or overlays

---

## Adding New Save States

When adding a new save state:

1. Add entry to this document in the appropriate section
2. Assign unique ID following the pattern
3. Document exact requirements
4. Create the save state
5. Verify with a test load
6. **Update `src/testing/fixtures.ts`** to include the new fixture path
7. Commit with descriptive message

---

## Programmatic Access

Save states can be accessed programmatically via the `@gempp/core/testing` module:

```typescript
import { withSaveState, fixtures, SaveStateManager } from "@gempp/core/testing";

// All fixtures are typed and organized by category
fixtures.overworld.idle          // Standing still, no menu
fixtures.menus.party.slot0       // Party menu, 1st Pokemon
fixtures.battle.wild.actionSelect // Wild battle action menu

// Use withSaveState for automatic backup/restore
test("party menu detection", async () => {
    await withSaveState(fixtures.menus.party.slot0, async () => {
        const isOpen = await isPartyMenuOpen();
        expect(isOpen).toBe(true);
    });
});

// Or use SaveStateManager for manual control
const manager = new SaveStateManager();
await manager.backup();          // Backup current state to temp file
await manager.load(fixtures.battle.wild.actionSelect);
// ... run tests ...
await manager.restore();         // Restore original state, clean up temp
```

**mGBA-http Endpoints Used:**
- `POST /core/savestatefile?path=...` - Save state to file
- `POST /core/loadstatefile?path=...` - Load state from file

---

## Cross-Reference

| Test File | Required Save States |
|-----------|---------------------|
| `tasks.test.ts` | OW-01, MN-01, PM-01, PM-04, BT-01 |
| `party.test.ts` | PM-01, PM-03, PM-05, BT-03 |
| `inventory.test.ts` | BG-01, BG-02, BG-04 |
| `player.test.ts` | OW-01, OW-03, OW-04, SP-03 |
| `integration/` | All states |

