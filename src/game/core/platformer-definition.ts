/**
 * Universal 2D Game Architecture - Platformer Definition & Adapter
 *
 * Couples the platformer genre specific data (physics, player, platforms,
 * hazards, collectibles) to the universal GameDefinition model while
 * guaranteeing 100% backward compatibility with Phase 5 LevelDefinition.
 */

import type {
  GenericGameDefinition,
  GameObject,
  GameRule,
} from "./game-definition";
import {
  type CoinEntity,
  type EnemyEntity,
  type GameMode,
  type GoalEntity,
  type LevelDefinition,
  levelSchema,
  type PlatformEntity,
  type PlayerEntity,
  type SpikeEntity,
  type WorldDimensions,
} from "@/json/level-schema";

export interface PlatformerPayload {
  coins: CoinEntity[];
  enemies: EnemyEntity[];
  gameMode: GameMode;
  goal: GoalEntity | null;
  physics: {
    gravityY: number;
    jumpVelocity: number;
  };
  platforms: PlatformEntity[];
  player: PlayerEntity;
  spikes: SpikeEntity[];
  world?: WorldDimensions | undefined;
}

export type PlatformerGameDefinition = GenericGameDefinition<
  "platformer",
  PlatformerPayload
>;

/**
 * Standard platformer rules represented declaratively in the generic GameRule format.
 */
export const DEFAULT_PLATFORMER_RULES: GameRule[] = [
  {
    action: "INCREASE_SCORE",
    condition: "TOUCH",
    description: "Player collects a coin to gain score and progress.",
    event: "PLAYER_COLLIDE_COIN",
    id: "rule_collect_coin",
    name: "Coin Collection",
    parameters: { points: 10 },
  },
  {
    action: "GAME_OVER_LOSE",
    condition: "TOUCH",
    description: "Player colliding with an enemy hazard results in defeat.",
    event: "PLAYER_COLLIDE_ENEMY",
    id: "rule_enemy_hazard",
    name: "Enemy Hazard",
    parameters: { cause: "enemy" },
  },
  {
    action: "GAME_OVER_LOSE",
    condition: "TOUCH",
    description: "Player touching sharp spikes results in defeat.",
    event: "PLAYER_COLLIDE_SPIKE",
    id: "rule_spike_hazard",
    name: "Spike Hazard",
    parameters: { cause: "spike" },
  },
  {
    action: "GAME_OVER_WIN",
    condition: "TOUCH",
    description: "Player reaching the goal flag completes the level.",
    event: "PLAYER_COLLIDE_GOAL",
    id: "rule_reach_goal",
    name: "Victory Condition",
  },
  {
    action: "GAME_OVER_LOSE",
    condition: "BOUNDS_BELOW",
    description: "Player falling off the bottom of the world results in defeat.",
    event: "PLAYER_OUT_OF_BOUNDS",
    id: "rule_fall_hazard",
    name: "Pit Hazard",
    parameters: { cause: "pit" },
  },
];

/**
 * Maps platformer entities to generic GameObject representations.
 */
export function platformerEntitiesToGameObjects(
  level: LevelDefinition,
): GameObject[] {
  const objects: GameObject[] = [];

  // Player
  objects.push({
    height: level.player.height,
    id: level.player.id,
    name: "Player Spawn",
    properties: {
      confidence: level.player.confidence,
      spawnFacing: level.player.spawnFacing,
    },
    type: "player",
    width: level.player.width,
    x: level.player.x,
    y: level.player.y,
  });

  // Platforms
  for (const plat of level.platforms) {
    objects.push({
      height: plat.height,
      id: plat.id,
      name: "Platform",
      properties: {
        confidence: plat.confidence,
        oneWay: plat.oneWay,
      },
      type: "platform",
      width: plat.width,
      x: plat.x,
      y: plat.y,
    });
  }

  // Coins
  for (const coin of level.coins) {
    objects.push({
      height: coin.radius * 2,
      id: coin.id,
      name: "Coin",
      properties: {
        confidence: coin.confidence,
      },
      radius: coin.radius,
      type: "coin",
      width: coin.radius * 2,
      x: coin.x,
      y: coin.y,
    });
  }

  // Enemies
  for (const enemy of level.enemies) {
    objects.push({
      height: enemy.height,
      id: enemy.id,
      name: "Enemy",
      properties: {
        confidence: enemy.confidence,
        patrolDistance: enemy.patrolDistance,
      },
      type: "enemy",
      width: enemy.width,
      x: enemy.x,
      y: enemy.y,
    });
  }

  // Spikes
  for (const spike of level.spikes) {
    objects.push({
      height: spike.height,
      id: spike.id,
      name: "Spike Hazard",
      properties: {
        confidence: spike.confidence,
        direction: spike.direction,
      },
      type: "spike",
      width: spike.width,
      x: spike.x,
      y: spike.y,
    });
  }

  // Goal
  if (level.goal) {
    objects.push({
      height: level.goal.height,
      id: level.goal.id,
      name: level.goal.label || "Goal Flag",
      properties: {
        confidence: level.goal.confidence,
        label: level.goal.label,
      },
      type: "goal",
      width: level.goal.width,
      x: level.goal.x,
      y: level.goal.y,
    });
  }

  return objects;
}

/**
 * Transforms a Phase 5 LevelDefinition into a universal PlatformerGameDefinition.
 */
export function levelDefinitionToGameDefinition(
  level: LevelDefinition,
  id = `game_${level.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "level"}`,
): PlatformerGameDefinition {
  const objects = platformerEntitiesToGameObjects(level);

  return {
    assets: [],
    capabilities: [
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
    engineConfig: {
      backgroundColor: "#020617",
      engineId: "universal-2d-engine",
      fps: 60,
      options: {
        debugPhysics: false,
        gravityY: level.physics?.gravityY ?? 1400,
      },
      renderer: "auto",
    },
    gameType: "platformer",
    id,
    metadata: level.metadata
      ? {
          createdAt: level.metadata.createdAt,
          description: level.metadata.description,
          generatedAt: level.metadata.generatedAt,
          source: level.metadata.source,
        }
      : undefined,
    name: level.name,
    objects,
    rules: DEFAULT_PLATFORMER_RULES,
    settings: {
      audioEnabled: true,
      debugPhysics: false,
      styleId: "clean",
      themeId: "classic",
    },
    typePayload: {
      coins: level.coins,
      enemies: level.enemies,
      gameMode: level.gameMode,
      goal: level.goal,
      physics: level.physics,
      platforms: level.platforms,
      player: level.player,
      spikes: level.spikes,
      world: level.world,
    },
    version: 1,
    viewport: {
      height: level.viewport?.height ?? 720,
      width: level.viewport?.width ?? 1280,
    },
  };
}

/**
 * Extracts or reconstructs a canonical Phase 5 LevelDefinition from a PlatformerGameDefinition.
 */
export function gameDefinitionToLevelDefinition(
  gameDef: PlatformerGameDefinition,
): LevelDefinition {
  // 1. If typePayload is intact, use it directly for 100% precision
  if (gameDef.typePayload) {
    const payload = gameDef.typePayload;
    return levelSchema.parse({
      coins: payload.coins ?? [],
      enemies: payload.enemies ?? [],
      gameMode: payload.gameMode ?? "single-screen",
      goal: payload.goal ?? null,
      metadata: {
        createdAt: gameDef.metadata?.createdAt,
        description: gameDef.metadata?.description,
        generatedAt: gameDef.metadata?.generatedAt,
        source: gameDef.metadata?.source ?? "manual",
      },
      name: gameDef.name,
      physics: payload.physics ?? {
        gravityY: 1400,
        jumpVelocity: -520,
      },
      platforms: payload.platforms ?? [],
      player: payload.player,
      spikes: payload.spikes ?? [],
      version: 1,
      viewport: {
        height: gameDef.viewport.height,
        width: gameDef.viewport.width,
      },
      world: payload.world,
    });
  }

  // 2. Fallback: reconstruct from generic objects if typePayload was stripped
  let player: PlayerEntity = {
    height: 48,
    id: "player_start",
    spawnFacing: "right",
    width: 32,
    x: 96,
    y: 384,
  };
  const platforms: PlatformEntity[] = [];
  const coins: CoinEntity[] = [];
  const enemies: EnemyEntity[] = [];
  const spikes: SpikeEntity[] = [];
  let goal: GoalEntity | null = null;

  for (const obj of gameDef.objects) {
    switch (obj.type) {
      case "player":
        player = {
          confidence: (obj.properties?.confidence as number) ?? undefined,
          height: obj.height ?? 48,
          id: obj.id,
          spawnFacing:
            (obj.properties?.spawnFacing as "left" | "right") ?? "right",
          width: obj.width ?? 32,
          x: obj.x,
          y: obj.y,
        };
        break;
      case "platform":
        platforms.push({
          confidence: (obj.properties?.confidence as number) ?? undefined,
          height: obj.height ?? 32,
          id: obj.id,
          oneWay: Boolean(obj.properties?.oneWay),
          width: obj.width ?? 120,
          x: obj.x,
          y: obj.y,
        });
        break;
      case "coin":
        coins.push({
          confidence: (obj.properties?.confidence as number) ?? undefined,
          id: obj.id,
          radius: obj.radius ?? (obj.width ? Math.round(obj.width / 2) : 12),
          x: obj.x,
          y: obj.y,
        });
        break;
      case "enemy":
        enemies.push({
          confidence: (obj.properties?.confidence as number) ?? undefined,
          height: obj.height ?? 36,
          id: obj.id,
          patrolDistance: (obj.properties?.patrolDistance as number) ?? 0,
          width: obj.width ?? 32,
          x: obj.x,
          y: obj.y,
        });
        break;
      case "spike":
        spikes.push({
          confidence: (obj.properties?.confidence as number) ?? undefined,
          direction:
            (obj.properties?.direction as "down" | "left" | "right" | "up") ??
            "up",
          height: obj.height ?? 20,
          id: obj.id,
          width: obj.width ?? 48,
          x: obj.x,
          y: obj.y,
        });
        break;
      case "goal":
        goal = {
          confidence: (obj.properties?.confidence as number) ?? undefined,
          height: obj.height ?? 64,
          id: obj.id,
          label: (obj.properties?.label as string) ?? obj.name ?? "Goal",
          width: obj.width ?? 44,
          x: obj.x,
          y: obj.y,
        };
        break;
    }
  }

  const gravityY =
    (gameDef.engineConfig?.options?.gravityY as number) ?? 1400;

  return levelSchema.parse({
    coins,
    enemies,
    gameMode: "single-screen",
    goal,
    metadata: {
      createdAt: gameDef.metadata?.createdAt,
      description: gameDef.metadata?.description,
      generatedAt: gameDef.metadata?.generatedAt,
      source: gameDef.metadata?.source ?? "manual",
    },
    name: gameDef.name,
    physics: {
      gravityY,
      jumpVelocity: -520,
    },
    platforms,
    player,
    spikes,
    version: 1,
    viewport: {
      height: gameDef.viewport.height,
      width: gameDef.viewport.width,
    },
    world: {
      height: gameDef.viewport.height,
      width: gameDef.viewport.width,
    },
  });
}

/**
 * Type predicate to check if an object is a PlatformerGameDefinition.
 */
export function isPlatformerGameDefinition(
  def: unknown,
): def is PlatformerGameDefinition {
  if (!def || typeof def !== "object") return false;
  const candidate = def as Partial<PlatformerGameDefinition>;
  return candidate.gameType === "platformer" && typeof candidate.name === "string";
}

/**
 * Type predicate to check if an object is an existing Phase 5 LevelDefinition.
 */
export function isLevelDefinition(def: unknown): def is LevelDefinition {
  if (!def || typeof def !== "object") return false;
  const candidate = def as Partial<LevelDefinition>;
  return (
    Array.isArray(candidate.platforms) &&
    typeof candidate.player === "object" &&
    candidate.player !== null &&
    typeof candidate.name === "string"
  );
}

/**
 * Transparent adapter: accepts either an existing LevelDefinition or GameDefinition
 * and ensures a canonical GenericGameDefinition is returned.
 */
export function ensureGameDefinition(
  input: LevelDefinition | PlatformerGameDefinition,
  id?: string,
): PlatformerGameDefinition {
  if (isPlatformerGameDefinition(input)) {
    return input;
  }
  return levelDefinitionToGameDefinition(input, id);
}
