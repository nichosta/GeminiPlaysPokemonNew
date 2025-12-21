# Task System Testing Plan

## Overview

This document outlines the testing strategy for the task system reader in `@gempp/core`. The task system is critical for reliable menu state detection, particularly for the party menu.

---

## Important Notes

> [!WARNING]
> **ARM Thumb Instruction Offset (Unconfirmed)**
> 
> Function pointers read from `gTasks[].func` may be offset by +1 from the linker map addresses.
> This is due to ARM Thumb mode: the LSB (bit 0) is set to 1 to indicate Thumb instructions.
> 
> **Example:**
> - Linker map address: `0x081b1370`
> - Memory value: `0x081b1371` (with Thumb bit set)
> 
> **Resolution:** When looking up function names, mask off the LSB:
> ```typescript
> const lookupAddress = funcPointer & ~1;  // Clear bit 0
> ```
> 
> **Status:** Needs verification during integration testing.

---

## Test Phases

### Phase 1: Memory Reading (Unit Tests)

**File:** `packages/core/tests/tasks.test.ts`

| Test | Description | Expected |
|------|-------------|----------|
| Read gTasks array address | Verify constant `GTASKS_ADDR` is correct | Address matches pokeemerald symbols |
| Read task struct size | Verify `TASK_SIZE = 0x28` (40 bytes) | Correct struct layout |
| Parse task struct fields | Read func, isActive, prev, next, priority | Correct field offsets |
| Read 16 task slots | Iterate through all slots | No memory read errors |

**Mock Data:** Create a mock save state with known task configuration.

---

### Phase 2: Lookup Table (Unit Tests)

**File:** `packages/core/tests/taskLookup.test.ts`

| Test | Description | Expected |
|------|-------------|----------|
| Known address lookup | `getTaskFunctionName(0x081b1370)` | `"Task_HandleChooseMonInput"` |
| Unknown address | `getTaskFunctionName(0x12345678)` | `null` |
| Reverse lookup | `getTaskFunctionAddress("Task_ShowStartMenu")` | `0x0809fa34` |
| Thumb bit handling | `getTaskFunctionName(0x081b1371)` | `"Task_HandleChooseMonInput"` (after masking) |

---

### Phase 3: Integration Tests (with mGBA-http)

**Prerequisites:**
- mGBA running with Pokemon Emerald
- mGBA-http enabled on port 5000

#### Test 3.1: Overworld State (No Menu)

1. Load save state in overworld, not in any menu
2. Call `getActiveTasks()`
3. **Expected:** 
   - Should find weather/overworld tasks
   - `Task_HandleChooseMonInput` should NOT be present
   - `Task_ShowStartMenu` should NOT be present

#### Test 3.2: Start Menu Open

1. Load save state with Start menu open
2. Call `getActiveTasks()`
3. **Expected:**
   - `Task_ShowStartMenu` (or similar) should be present
   - `isInStartMenu()` returns `true`

#### Test 3.3: Party Menu Open

1. Load save state with Party menu open (from Start menu)
2. Call `getActiveTasks()`
3. **Expected:**
   - `Task_HandleChooseMonInput` should be present
   - `isPartyMenuOpen()` returns `true`

#### Test 3.4: Party Menu - Different Selection States

| State | Expected Task |
|-------|---------------|
| Main party view (slot 0-5 highlighted) | `Task_HandleChooseMonInput` |
| Action submenu open (Summary/Switch/etc.) | `Task_HandleSelectionMenuInput` (if exported) |
| Cancel/Exit highlighted | `Task_HandleChooseMonInput` (same task) |

#### Test 3.5: In Battle

1. Load save state in battle (action selection)
2. Call `getActiveTasks()`
3. **Expected:**
   - Battle-related tasks present
   - `isInBattle()` returns `true` (from separate check)
   - `isPartyMenuOpen()` returns `false`

---

### Phase 4: Edge Cases

| Test | Description | Expected |
|------|-------------|----------|
| No active tasks | Edge case - should not happen in normal gameplay | Empty array, no crash |
| All 16 slots active | Stress test | All 16 returned |
| Weather task priority | Weather often has highest priority | Still detect menu tasks |
| Rapid state changes | Open/close menu quickly | Correct state each read |

---

## Save State Requirements

Create and commit save states for testing:

```
packages/core/tests/fixtures/
├── overworld_idle.ss1       # Standing in overworld, no menu
├── start_menu_open.ss1      # Start menu visible
├── party_menu_slot0.ss1     # Party menu, first Pokemon selected
├── party_menu_slot5.ss1     # Party menu, last Pokemon selected  
├── party_menu_cancel.ss1    # Party menu, Cancel button selected
├── party_action_menu.ss1    # Party menu action submenu open
├── battle_action.ss1        # In battle, action selection
└── battle_move.ss1          # In battle, move selection
```

---

## Verification Commands

```bash
# Run unit tests
cd packages/core
bun test tasks.test.ts
bun test taskLookup.test.ts

# Run integration tests (requires mGBA running)
bun test:integration tasks
```

---

## ARM Thumb Bit Verification

To verify the Thumb bit hypothesis:

1. Load a save state with party menu open
2. Read raw `gTasks[0].func` value from memory
3. Compare to linker map address for `Task_HandleChooseMonInput`:
   - If memory shows `0x081b1371` → Thumb bit confirmed (+1)
   - If memory shows `0x081b1370` → No offset needed

**Quick test script:**
```typescript
// packages/core/scripts/verifyThumbBit.ts
import { readUint32 } from '../src/memory/client';
import { GTASKS_ADDR } from '../src/constants/addresses';

async function verifyThumbBit() {
  // Read first task's function pointer
  const funcPtr = await readUint32(GTASKS_ADDR);
  console.log(`Raw func pointer: 0x${funcPtr.toString(16)}`);
  console.log(`Expected (linker): 0x081b1370`);
  console.log(`Difference: ${funcPtr - 0x081b1370}`);
  
  if ((funcPtr & 1) === 1) {
    console.log('✓ Thumb bit IS set - need to mask with & ~1');
  } else {
    console.log('✓ Thumb bit NOT set - no masking needed');
  }
}

verifyThumbBit();
```

---

## Success Criteria

- [ ] All unit tests pass
- [ ] Integration tests correctly identify:
  - [ ] Overworld state (no menu)
  - [ ] Start menu open
  - [ ] Party menu open
  - [ ] Party menu closed (reliable detection!)
  - [ ] In-battle state
- [ ] Thumb bit behavior documented
- [ ] No false positives for `isPartyMenuOpen()`
- [ ] No false negatives for `isPartyMenuOpen()`
