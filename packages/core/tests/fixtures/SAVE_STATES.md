# Test Save States Catalog

This document catalogs all save states needed for testing the `@gempp/core` package. Save states are stored in mGBA's native `.ss1` format.

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

| ID | Filename | Description | Requirements |
|----|----------|-------------|--------------|
| OW-01 | `overworld_idle.ss1` | Standing still, no menu, no dialogue | Player not moving, no NPCs talking, no weather animation stealing priority |
| OW-02 | `overworld_walking.ss1` | Mid-step movement | Player between tiles (if capturable) |
| OW-03 | `overworld_surfing.ss1` | Surfing on water | Player on water tile, Surfing flag set |
| OW-04 | `overworld_biking.ss1` | Riding bicycle | Player on bike (Mach or Acro) |

**Used for:**
- Verifying no menu tasks are active
- Baseline for `areFieldControlsLocked() === false`
- Testing player state flags

---

### Menu States

#### Start Menu

| ID | Filename | Description | Requirements |
|----|----------|-------------|--------------|
| MN-01 | `menu_start_open.ss1` | Start menu visible | Start menu just opened, cursor on first option |
| MN-02 | `menu_start_pokemon.ss1` | Start menu, POKEMON highlighted | Cursor on POKEMON option |
| MN-03 | `menu_start_bag.ss1` | Start menu, BAG highlighted | Cursor on BAG option |

**Expected task:** `Task_ShowStartMenu` (0x0809fa34)

---

#### Party Menu

| ID | Filename | Description | Requirements |
|----|----------|-------------|--------------|
| PM-01 | `menu_party_slot0.ss1` | Party menu, 1st Pokemon selected | Cursor on slot 0 (first Pokemon) |
| PM-02 | `menu_party_slot1.ss1` | Party menu, 2nd Pokemon selected | Cursor on slot 1 |
| PM-03 | `menu_party_slot5.ss1` | Party menu, 6th Pokemon selected | Cursor on slot 5 (last slot, needs 6 Pokemon) |
| PM-04 | `menu_party_cancel.ss1` | Party menu, Cancel selected | Cursor on Cancel button (slot 7) |
| PM-05 | `menu_party_action_summary.ss1` | Action submenu, Summary highlighted | After pressing A on a Pokemon |
| PM-06 | `menu_party_action_switch.ss1` | Action submenu, Switch highlighted | Cursor on Switch option |
| PM-07 | `menu_party_switching.ss1` | Mid-switch, selecting second Pokemon | After selecting Switch, choosing target |

**Expected task:** `Task_HandleChooseMonInput` (0x081b1370)

**Critical test cases:**
- PM-01 vs PM-04: Verify we can distinguish slot 0 from Cancel (old bug)
- PM-05/06: May show different task if action menu uses separate handler

---

#### Bag Menu

| ID | Filename | Description | Requirements |
|----|----------|-------------|--------------|
| BG-01 | `menu_bag_items.ss1` | Bag open, Items pocket | First pocket selected |
| BG-02 | `menu_bag_pokeballs.ss1` | Bag open, Poke Balls pocket | Poke Balls pocket selected |
| BG-03 | `menu_bag_tms.ss1` | Bag open, TMs/HMs pocket | TMs pocket selected |
| BG-04 | `menu_bag_item_selected.ss1` | Item action menu open | After pressing A on an item |

**Expected task:** `Task_FadeAndCloseBagMenu` (or similar bag handler)

---

### Battle States

#### Wild Battle

| ID | Filename | Description | Requirements |
|----|----------|-------------|--------------|
| BT-01 | `battle_wild_action_select.ss1` | Wild battle, action menu | Fight/Bag/Pokemon/Run visible |
| BT-02 | `battle_wild_move_select.ss1` | Wild battle, move selection | After selecting Fight, 4 moves shown |
| BT-03 | `battle_wild_party_menu.ss1` | Wild battle, party menu open | After selecting Pokemon from action menu |
| BT-04 | `battle_wild_bag.ss1` | Wild battle, bag open | After selecting Bag |

**Verification:**
- `isInBattle()` returns `true`
- Battle-specific tasks active

---

#### Trainer Battle

| ID | Filename | Description | Requirements |
|----|----------|-------------|--------------|
| BT-10 | `battle_trainer_action.ss1` | Trainer battle, action menu | Cannot run |
| BT-11 | `battle_trainer_forced_switch.ss1` | Trainer battle, forced switch | After Pokemon faints, must switch |

---

### Special States

| ID | Filename | Description | Requirements |
|----|----------|-------------|--------------|
| SP-01 | `dialogue_npc_talking.ss1` | NPC dialogue box visible | Text box on screen, controls locked |
| SP-02 | `cutscene_active.ss1` | Mid-cutscene | Script running, player cannot move |
| SP-03 | `weather_rain.ss1` | Overworld with rain | Weather task active (priority test) |
| SP-04 | `weather_sandstorm.ss1` | Overworld with sandstorm | Weather task active |
| SP-05 | `transition_fadeout.ss1` | Screen transitioning | If capturable, test mid-transition |

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
6. Commit with descriptive message

---

## Cross-Reference

| Test File | Required Save States |
|-----------|---------------------|
| `tasks.test.ts` | OW-01, MN-01, PM-01, PM-04, BT-01 |
| `party.test.ts` | PM-01, PM-03, PM-05, BT-03 |
| `inventory.test.ts` | BG-01, BG-02, BG-04 |
| `player.test.ts` | OW-01, OW-03, OW-04, SP-03 |
| `integration/` | All states |
