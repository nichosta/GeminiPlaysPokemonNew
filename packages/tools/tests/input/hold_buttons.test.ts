import { describe, it, expect, beforeEach, mock } from "bun:test";
import { holdButtons } from "../../src/mgba/input";

// Create mocks
const mockReadUint32 = mock((addr: number) => Promise.resolve(0));
const mockPost = mock((endpoint: string, body: any) => Promise.resolve());

// Mock @gempp/core
mock.module("@gempp/core", () => ({
    readUint32: mockReadUint32,
    EMERALD: { PLAYER_AVATAR_ADDR: 0x2000 }
}));

// Mock client
mock.module("../../src/mgba/client", () => ({
    postToMgba: mockPost
}));

describe("holdButtons", () => {
    beforeEach(() => {
        mockReadUint32.mockClear();
        mockPost.mockClear();
    });

    it("should throw error if NOT on Mach Bike", async () => {
        // Mock flags: 0 (Walking)
        mockReadUint32.mockResolvedValue(0);

        // Bun syntax
        await expect(holdButtons("A", 100)).rejects.toThrow("Safety Constraint");
        expect(mockPost).not.toHaveBeenCalled();
    });

    it("should succeed if ON Mach Bike", async () => {
        // Mock flags: 2 (Mach Bike)
        mockReadUint32.mockResolvedValue(0x02);

        const result = await holdButtons("A", 100);

        expect(result).toBe(true);
        expect(mockPost).toHaveBeenCalled();
        const args = mockPost.mock.calls[0];
        expect(args[0]).toBe("/buttons/hold");
        expect(args[1]).toEqual({ button: "A", duration: 100 });
    });
});
