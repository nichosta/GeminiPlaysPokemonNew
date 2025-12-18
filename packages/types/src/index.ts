/**
 * @gempp/types - Shared TypeScript types for GemPP
 */

// Pokemon types
export interface Pokemon {
  nickname: string;
  species: string;
  level: number;
  currentHP: number;
  maxHP: number;
  moves: PokemonMove[];
  types: [string, string?];
  ability: string;
  statusCondition: string | null;
  heldItem: string | null;
}

export interface PokemonMove {
  name: string;
  pp: number;
  maxPP: number;
}

// Inventory types
export interface BagPocket {
  [itemName: string]: number;
}

export interface Inventory {
  items: BagPocket;
  keyItems: BagPocket;
  pokeBalls: BagPocket;
  tmHm: BagPocket;
  berries: BagPocket;
}

// Map/Overworld types
export interface Position {
  x: number;
  y: number;
}

export interface Warp {
  position: Position;
  destinationMap: string;
  destinationPosition: Position;
}

export interface NPC {
  id: number;
  spriteName: string;
  position: Position;
  isWandering: boolean;
}

export interface MapConnection {
  direction: "north" | "south" | "east" | "west";
  destinationMap: string;
}

export interface MapState {
  mapName: string;
  mapId: number;
  playerPosition: Position;
  playerFacing: "up" | "down" | "left" | "right";
  collisionMap: boolean[][]; // true = walkable
  warps: Warp[];
  npcs: NPC[];
  connections: MapConnection[];
  playerElevation: number;
}

// Player state types
export interface PlayerState {
  position: Position;
  facing: "up" | "down" | "left" | "right";
  isSurfing: boolean;
  isBiking: boolean;
  isDiving: boolean;
  badgeCount: number;
  inBattle: boolean;
  controlsLocked: boolean;
}

// Game state (combined)
export interface GameState {
  map: MapState;
  player: PlayerState;
  party: Pokemon[];
  inventory: Inventory;
}

// Tool types
export interface NavigateParams {
  path: Position[];
}

export interface SelectMoveParams {
  slot: 1 | 2 | 3 | 4;
}

export interface SelectBagParams {
  pocket?: number;
  slot?: number;
}

export interface SwitchPokemonParams {
  slot: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface PressButtonsParams {
  buttons: string[];
  holdFrames?: number;
}

export interface WebSearchParams {
  query: string;
}

export type ToolParams =
  | { name: "navigate"; params: NavigateParams }
  | { name: "select_move"; params: SelectMoveParams }
  | { name: "select_bag"; params: SelectBagParams }
  | { name: "switch_pokemon"; params: SwitchPokemonParams }
  | { name: "select_run"; params: Record<string, never> }
  | { name: "press_buttons"; params: PressButtonsParams }
  | { name: "web_search"; params: WebSearchParams };

// Token usage metrics
export interface TokenUsage {
  inputTokens: number;
  inputCachedTokens: number;
  thinkingTokens: number;
  outputTokens: number;
}
