# Test Save States

This directory contains mGBA save states (`.ss1` files) used for integration testing.

**See:** [`../SAVE_STATES.md`](../SAVE_STATES.md) for the complete catalog and requirements.

## Directory Structure

- `overworld/` - Overworld/exploration states (OW-xx)
- `menus/` - Menu navigation states (MN-xx, PM-xx, BG-xx)
- `battle/` - Battle states (BT-xx)
- `special/` - Edge cases and special scenarios (SP-xx)

## Quick Start

1. Read the SAVE_STATES.md catalog
2. Create save states in mGBA matching the requirements
3. Export as `.ss1` files
4. Place in appropriate subdirectory
5. Run tests to verify

## Note

Save state files are binary and should be committed to git.
They are essential for reproducible integration tests.
