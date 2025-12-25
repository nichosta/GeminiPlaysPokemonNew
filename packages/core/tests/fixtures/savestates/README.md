# Test Save States

This directory contains mGBA save states (`.ss1` files) used for integration testing.

**See:** [`../SAVE_STATES.md`](../SAVE_STATES.md) for the complete catalog and requirements.

## Directory Structure

- `overworld/` - Overworld/exploration states (OW-xx)
- `menus/` - Menu navigation states (MN-xx, PM-xx, BG-xx)
- `battle/` - Battle states (BT-xx)
- `special/` - Edge cases and special scenarios (SP-xx)

## Programmatic Usage

Access save states via the `@gempp/core/testing` module:

```typescript
import { withSaveState, fixtures } from "@gempp/core/testing";

// Auto backup/restore with fixture
await withSaveState(fixtures.menus.party.slot0, async () => {
    // Test code runs with this save state loaded
    // Original state is restored automatically after
});
```

## Creating New Save States

1. Read the SAVE_STATES.md catalog
2. Create save states in mGBA matching the requirements
3. Export as `.ss1` files
4. Place in appropriate subdirectory
5. Update `src/testing/fixtures.ts` to add the path
6. Run tests to verify

## Note

Save state files are binary and should be committed to git.
They are essential for reproducible integration tests.

