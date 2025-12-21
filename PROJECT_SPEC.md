# GemPP - Gemini Plays Pokemon (Emerald) Specification

## Project Overview

A TypeScript harness enabling Gemini 3.0 Flash to autonomously play Pokemon Emerald via the mGBA emulator. The goal is to create a robust enough system for a Flash-class model to complete the game in under 200 hours.

### Key Differences from Previous Project

| Aspect | Old (GeminiPlaysPokemonLive) | New (GemPP) |
|--------|------------------------------|-------------|
| Language | JavaScript | TypeScript |
| Runtime | Node.js | Bun |
| LLM | Gemini 2.5 Flash | Gemini 3.0 Flash |
| Response Format | Structured JSON output | Interleaved thinking + function calling |
| Tools | Single button press (max 7) | Multi-step paths (10), battle automation, web search |
| Turn Structure | Single tool per turn | Multi-tool turns (until emulator action) |
| Context Management | 30 turns + stacked summaries | 128K limit + single overwriting summary |
| Vision | Processed screenshots with grid | Raw upscaled screenshots |
| Game Support | Emerald + FRLG | Emerald only |
| Twitch Integration | Yes | Deferred (easy to add later) |

---

## Architecture

### Monorepo Structure

```
gempp/
├── packages/
│   ├── core/           # Game state, memory reading, data structures
│   ├── agent/          # Main loop, LLM interaction, context management
│   ├── tools/          # mGBA-http client, tool implementations
│   ├── overlay/        # Stream overlay frontend
│   └── types/          # Shared TypeScript types
├── tests/              # Test suites and utilities
├── PROJECT_SPEC.md     # This file
├── ISSUES.md           # Development issues tracker
└── bun.lockb
```

### Package Breakdown

#### `@gempp/types`
Shared TypeScript types and interfaces used across all packages.

- Pokemon data structures (party, moves, stats, types)
- Map/overworld types (tiles, warps, NPCs, connections)
- Inventory structures
- Tool definitions and schemas
- LLM message types

#### `@gempp/core`
Game state reading and data processing. No LLM or emulator control logic.

- **Memory reading**: HTTP client for mGBA-http memory endpoints
- **Pokemon data**: Party decryption, stats, moves, abilities
- **Inventory**: Bag pocket reading with encryption handling
- **Overworld**: Map state, collision data, warps, NPCs, connections
- **Player state**: Position, facing, badges, surf/bike status
- **Constants**: Emerald memory addresses, lookup tables (species, moves, items, maps)

#### `@gempp/tools`
Emulator interaction and tool implementations for the LLM.

- **mGBA-http client**: Button press, hold, screenshot capture
- **Navigation tool**: 10-step path execution with validation warnings
- **Battle tools**: Move selection, bag, switch Pokemon, run
- **Web search tool**: Google Custom Search API integration
- **Dialogue handler**: Auto-click through dialogue, capture text for LLM

#### `@gempp/agent`
Main game loop and LLM orchestration.

- **Main loop**: Game state → LLM → tool execution cycle
- **LLM client**: google/genai SDK with continuous thinking + function calling
- **Context management**: 128K limit tracking, summarization triggers
- **Turn management**: Multi-tool turns, turn-ending action detection
- **History**: Conversation persistence, summary storage

#### `@gempp/overlay`
Stream overlay frontend (tech TBD).

- WebSocket connection to agent
- Streaming thought display
- Tool call visualization with decoration
- Basic game state display (party, location)

#### `tests/`
Comprehensive test suites.

- Unit tests for each package
- Integration tests for tool execution
- Mock mGBA-http server for testing
- Test utilities and fixtures

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Language | TypeScript (strict mode) |
| LLM SDK | @google/genai |
| LLM Model | Gemini 3.0 Flash |
| Emulator | mGBA |
| Emulator Bridge | mGBA-http |
| Web Search | Google Custom Search API |
| Testing | Bun test (built-in) |
| Overlay | TBD (simple HTML/TS initially) |

---

## Game State Tracking

### Pokemon Party
Read from encrypted RAM structures. For each party member:
- Species, nickname, level
- Current HP / Max HP
- Moves (name, PP, max PP)
- Types, ability
- Status condition (poison, burn, etc.)
- Held item

### Inventory
5 bag pockets with encryption:
- Items, Key Items, Poke Balls, TMs/HMs, Berries
- Item name → quantity mapping

### Overworld/Map
- Current map name and ID
- Player position (x, y) and facing direction
- Tile collision map (walkable/blocked)
- Warp locations and destinations
- NPC positions, sprites, wandering status
- Map connections to adjacent areas
- Elevation data (for surf, ledges, etc.)

### Player State
- Badge count
- Surfing/biking/diving status
- Field controls locked (in menu/dialogue)
- Battle status

---

## LLM Interaction

### Model Configuration
- Model: `gemini-3.0-flash` (or latest equivalent)
- Thinking: Enabled (interleaved with function calls)
- Temperature: TBD (start with 1.0, tune as needed)

### Turn Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        TURN START                           │
├─────────────────────────────────────────────────────────────┤
│ 1. Scrape game state (map, party, inventory, screenshot)    │
│ 2. Build user message with state + image                    │
│ 3. Send to LLM                                              │
├─────────────────────────────────────────────────────────────┤
│                     LLM PROCESSING                          │
├─────────────────────────────────────────────────────────────┤
│ Loop until turn-ending action:                              │
│   - Model thinks (streamed to overlay)                      │
│   - Model calls tool                                        │
│   - If tool is turn-ending (emulator action):               │
│       → Execute, wait 3s, END TURN                          │
│   - Else:                                                   │
│       → Execute, return result, continue                    │
├─────────────────────────────────────────────────────────────┤
│                        TURN END                             │
├─────────────────────────────────────────────────────────────┤
│ - Check context usage against 128K limit                    │
│ - If over limit: trigger summarization                      │
│ - Loop back to TURN START                                   │
└─────────────────────────────────────────────────────────────┘
```

### Tool Categories

**Turn-ending tools** (trigger emulator action + 3s delay):
- `navigate`: Execute movement path
- `press_buttons`: Direct button input
- `select_move`: Battle move selection
- `select_bag`: Open bag in battle
- `switch_pokemon`: Switch active Pokemon
- `select_run`: Attempt to flee

**Non-turn-ending tools** (return result, continue turn):
- `web_search`: Query Google for Pokemon knowledge
- `validate_path`: Check path validity without executing
- (Future: other information-gathering tools)

### Context Management

- **Limit**: 128K tokens
- **Trigger**: When context exceeds limit, next turn becomes summarization
- **Summary prompt**: Condense current context into key information
- **Storage**: Single summary, overwrites previous (no stacking)
- **First message**: Summary becomes first user message after clear
- **Benefit**: Better context caching utilization

---

## Tool Specifications

### `navigate`
Execute a movement path on the overworld.

```typescript
interface NavigateTool {
  name: "navigate";
  params: {
    path: Array<{x: number, y: number}>;  // Max 10 steps
  };
}
```

**Behavior**:
1. Validate path against collision data
2. If validation fails, log warning (but continue)
3. Execute button presses to walk the path
4. After execution, check if player reached expected destination
5. If destination reached despite validation warning, suppress warning
6. Return result with any warnings

**Validation warnings**:
- "Path contains warp that is not endpoint"
- "Path leads onto water but player is not surfing"
- "Path contains impassable tile at (x, y)"
- "Elevation mismatch at (x, y)"

### `select_move`
Select a move in battle.

```typescript
interface SelectMoveTool {
  name: "select_move";
  params: {
    slot: 1 | 2 | 3 | 4;  // Move slot (1-indexed)
  };
}
```

**Behavior**:
1. If not on Fight menu, navigate to it
2. Navigate to correct move slot (2x2 grid)
3. Press A to confirm

### `select_bag`
Open bag menu in battle.

```typescript
interface SelectBagTool {
  name: "select_bag";
  params: {
    pocket?: number;  // Optional: navigate to specific pocket
    slot?: number;    // Optional: select specific item slot
  };
}
```

### `switch_pokemon`
Switch to a different party member.

```typescript
interface SwitchPokemonTool {
  name: "switch_pokemon";
  params: {
    slot: 1 | 2 | 3 | 4 | 5 | 6;  // Party slot (1-indexed)
  };
}
```

**Behavior**:
1. Navigate to Pokemon menu option
2. Select target slot
3. Confirm switch

### `select_run`
Attempt to flee from battle.

```typescript
interface SelectRunTool {
  name: "select_run";
  params: {};
}
```

### `press_buttons`
Direct button input. Always available.

```typescript
interface PressButtonsTool {
  name: "press_buttons";
  params: {
    buttons: string[];  // ["A", "Up", "B", etc.]
    hold_frames?: number;  // Optional: hold duration
  };
}
```

### `web_search`
Search for Pokemon game knowledge.

```typescript
interface WebSearchTool {
  name: "web_search";
  params: {
    query: string;
  };
}
```

**Behavior**:
1. Query Google Custom Search API
2. Return top results with snippets
3. Non-turn-ending (model can search then act)

### `hold_buttons`
Hold a specific button for a duration.

```typescript
interface HoldButtonsTool {
  name: "hold_buttons";
  params: {
    button: string;        // Button to hold (e.g., "Up")
    duration: number;      // Duration in milliseconds
  };
}
```

**Constraints**:
- Critical for Mach Bike mechanics (e.g., Sky Pillar).
- **Restriction**: Should return failure if player is not currently on the Mach Bike.

### `stun_npc`
Temporarily freeze an NPC's movement.

```typescript
interface StunNPCTool {
  name: "stun_npc";
  params: {
    id: number;            // NPC ID/Index
  };
}
```

**Context**:
- Solves the issue of interacting with rapidly moving NPCs.
- **Known Issue**: In the previous implementation, freezing an NPC while they were moving between tiles caused a softlock upon interaction (game waits for NPC to finish stepping).
- **Future Improvement**: Needs investigation of NPC struct flags to implement a safe freeze that resolves the softlock risk.

---

## Automatic Dialogue Handling

### Goal
Reduce wasted turns on dialogue-heavy sequences (battle messages, NPC conversations, etc.)

### Approach (needs research/validation)
1. Detect dialogue box active via RAM
2. Auto-press A/B to advance
3. Capture dialogue text from RAM
4. Pass accumulated dialogue to LLM on next game state scrape

### Research needed
- Memory addresses for dialogue detection
- Text buffer locations
- Animation state detection (for battle animations)

---

## Overlay Requirements

### Display Elements
- **Thinking stream**: Large text area showing model thoughts as they arrive
- **Tool calls**: Decorated blocks between thoughts showing tool invocations and results
- **Basic state**: Party HP summary, current location

### Technical
- WebSocket connection to agent
- Streaming text updates
- Simple, clean design (specific design TBD)

---

## Testing Strategy

### Unit Tests
- Memory reading/parsing (mock HTTP responses)
- Data decryption (Pokemon, inventory)
- Path validation logic
- Tool parameter validation

### Integration Tests
- Full tool execution against mock mGBA-http
- LLM interaction with mock responses
- Context management and summarization

### Test Utilities
- Mock mGBA-http server
- Sample game state fixtures
- Memory dump samples

---

## Logging

### Prompt Log
Human-readable log of prompts sent to the LLM for debugging.
- Game state summaries
- Tool call context
- Formatted for easy reading/searching

### Output Log
LLM responses and tool results.
- **Early development**: Log entire response objects (to understand format)
- **Later**: Simplify to relevant fields once format is stable

### Log Format
- Timestamped entries
- Separate files per session or day (TBD)
- Location: `logs/` directory (gitignored)

---

## Metrics

### Token Usage Tracking
Track per-turn and cumulative:
- **Input tokens**: Total tokens in prompt
- **Input cached tokens**: Tokens served from context cache
- **Thinking tokens**: Tokens used for model reasoning
- **Output tokens**: Tokens in model response

### Storage
- Per-session metrics file
- Running totals for progress tracking toward <200hr goal

### Future (Post Early Development)
- Timing metrics (turn duration, tool execution time)
- Success/failure rates per tool
- Progress milestones (badges, key events)

---

## Open Questions / Future Considerations

1. **Dialogue text extraction**: How to reliably capture dialogue from RAM?
2. **Animation waiting**: Can we detect when battle animations complete?
3. **Overlay design**: Final tech choice and visual design
4. **Google Search API**: Usage limits and fallback options
5. **Twitch integration**: Easy to add later, architecture should accommodate
6. **Save state management**: Summarization triggers save? Recovery from crashes?

---

## Development Phases

### Phase 1: Foundation
- [ ] Bun monorepo setup
- [ ] `@gempp/types` package
- [ ] `@gempp/core` - port game state reading from old project
- [ ] Basic mGBA-http client in `@gempp/tools`
- [ ] Unit tests for core functionality

### Phase 2: Agent Core
- [ ] `@gempp/agent` - main loop structure
- [ ] LLM integration with google/genai SDK
- [ ] Multi-tool turn handling
- [ ] Context management and summarization

### Phase 3: Tools
- [ ] Navigation tool with validation
- [ ] Battle automation tools
- [ ] Web search integration
- [ ] Direct button press fallback

### Phase 4: Overlay
- [ ] Basic WebSocket streaming
- [ ] Thought/tool display
- [ ] Polish and design

### Phase 5: Refinement
- [ ] Dialogue auto-handling (if feasible)
- [ ] Battle animation detection (if feasible)
- [ ] Performance tuning
- [ ] Edge case handling

---

## References

- [mGBA-http](https://github.com/niPokemon/mGBA-http) - Emulator HTTP bridge
- [pokeemerald](https://github.com/pret/pokeemerald) - Decompilation project
- [google/genai SDK](https://github.com/google/generative-ai-js) - Gemini API client
