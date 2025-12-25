/**
 * Testing utilities for @gempp/core
 * 
 * Provides save state management and fixtures for automated testing
 * with mGBA-http.
 * 
 * Usage:
 * ```typescript
 * import { withSaveState, fixtures } from "@gempp/core/testing";
 * 
 * test("party menu is detected", async () => {
 *   await withSaveState(fixtures.menus.party.slot0, async () => {
 *     const isOpen = await isPartyMenuOpen();
 *     expect(isOpen).toBe(true);
 *   });
 * });
 * ```
 */

export * from "./emulator";
export * from "./fixtures";
