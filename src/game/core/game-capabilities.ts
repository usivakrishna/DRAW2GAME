/**
 * DRAW2GAME — Universal Game Engine Architecture
 * Game Capabilities Definition & Resolver
 *
 * Defines the generic runtime capabilities that a GameDefinition can activate.
 * The UniversalGameEngine inspects these capabilities to initialize only the
 * necessary runtime systems (physics, board, turns, camera, rules, etc.).
 */

import type { GameObject, GameRule, GameType } from "./game-definition";

export const GAME_CAPABILITIES = [
  "physics",
  "gravity",
  "collision",
  "movement",
  "camera",
  "board",
  "grid",
  "turns",
  "rules",
  "scoring",
  "hazards",
  "collectibles",
  "goals",
  "timer",
  "health",
] as const;

export type GameCapability = (typeof GAME_CAPABILITIES)[number];

export function isKnownCapability(cap: string): cap is GameCapability {
  return (GAME_CAPABILITIES as readonly string[]).includes(cap as GameCapability);
}

/**
 * Standard capabilities associated with canonical game genres.
 */
export const DEFAULT_GENRE_CAPABILITIES: Record<GameType, GameCapability[]> = {
  carrom: ["physics", "collision", "camera", "rules", "scoring", "turns"],
  chess: ["board", "grid", "turns", "rules", "scoring"],
  ludo: ["board", "grid", "turns", "rules", "scoring"],
  platformer: [
    "physics",
    "gravity",
    "collision",
    "movement",
    "camera",
    "scoring",
    "hazards",
    "collectibles",
    "goals",
    "rules",
  ],
  pool: ["physics", "collision", "camera", "rules", "scoring", "turns"],
  puzzle: ["grid", "rules", "scoring", "timer"],
  racing: ["physics", "collision", "movement", "camera", "rules", "timer"],
  shooter: [
    "physics",
    "collision",
    "movement",
    "camera",
    "rules",
    "scoring",
    "hazards",
    "health",
  ],
  sports: ["physics", "collision", "movement", "camera", "rules", "scoring", "goals"],
};

/**
 * Automatically infers active capabilities from gameType, objects, rules, or payload
 * if capabilities were not explicitly specified in the definition.
 */
export function inferCapabilities(
  gameType: GameType,
  objects: GameObject[] = [],
  rules: GameRule[] = [],
  typePayload?: unknown,
): GameCapability[] {
  const caps = new Set<GameCapability>(DEFAULT_GENRE_CAPABILITIES[gameType] || ["rules"]);

  // Inspect objects for capability requirements
  for (const obj of objects) {
    if (obj.type === "player" || obj.type === "platform") {
      caps.add("physics");
      caps.add("collision");
      caps.add("movement");
    }
    if (obj.type === "coin" || obj.type === "gem") {
      caps.add("collectibles");
      caps.add("scoring");
    }
    if (obj.type === "spike" || obj.type === "enemy") {
      caps.add("hazards");
    }
    if (obj.type === "goal") {
      caps.add("goals");
    }
    if (obj.type.startsWith("chess-") || (obj.properties && "square" in obj.properties)) {
      caps.add("board");
      caps.add("turns");
    }
  }

  // Inspect rules for capability requirements
  if (rules.length > 0) {
    caps.add("rules");
    for (const rule of rules) {
      if (rule.action?.includes("SCORE")) caps.add("scoring");
      if (rule.condition?.includes("TOUCH") || rule.event?.includes("COLLIDE")) {
        caps.add("collision");
      }
    }
  }

  // Inspect payload
  if (typePayload && typeof typePayload === "object") {
    const p = typePayload as Record<string, unknown>;
    if ("pieces" in p && "boardSize" in p) {
      caps.add("board");
      caps.add("turns");
    }
    if ("physics" in p || "platforms" in p) {
      caps.add("physics");
      caps.add("gravity");
    }
  }

  return Array.from(caps);
}
