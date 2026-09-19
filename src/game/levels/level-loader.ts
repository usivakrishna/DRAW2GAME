import type { LevelDefinition } from "@/json/level-schema";
import { scaleGravityY, scaleJumpVelocity } from "@/game/physics/physics-config";

export interface RuntimePlayer {
  centerX: number;
  centerY: number;
  confidence?: number | undefined;
  height: number;
  id: string;
  spawnFacing: "left" | "right";
  width: number;
}

export interface RuntimePlatform {
  centerX: number;
  centerY: number;
  confidence?: number | undefined;
  height: number;
  id: string;
  oneWay: boolean;
  width: number;
}

export interface RuntimeCoin {
  centerX: number;
  centerY: number;
  confidence?: number | undefined;
  id: string;
  radius: number;
}

export interface RuntimeEnemy {
  centerX: number;
  centerY: number;
  confidence?: number | undefined;
  height: number;
  id: string;
  patrolDistance: number;
  width: number;
}

export interface RuntimeSpike {
  centerX: number;
  centerY: number;
  confidence?: number | undefined;
  direction: "down" | "left" | "right" | "up";
  height: number;
  id: string;
  width: number;
}

export interface RuntimeGoal {
  centerX: number;
  centerY: number;
  confidence?: number | undefined;
  height: number;
  id: string;
  label: string;
  width: number;
}

export interface RuntimeLevelData {
  coins: RuntimeCoin[];
  enemies: RuntimeEnemy[];
  gameMode: "side-scrolling" | "single-screen";
  goal: RuntimeGoal | null;
  gravityY: number;
  jumpVelocity: number;
  name: string;
  platforms: RuntimePlatform[];
  player: RuntimePlayer;
  spikes: RuntimeSpike[];
  viewport: { height: number; width: number };
  world: { height: number; width: number };
}

/**
 * Loads and transforms a canonical Phase 5 LevelDefinition into runtime data
 * with center coordinates calculated for Matter.js bodies.
 */
export function loadRuntimeLevel(level: LevelDefinition): RuntimeLevelData {
  const isSideScrolling = level.gameMode === "side-scrolling";
  const viewportWidth = level.viewport?.width ?? 1280;
  const viewportHeight = level.viewport?.height ?? 720;

  const worldWidth =
    level.world?.width ?? (isSideScrolling ? 2560 : viewportWidth);
  const worldHeight = level.world?.height ?? viewportHeight;

  // Player center
  const player = {
    centerX: level.player.x + Math.round(level.player.width / 2),
    centerY: level.player.y + Math.round(level.player.height / 2),
    confidence: level.player.confidence,
    height: level.player.height,
    id: level.player.id,
    spawnFacing: level.player.spawnFacing,
    width: level.player.width,
  };

  // Platforms center
  const platforms: RuntimePlatform[] = level.platforms.map((p) => ({
    centerX: p.x + Math.round(p.width / 2),
    centerY: p.y + Math.round(p.height / 2),
    confidence: p.confidence,
    height: p.height,
    id: p.id,
    oneWay: p.oneWay,
    width: p.width,
  }));

  // Coins (LevelDefinition already stores center x, y)
  const coins: RuntimeCoin[] = level.coins.map((c) => ({
    centerX: c.x,
    centerY: c.y,
    confidence: c.confidence,
    id: c.id,
    radius: c.radius,
  }));

  // Enemies center
  const enemies: RuntimeEnemy[] = level.enemies.map((e) => ({
    centerX: e.x + Math.round(e.width / 2),
    centerY: e.y + Math.round(e.height / 2),
    confidence: e.confidence,
    height: e.height,
    id: e.id,
    patrolDistance: e.patrolDistance,
    width: e.width,
  }));

  // Spikes center
  const spikes: RuntimeSpike[] = level.spikes.map((s) => ({
    centerX: s.x + Math.round(s.width / 2),
    centerY: s.y + Math.round(s.height / 2),
    confidence: s.confidence,
    direction: s.direction,
    height: s.height,
    id: s.id,
    width: s.width,
  }));

  // Goal center
  const goal: RuntimeGoal | null = level.goal
    ? {
        centerX: level.goal.x + Math.round(level.goal.width / 2),
        centerY: level.goal.y + Math.round(level.goal.height / 2),
        confidence: level.goal.confidence,
        height: level.goal.height,
        id: level.goal.id,
        label: level.goal.label,
        width: level.goal.width,
      }
    : null;

  return {
    coins,
    enemies,
    gameMode: level.gameMode,
    goal,
    gravityY: scaleGravityY(level.physics?.gravityY),
    jumpVelocity: scaleJumpVelocity(level.physics?.jumpVelocity),
    name: level.name,
    platforms,
    player,
    spikes,
    viewport: {
      height: viewportHeight,
      width: viewportWidth,
    },
    world: {
      height: worldHeight,
      width: worldWidth,
    },
  };
}
