# Tools Package Specification

## Overview
The `@gempp/tools` package provides the interface between the LLM agent and the game/emulator. It contains the logic for executing agent decisions, ensuring actions are valid, and handling the low-level communication with the mGBA emulator via `mgba-http`.

## Architecture

### Components
1.  **Tool Definitions**: TypeScript interfaces and Zod schemas for all tools.
2.  **Tool Implementations**: logic for `navigate`, battle tools, etc.
3.  **mGBA Client**: A wrapper around `fetch` calls to `mgba-http` endpoints (button presses, script execution).
4.  **Web Search Client**: Wrapper for Google Custom Search API.

### Directory Structure
```
packages/tools/
├── src/
│   ├── battle/         # Battle-specific tools (select_move, etc.)
│   ├── mgba/           # mGBA-http client and primitives
│   ├── navigation/     # Pathfinding and movement tools
│   ├── search/         # Web search implementation
│   ├── utility/        # General utility tools (stun_npc, etc.)
│   └── index.ts        # Public API
├── tests/              # Package-specific tests
└── package.json
```

## Tool Specifications

### 1. Navigation (`navigate`)
Executes a multi-step movement path on the overworld.
- **Input**: `path: Array<{x: number, y: number}>` (Max 10 steps)
- **Validation**:
    - Check collision data for each step.
    - Validate warp interactions (endpoint only).
    - Validate surf/bike logic (e.g., path is water but player not surfing).
- **Execution**:
    - Convert coordinates to D-pad inputs.
    - Verify position after execution.
    - **Optimization**: If valid, execute blindly for speed. If blocked, stop and report.

### 2. Battle Tools
Set of tools for combat interaction.
- **`select_move`**: Navigate to Fight menu -> Select move slot (1-4).
- **`select_bag`**: Open bag -> (Optional) Navigate to pocket/item.
- **`switch_pokemon`**: Open Pokemon menu -> Select party slot (1-6).
- **`select_run`**: Attempt to flee.

### 3. Raw Input (`press_buttons`)
Direct controller input fallback.
- **Input**: `buttons: string[]` (e.g., ["A", "Up", "Start"])
- **Availability**: Always available.
- **Execution**: Sends sequence to mGBA with minimal delay between inputs.

### 4. Precision Input (`hold_buttons`)
Holds a specific button for a set duration.
- **Input**: `button: string`, `duration: number` (milliseconds)
- **Constraint**: **Allowed ONLY when Player State indicates Mach Bike is active.**
- **Use Case**: Crossing cracked floor tiles (Sky Pillar).
- **Implementation**: Post to `/button/hold`.

### 5. Utility (`stun_npc`)
Freezes an NPC to prevent movement, allowing the agent to catch up.
- **Input**: `id: number` (NPC Index)
- **Logic**: Toggles the "Frozen" bit in the NPC's state flags.
- **Technical Details**:
    - **Struct**: `ObjectEvent` (size 0x24).
    - **Flags Offset**: 0x00 (32-bit).
    - **Frozen Bit**: Bit 8 (0x100).
    - **Movement Bits**: 
        - `singleMovementActive`: Bit 1 (0x02).
        - `heldMovementActive`: Bit 6 (0x40).
- **Safety Mechanism**: 
    - **CRITICAL**: Before stunning, constantly monitor the flags.
    - **Wait Loop**: If `(flags & 0x02)` OR `(flags & 0x40)` is non-zero (NPC is moving):
        - Wait 32ms (approx 2 frames).
        - Re-read flags.
        - Repeat until safe or timeout (2000ms).
    - **Action**:
        - If safe: Apply Stun (XOR Bit 8).
        - If timeout: Return failure "NPC is busy moving (timeout)".
    - **Reasoning**: Freezing during `singleMovementActive` causes softlocks. NPCs move in short bursts; waiting briefly allows the current step to finish, making the stun safe to apply during the pause between steps.

### 6. Information (`web_search`)
Retrieves external game knowledge.
- **Input**: `query: string`
- **Source**: Google Custom Search API.
- **Output**: Summary snippets from top results.

## Implementation Guidelines

### mGBA Client
- Base URL: `http://localhost:5000` (configurable)
- Endpoints:
    - POST `/buttons/press`: Sequence of buttons
    - POST `/buttons/hold`: Button hold
    - GET `/memory/*`: (Handled by `@gempp/core`, but tools may need write access?) 
    - **Note**: `@gempp/tools` focuses on *actions*. Memory reading is primarily `@gempp/core`, but `stun_npc` requires memory *writing*. 
    - **Decision**: `@gempp/tools` will likely depend on `@gempp/core` for address constants and potentially memory writing utilities, or implement its own lightweight writer.

### Validation Strategies
- **Pre-execution**: logical checks (is map valid? is bike on?).
- **Runtime**: error handling for HTTP failures.
- **Post-execution**: `navigate` checks if destination was reached.

## Testing

Uses the testing utilities from `@gempp/core/testing` for save state management:

```typescript
import { withSaveState, fixtures } from "@gempp/core/testing";

test("navigate validates blocked paths", async () => {
    await withSaveState(fixtures.overworld.ledges, async () => {
        // Test path validation against known collision data
        const result = await navigate([{ x: 10, y: 5 }]);
        expect(result.success).toBe(false);
    });
});
```

### Unit Tests
- **Path validation**: Test against `overworld_ledges.ss1` (verify blocked paths)
- **hold_buttons constraint**: Verify `Mach Bike` check using `overworld_mach_bike.ss1` (valid) vs `overworld_walking.ss1` (invalid)

### Integration Tests
- **stun_npc**: 
    - Load `overworld_active_npc.ss1`
    - Trigger `stun_npc`
    - Verify it *waits* for the movement bit to clear before applying stun
    - Verify `frozen` bit is set after success
- **navigate**:
    - Load `overworld_idle.ss1`
    - Execute movement path
    - Verify player position after execution

### Manual Verification
- Use `overworld_mach_bike.ss1` to test meaningful input sequences
- State is automatically backed up and restored after each test

