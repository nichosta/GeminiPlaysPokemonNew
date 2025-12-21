import { describe, it, expect, beforeEach, mock } from "bun:test";
import { stunNpc } from "../../src/utility/stun_npc";

// Mock @gempp/core
const mockReadUint32 = mock((addr: number) => Promise.resolve(0));
const mockWriteUint32 = mock((addr: number, val: number) => Promise.resolve());

mock.module("@gempp/core", () => ({
    readUint32: mockReadUint32,
    writeUint32: mockWriteUint32,
    EMERALD: { OBJECT_EVENTS_ADDR: 0x1000 }
}));

describe("stunNpc", () => {
    beforeEach(() => {
        mockReadUint32.mockClear();
        mockWriteUint32.mockClear();
    });

    it("should stun an NPC immediately if flags are safe", async () => {
        // Mock flags: 0 (Safe)
        mockReadUint32.mockResolvedValueOnce(0); // For safety check
        mockReadUint32.mockResolvedValueOnce(0); // For toggle

        const result = await stunNpc(1);

        expect(result).toBe(true);
        // Bun mocks usually don't support "toHaveBeenCalledWith" with partial matchers exactly like Jest
        // But we can check arguments.
        expect(mockWriteUint32).toHaveBeenCalled();
        const args = mockWriteUint32.mock.calls[0];
        // args[0] is address, args[1] is value
        expect(args[1]).toBe(1 << 8);
    });

    it("should wait and retry if NPC is moving", async () => {
        // Mock flags sequence: 
        // 1. Moving (Bit 1 set = 2)
        // 2. Moving (Bit 1 set = 2)
        // 3. Safe (0)
        mockReadUint32.mockReset(); // Clear default
        mockReadUint32
            .mockResolvedValueOnce(2)
            .mockResolvedValueOnce(2)
            .mockResolvedValueOnce(0) // Safe
            .mockResolvedValueOnce(0); // For toggle

        const result = await stunNpc(1);

        expect(result).toBe(true);
        // Expect at least 3 reads (2 failed + 1 success safety + 1 toggle = 4)
        expect(mockReadUint32).toHaveBeenCalledTimes(4);
    });

    it("should throw error if timeout reached", async () => {
        // Mock flags: Always Moving (2)
        mockReadUint32.mockReset();
        mockReadUint32.mockResolvedValue(2);

        // Bun expect().rejects.toThrow()
        expect(stunNpc(1)).rejects.toThrow("timeout");
    }, 3000); // Test timeout
});
