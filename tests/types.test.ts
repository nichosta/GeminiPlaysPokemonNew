import { describe, expect, test } from "bun:test";
import type { Pokemon, Position, TokenUsage } from "@gempp/types";

describe("@gempp/types", () => {
  test("Pokemon type is valid", () => {
    const pokemon: Pokemon = {
      nickname: "Mudkip",
      species: "Mudkip",
      level: 5,
      currentHP: 20,
      maxHP: 20,
      moves: [{ name: "Tackle", pp: 35, maxPP: 35 }],
      types: ["Water"],
      ability: "Torrent",
      statusCondition: null,
      heldItem: null,
    };

    expect(pokemon.species).toBe("Mudkip");
    expect(pokemon.level).toBe(5);
  });

  test("Position type is valid", () => {
    const pos: Position = { x: 10, y: 20 };
    expect(pos.x).toBe(10);
    expect(pos.y).toBe(20);
  });

  test("TokenUsage type is valid", () => {
    const usage: TokenUsage = {
      inputTokens: 100,
      inputCachedTokens: 50,
      thinkingTokens: 200,
      outputTokens: 75,
    };

    expect(usage.inputTokens).toBe(100);
    expect(usage.inputCachedTokens).toBe(50);
  });
});
