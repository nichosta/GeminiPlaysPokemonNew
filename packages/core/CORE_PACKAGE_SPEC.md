# @gempp/core Package Specification

Sub-specification for game state reading. Excludes overworld map reading (see `MAP_SPEC.md`).

---

## Overview

The `@gempp/core` package reads game state directly from mGBA-http memory endpoints. It provides:

1. **Pokemon Party** - Full party data with decryption
2. **Inventory** - All 5 bag pockets with quantity decryption
3. **Player State** - Badges, surfing/biking/diving status, controls locked
4. **Task System** - Active game tasks for menu/state detection
5. **Screenshot** - Simple upscaled capture (no grid processing)

---

## 1. Pokemon Party

### Data Structure

Each party Pokemon (max 6) has 100 bytes. The first 32 bytes are unencrypted, followed by 48 encrypted bytes containing the core data.

### Required Reads

| Field | Type | Notes |
|-------|------|-------|
| Species | u16 | From Growth substructure (encrypted) |
| Nickname | 10 bytes | Unencrypted, custom encoding |
| Level | u8 | Unencrypted |
| Current HP | u16 | Unencrypted |
| Max HP | u16 | Unencrypted |
| Stats (6) | u16 each | Atk, Def, Spd, SpA, SpD - Unencrypted |
| Status Condition | u32 | Bitmask (sleep, poison, burn, freeze, paralysis, toxic) |
| Moves (4) | u16 each | From Attacks substructure (encrypted) |
| Current PP (4) | u8 each | From Attacks substructure (encrypted) |
| Held Item | u16 | From Growth substructure (encrypted) |

> [!NOTE]
> **Max PP omitted**: Calculating max PP requires base move data lookup + PP Up bonus calculation. Current PP is sufficient for agent decision-making.

### Derived Data (from ROM lookups)

| Field | Source |
|-------|--------|
| Species Name | `species_map` lookup |
| Move Names | `moves_map` lookup |
| Item Name | `item_map` lookup |
| Types (2) | ROM `SpeciesInfo` struct |
| Ability | ROM `SpeciesInfo` + ability slot bit |

### Decryption

1. Read PID (u32) and OTID (u32) from unencrypted header
2. XOR key = PID ^ OTID
3. XOR each 32-bit word in 48-byte encrypted block
4. Unshuffle substructures by PID % 24 (GAEM order table)
5. Parse Growth (G), Attacks (A), EVs (E), Misc (M) substructures

### API

```typescript
interface PokemonData {
  species: string;
  speciesId: number;
  nickname: string;
  level: number;
  currentHP: number;
  maxHP: number;
  stats: { atk: number; def: number; spd: number; spa: number; spd: number };
  statusCondition: string | null; // "POISON", "SLEEP", etc. or null
  moves: Array<{ name: string; pp: number }>;
  types: [string, string?];
  ability: string;
  heldItem: string | null;
}

async function getPartyCount(): Promise<number>;
async function getPokemonData(slot: number): Promise<PokemonData | null>;
async function getFullParty(): Promise<PokemonData[]>;
async function isInBattle(): Promise<boolean>;
```

---

## 2. Inventory / Bag

### Structure

5 pockets, each with encrypted quantities. Items stored as (itemId: u16, encryptedQuantity: u16) pairs.

| Pocket | Contents |
|--------|----------|
| Items | Consumables (Potions, etc.) |
| Key Items | Story items, HM items |
| Poke Balls | All ball types |
| TMs/HMs | Technical/Hidden Machines |
| Berries | All berry types |

### Decryption

1. Read security key from save block (pointer + offset)
2. XOR lower 16 bits of key with each quantity

### API

```typescript
interface BagItem {
  id: number;
  name: string;
  quantity: number;
}

interface BagContents {
  items: BagItem[];
  keyItems: BagItem[];
  pokeBalls: BagItem[];
  tmsHms: BagItem[];
  berries: BagItem[];
}

async function getSecurityKey(): Promise<number>;
async function getPlayerMoney(): Promise<number>;
async function getBagContents(): Promise<BagContents>;
```

---

## 3. Player State

### Basic State

| Field | Address/Method | Notes |
|-------|----------------|-------|
| Map Bank | Direct | Current map group |
| Map Number | Direct | Current map within group |
| Facing Direction | Masked byte | down/up/left/right |
| Is Surfing | Avatar flags & mask | |
| Is Biking | Avatar flags & mask | Mach or Acro |
| Is Diving | Avatar flags & mask | |
| Controls Locked | Script lock byte | Dialogue/menu active |
| Badges | Flag reads (8) | Per-badge flags |

### API

```typescript
interface PlayerState {
  mapBank: number;
  mapNumber: number;
  mapName: string;
  position: { x: number; y: number };
  facing: "up" | "down" | "left" | "right";
  isSurfing: boolean;
  isBiking: boolean;
  isDiving: boolean;
  controlsLocked: boolean;
  badges: string[];
}

async function getPlayerState(): Promise<PlayerState>;
async function areFieldControlsLocked(): Promise<boolean>;
```

---

## 4. Task System

> [!IMPORTANT]
> **High Priority Research Item**: The task system is critical for reliable menu state detection, particularly for the party menu which was a major pain point in the previous project.

### Background

The game maintains an array of 16 tasks (`gTasks`). Each task has:

| Field | Offset | Size | Description |
|-------|--------|------|-------------|
| func | 0x00 | u32 | Pointer to task function |
| isActive | 0x04 | u8 | 1 = active, 0 = inactive |
| prev | 0x05 | u8 | Previous task ID (0xFE = HEAD_SENTINEL = highest priority) |
| next | 0x06 | u8 | Next task ID |
| priority | 0x07 | u8 | Lower = higher priority |
| data | 0x08 | s16[16] | Task-specific data |

**Total size**: 40 bytes (0x28) per task

### Research Findings

**Key party menu tasks identified from `party_menu.c`:**

| Task Function | Purpose |
|---------------|---------|
| `Task_HandleChooseMonInput` | Main input handler for party menu - handles A/B/DPad |
| `Task_HandleSelectionMenuInput` | Handles the action selection submenu (Summary, Switch, etc.) |
| `Task_ClosePartyMenu` | Fade out before closing |
| `Task_ClosePartyMenuAndSetCB2` | Final cleanup and callback |
| `Task_TryCreateSelectionWindow` | Creates action popup menu |
| `Task_CancelChooseMonYesNo` | Cancel confirmation dialog |

**Task function naming:** Not all task functions have the `Task_` prefix. The codebase has:
- ~535 `CreateTask()` calls
- ~811 `gTasks[...].func = FunctionName` assignments

### Proposed Approach: Two-Phase Lookup Table Generation

**Phase 1: Source Code Scraping (automated script)**

1. Parse all `.c` files in `pokeemerald/src/`
2. Extract function names from:
   - `CreateTask(FunctionName, ...)`
   - `gTasks[...].func = FunctionName`
   - `sPartyMenuInternal->task = FunctionName` (and similar patterns)
3. Deduplicate to get list of ~500-800 unique task function names
4. Output: `taskFunctionNames.txt` (list of names only)

**Phase 2: Address Extraction (one-time, manual or scripted)**

1. Access `pokeemerald.map` (linker map, 43K lines)
2. For each function name from Phase 1, grep for its address
3. Output: `taskFunctions.ts` with `Map<number, string>` of address → name

**Why two phases?**
- Phase 1 can run anytime on source files (no build artifacts needed)
- Phase 2 only needs to run once per ROM build
- Keeps the generated file small (only task-related functions, not entire symbol table)

### Alternative: Curated List

For faster initial implementation, manually curate the most important task functions:

```typescript
// packages/core/src/constants/taskFunctions.ts
// Addresses extracted from pokeemerald.map for Emerald (U) v1.0

export const KNOWN_TASKS: Map<number, string> = new Map([
  // Party Menu
  [0x081B1234, "Task_HandleChooseMonInput"],  // actual address TBD
  [0x081B1456, "Task_HandleSelectionMenuInput"],
  [0x081B1678, "Task_ClosePartyMenu"],
  
  // Start Menu
  [0x08XXXXXX, "Task_ShowStartMenu"],
  [0x08XXXXXX, "Task_StartMenuHandleInput"],
  
  // Battle
  [0x08XXXXXX, "Task_HandleActionSelection"],
  [0x08XXXXXX, "Task_HandleMoveSelection"],
  
  // Weather (known to "steal" top priority)
  [0x08XXXXXX, "Task_WeatherMain"],
  
  // Overworld
  [0x08XXXXXX, "Task_RunOverworldMain"],
]);
```

### API

```typescript
interface ActiveTask {
  id: number;           // Task slot (0-15)
  funcAddress: number;  // Raw function pointer
  funcName: string | null; // null if address not in lookup table
  priority: number;     // Lower = higher priority
  isHead: boolean;      // prev == 0xFE (highest priority in chain)
}

async function getActiveTasks(): Promise<ActiveTask[]>;
async function isTaskActive(funcName: string): Promise<boolean>;

// Higher-level state detection
async function isPartyMenuOpen(): Promise<boolean>;  // checks for party menu tasks
async function isInStartMenu(): Promise<boolean>;
async function isInBattleMenu(): Promise<boolean>;
```

### Party Menu Detection

The party menu issue from the old project:

| Problem | Why It Happened |
|---------|-----------------|
| `isPartyMenuOpen()` unreliable | Internal pointer not cleared when menu closes |
| Slot ID 7 ambiguous | Same value for "closed" and "Exit selected" |
| Vision struggles | Thin selection outline hard to see |

**Solution via task detection:**

```typescript
async function isPartyMenuOpen(): Promise<boolean> {
  const tasks = await getActiveTasks();
  const partyMenuTasks = [
    "Task_HandleChooseMonInput",
    "Task_HandleSelectionMenuInput",
    "Task_TryCreateSelectionWindow",
    // ... other party menu tasks
  ];
  return tasks.some(t => partyMenuTasks.includes(t.funcName ?? ""));
}
```

**Extracting cursor position:** When party menu is open, `gPartyMenu.slotId` (at `PARTY_MENU_ADDR + 0x09`) gives the currently highlighted slot (0-5 for Pokemon, 6 for Confirm, 7 for Cancel). This is more reliable than the old `getPartyMenuSlotId()` which had the "7 = closed OR Exit" ambiguity - we can now disambiguate because we know the menu is definitely open via task detection.

---

## 5. Screenshot

### Requirements

- Capture game screen via mGBA-http screenshot endpoint
- Apply 4x nearest-neighbor upscale (GBA native 240x160 → 960x640)
- Return as base64 data URI
- **No grid overlay** (removed - caused more harm than good)

### API

```typescript
interface Screenshot {
  dataUri: string; // data:image/png;base64,...
  width: number;   // 960 after upscale
  height: number;  // 640 after upscale
}

async function captureScreenshot(): Promise<Screenshot>;
```

---

## 6. Constants & Lookup Tables

Port from old project with TypeScript types:

| Table | Purpose |
|-------|---------|
| `SPECIES` | ID → Name (includes forms) |
| `MOVES` | ID → Name |
| `ITEMS` | ID → Name |
| `ABILITIES` | ID → Name |
| `MAPS` | (bank, number) → Name |
| `TEXT_ENCODING` | Game bytes → UTF-8 |
| `TASK_FUNCTIONS` | Address → Name (generated from linker map) |

### Memory Addresses

Separate files for game-specific addresses:

- `addresses/emerald.ts` - Emerald-specific addresses
- `addresses/index.ts` - Re-exports based on config

---

## 7. Memory Reading Layer

### HTTP Client

Wrapper around mGBA-http endpoints:

```typescript
async function readUint8(address: number): Promise<number>;
async function readUint16(address: number): Promise<number>;
async function readUint32(address: number): Promise<number>;
async function readRange(address: number, length: number): Promise<ArrayBuffer>;
```

### Configuration

```typescript
const MGBA_HTTP_BASE = process.env.MGBA_HTTP_URL ?? "http://localhost:5000";
```

---

## File Structure

```
packages/core/
├── src/
│   ├── index.ts              # Public API exports
│   ├── pokemon/
│   │   ├── party.ts          # Party reading + decryption
│   │   ├── decrypt.ts        # PID/OTID decryption logic
│   │   └── types.ts          # Pokemon type lookups
│   ├── inventory/
│   │   ├── bag.ts            # Bag reading + decryption
│   │   └── money.ts          # Player money
│   ├── player/
│   │   ├── state.ts          # Position, facing, surf/bike/dive
│   │   ├── badges.ts         # Badge flag reading
│   │   └── controls.ts       # Field controls locked
│   ├── tasks/
│   │   ├── reader.ts         # Task array reading
│   │   └── lookup.ts         # Function pointer → name mapping
│   ├── screenshot/
│   │   └── capture.ts        # Screenshot + upscale
│   ├── memory/
│   │   └── client.ts         # mGBA-http wrapper
│   ├── constants/
│   │   ├── species.ts
│   │   ├── moves.ts
│   │   ├── items.ts
│   │   ├── abilities.ts
│   │   ├── maps.ts
│   │   ├── textEncoding.ts
│   │   └── taskFunctions.ts  # Generated from linker map
│   └── addresses/
│       ├── emerald.ts
│       └── index.ts
├── tests/
│   ├── pokemon.test.ts
│   ├── inventory.test.ts
│   ├── player.test.ts
│   └── tasks.test.ts
├── scripts/
│   └── generateTaskLookup.ts # Parses linker map → taskFunctions.ts
├── package.json
└── tsconfig.json
```

---

## Testing Strategy

### Unit Tests (Bun test)

- **Decryption logic**: Test with known PID/OTID/encrypted data samples
- **Text encoding**: Test nickname decoding
- **Lookup tables**: Verify key entries exist

### Integration Tests (with mGBA-http mock)

- Mock HTTP responses with save state data
- Verify full read paths (party, bag, tasks)

### Manual Verification

1. Start mGBA with Emerald ROM
2. Run test script against live emulator
3. Compare output to known game state

### Save State Fixtures

Collect save states at key moments:
- Party menu open (various selections)
- In battle
- Overworld exploration
- Start menu open

---

## Decisions

1. **Task Lookup Approach**: Two-phase automated generation
   - Phase 1: Scrape source for function names used with `CreateTask()` and `gTasks[].func =`
   - Phase 2: Extract addresses from `pokeemerald.map` for those function names
   - Generated file committed to repo like other constants

2. **Linker Map**: Access via pokeemerald checkout, commit generated `taskFunctions.ts` directly

---

## Verification Plan

### Automated Tests

```bash
# Run all core package tests
cd packages/core
bun test
```

### Manual Test: Party Data

1. Start mGBA with Emerald, load save with known party
2. Run: `bun run packages/core/src/pokemon/party.ts` (add CLI test)
3. Verify species, levels, moves match in-game

### Manual Test: Task System

1. Open party menu in game
2. Run task dump
3. Verify party-related task appears in output
4. Close menu, run again, verify task is gone
