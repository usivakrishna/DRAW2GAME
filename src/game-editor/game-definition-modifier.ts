/**
 * DRAW2GAME — Phase 15: Universal Game Editor & Regeneration
 * GameDefinition Modifier & Transformation Engine
 *
 * Implements pure, immutable operations to modify generic GameDefinitions:
 * - Update object position, size, properties, and name
 * - Add new game objects
 * - Remove existing game objects with safety invariants
 * - Update game settings (theme, style, physics, viewport, world dimensions)
 * - Execute natural language AI edit commands on GameDefinitions
 */

import {
  type GameDefinition,
  type GameObject,
  type GameViewport,
} from "@/game/core/game-definition";
import {
  gameDefinitionToLevelDefinition,
  isPlatformerGameDefinition,
  type PlatformerGameDefinition,
} from "@/game/core/platformer-definition";
import {
  type ChessGameDefinition,
  isChessGameDefinition,
  type ChessPiece,
  coordToSquare,
} from "@/game/chess/chess-definition";
import type { StyleId, ThemeId } from "@/game/themes/theme-types";
import { applyEditCommand } from "./level-modifier";
import type { EditExecutionResult, GameEditCommand } from "./types";

/**
 * Result returned by applyUniversalEditCommand.
 */
export interface GameDefinitionEditResult extends EditExecutionResult {
  updatedDefinition?: GameDefinition | undefined;
}

/**
 * Deep clone helper for GameDefinition.
 */
function cloneDefinition<T extends GameDefinition>(def: T): T {
  return JSON.parse(JSON.stringify(def)) as T;
}

/**
 * Synchronizes typePayload for a platformer GameDefinition after objects array changes.
 */
function syncPlatformerPayload(def: PlatformerGameDefinition): void {
  try {
    const withoutPayload = { ...def, typePayload: undefined };
    const level = gameDefinitionToLevelDefinition(withoutPayload as PlatformerGameDefinition);
    def.typePayload = {
      coins: level.coins,
      enemies: level.enemies,
      gameMode: level.gameMode,
      goal: level.goal,
      physics: level.physics,
      platforms: level.platforms,
      player: level.player,
      spikes: level.spikes,
      world: level.world,
    };
  } catch {
    // If parsing fails during intermediate editing, preserve existing payload
  }
}

/**
 * Synchronizes typePayload for a chess GameDefinition after objects array changes.
 */
function syncChessPayload(def: ChessGameDefinition): void {
  if (!def.typePayload) return;
  const pieces: ChessPiece[] = [];

  for (const obj of def.objects) {
    if (obj.type.startsWith("chess-")) {
      const pieceType = obj.type.replace("chess-", "") as ChessPiece["type"];
      const color = (obj.properties?.color as "white" | "black") ?? "white";
      const col = Math.floor(obj.x / 64);
      const row = Math.floor(obj.y / 64);
      const square = coordToSquare(col, row) ?? (obj.properties?.square as ChessPiece["square"]) ?? "a1";

      pieces.push({
        color,
        hasMoved: Boolean(obj.properties?.hasMoved),
        id: obj.id,
        square,
        type: pieceType,
      });
    }
  }

  def.typePayload.pieces = pieces;
}

/**
 * Updates a single GameObject within a GameDefinition.
 */
export function updateGameObject(
  gameDef: GameDefinition,
  objectId: string,
  changes: Partial<GameObject>,
): GameDefinition {
  const next = cloneDefinition(gameDef);
  const targetIndex = next.objects.findIndex((o) => o.id === objectId);
  if (targetIndex === -1) {
    return next;
  }

  const currentObj = next.objects[targetIndex]!;
  const updatedObj: GameObject = {
    ...currentObj,
    ...changes,
    properties: {
      ...currentObj.properties,
      ...changes.properties,
    },
  };

  next.objects[targetIndex] = updatedObj;

  // Metadata timestamp
  if (!next.metadata) next.metadata = {};
  next.metadata.updatedAt = new Date().toISOString();

  // Synchronize genre-specific payloads
  if (isPlatformerGameDefinition(next)) {
    syncPlatformerPayload(next);
  } else if (isChessGameDefinition(next)) {
    syncChessPayload(next);
  }

  return next;
}

/**
 * Adds a new GameObject to a GameDefinition.
 */
export function addGameObject(
  gameDef: GameDefinition,
  newObject: GameObject,
): GameDefinition {
  const next = cloneDefinition(gameDef);

  // Avoid duplicate IDs
  const existingIdx = next.objects.findIndex((o) => o.id === newObject.id);
  if (existingIdx !== -1) {
    newObject = {
      ...newObject,
      id: `${newObject.id}_${Math.random().toString(36).slice(2, 6)}`,
    };
  }

  next.objects.push(newObject);

  if (!next.metadata) next.metadata = {};
  next.metadata.updatedAt = new Date().toISOString();

  if (isPlatformerGameDefinition(next)) {
    syncPlatformerPayload(next);
  } else if (isChessGameDefinition(next)) {
    syncChessPayload(next);
  }

  return next;
}

/**
 * Removes a GameObject from a GameDefinition with safety checks.
 */
export function removeGameObject(
  gameDef: GameDefinition,
  objectId: string,
): GameDefinition {
  const next = cloneDefinition(gameDef);

  // Safety invariants:
  // Cannot remove player from platformer if it's the only player
  if (next.gameType === "platformer") {
    const obj = next.objects.find((o) => o.id === objectId);
    if (obj && obj.type === "player") {
      const playerCount = next.objects.filter((o) => o.type === "player").length;
      if (playerCount <= 1) {
        throw new Error("Cannot delete player spawn: a playable platformer must have a player spawn.");
      }
    }
  }

  // Cannot remove Kings from Chess
  if (next.gameType === "chess") {
    const obj = next.objects.find((o) => o.id === objectId);
    if (obj && (obj.type === "chess-king" || (obj.name && obj.name.includes("king")))) {
      throw new Error("Cannot delete King piece in chess: both kings are required.");
    }
  }

  next.objects = next.objects.filter((o) => o.id !== objectId);

  if (!next.metadata) next.metadata = {};
  next.metadata.updatedAt = new Date().toISOString();

  if (isPlatformerGameDefinition(next)) {
    syncPlatformerPayload(next);
  } else if (isChessGameDefinition(next)) {
    syncChessPayload(next);
  }

  return next;
}

/**
 * Updates GameDefinition settings, name, viewport, or world dimensions.
 */
export function updateGameSettings(
  gameDef: GameDefinition,
  changes: {
    fps?: number | undefined;
    gravityY?: number | undefined;
    id?: string | undefined;
    jumpVelocity?: number | undefined;
    name?: string | undefined;
    styleId?: string | undefined;
    themeId?: string | undefined;
    title?: string | undefined;
    viewport?: GameViewport | undefined;
    world?: { height: number; width: number } | undefined;
  },
): GameDefinition {
  const next = cloneDefinition(gameDef);

  if (changes.id) {
    next.id = changes.id;
  }

  const effectiveName = changes.name ?? changes.title;
  if (effectiveName !== undefined && effectiveName.trim().length > 0) {
    next.name = effectiveName.trim();
    (next as unknown as Record<string, unknown>).title = next.name;
  }

  if (changes.viewport) {
    next.viewport = { ...changes.viewport };
  }

  if (!next.settings) next.settings = {};
  if (changes.themeId) next.settings.themeId = changes.themeId;
  if (changes.styleId) next.settings.styleId = changes.styleId;

  if (!next.engineConfig) {
    next.engineConfig = { engineId: "universal-2d-engine" };
  }
  if (!next.engineConfig.options) {
    next.engineConfig.options = {};
  }

  if (changes.fps) next.engineConfig.fps = changes.fps;
  if (changes.gravityY !== undefined) {
    next.engineConfig.options.gravityY = changes.gravityY;
  }
  if (changes.jumpVelocity !== undefined) {
    next.engineConfig.options.jumpVelocity = changes.jumpVelocity;
  }

  if (isPlatformerGameDefinition(next) && next.typePayload) {
    if (changes.gravityY !== undefined) {
      next.typePayload.physics.gravityY = changes.gravityY;
    }
    if (changes.jumpVelocity !== undefined) {
      next.typePayload.physics.jumpVelocity = changes.jumpVelocity;
    }
    if (changes.world) {
      next.typePayload.world = { ...changes.world };
    }
  }

  if (!next.metadata) next.metadata = {};
  next.metadata.updatedAt = new Date().toISOString();

  return next;
}

/**
 * Applies a parsed natural language GameEditCommand to a universal GameDefinition.
 */
export function applyUniversalEditCommand(
  currentDef: GameDefinition,
  command: GameEditCommand,
  currentTheme?: ThemeId | undefined,
  currentStyle?: StyleId | undefined,
): GameDefinitionEditResult {
  // 1. If the GameDefinition is a Platformer, utilize the proven platformer invariants
  if (isPlatformerGameDefinition(currentDef)) {
    const levelDef = gameDefinitionToLevelDefinition(currentDef);
    const result = applyEditCommand(
      levelDef,
      command,
      currentTheme ?? (currentDef.settings?.themeId as ThemeId) ?? "classic",
      currentStyle ?? (currentDef.settings?.styleId as StyleId) ?? "clean",
    );

    if (!result.success || !result.updatedLevel) {
      return {
        error: result.error,
        message: result.message,
        success: false,
      };
    }

    // Reconstruct updated PlatformerGameDefinition
    const updatedDef = cloneDefinition(currentDef);
    updatedDef.name = result.updatedLevel.name;
    updatedDef.viewport = {
      height: result.updatedLevel.viewport?.height ?? currentDef.viewport.height,
      width: result.updatedLevel.viewport?.width ?? currentDef.viewport.width,
    };
    if (result.updatedTheme) updatedDef.settings.themeId = result.updatedTheme;
    if (result.updatedStyle) updatedDef.settings.styleId = result.updatedStyle;

    // Convert level entities back to GameObject array
    const newObjects: GameObject[] = [];

    // Player
    newObjects.push({
      height: result.updatedLevel.player.height ?? 48,
      id: result.updatedLevel.player.id || "player",
      name: "Player",
      properties: {
        spawnFacing: result.updatedLevel.player.spawnFacing || "right",
      },
      type: "player",
      width: result.updatedLevel.player.width ?? 32,
      x: result.updatedLevel.player.x,
      y: result.updatedLevel.player.y,
    });

    // Platforms
    for (const p of result.updatedLevel.platforms) {
      newObjects.push({
        height: p.height ?? 32,
        id: p.id,
        name: "Platform",
        properties: { oneWay: p.oneWay },
        type: "platform",
        width: p.width ?? 120,
        x: p.x,
        y: p.y,
      });
    }

    // Coins
    for (const c of result.updatedLevel.coins) {
      newObjects.push({
        id: c.id,
        name: "Coin",
        radius: c.radius ?? 14,
        type: "coin",
        width: (c.radius ?? 14) * 2,
        x: c.x,
        y: c.y,
      });
    }

    // Enemies
    for (const e of result.updatedLevel.enemies) {
      newObjects.push({
        height: e.height ?? 32,
        id: e.id,
        name: "Enemy",
        properties: {
          patrolDistance: e.patrolDistance ?? 120,
          speed: (e as unknown as { speed?: number }).speed ?? 80,
        },
        type: "enemy",
        width: e.width ?? 32,
        x: e.x,
        y: e.y,
      });
    }

    // Spikes
    for (const s of result.updatedLevel.spikes) {
      newObjects.push({
        height: s.height ?? 20,
        id: s.id,
        name: "Spike Hazard",
        properties: { direction: s.direction ?? "up" },
        type: "spike",
        width: s.width ?? 48,
        x: s.x,
        y: s.y,
      });
    }

    // Goal
    if (result.updatedLevel.goal) {
      newObjects.push({
        height: result.updatedLevel.goal.height ?? 64,
        id: result.updatedLevel.goal.id || "goal",
        name: result.updatedLevel.goal.label || "Goal Flag",
        type: "goal",
        width: result.updatedLevel.goal.width ?? 44,
        x: result.updatedLevel.goal.x,
        y: result.updatedLevel.goal.y,
      });
    }

    updatedDef.objects = newObjects;
    syncPlatformerPayload(updatedDef);

    if (!updatedDef.metadata) updatedDef.metadata = {};
    updatedDef.metadata.source = "ai-edit";
    updatedDef.metadata.updatedAt = new Date().toISOString();

    return {
      message: result.message,
      success: true,
      updatedDefinition: updatedDef,
      updatedStyle: result.updatedStyle,
      updatedTheme: result.updatedTheme,
    };
  }

  // 2. Generic edit handling (supports Chess and generic definitions)
  const next = cloneDefinition(currentDef);

  if (command.target === "theme" && command.parameters.theme) {
    next.settings.themeId = command.parameters.theme as string;
    return {
      message: `Theme changed to ${command.parameters.theme}.`,
      success: true,
      updatedDefinition: next,
      updatedTheme: command.parameters.theme as ThemeId,
    };
  }

  if (command.target === "style" && command.parameters.style) {
    next.settings.styleId = command.parameters.style as string;
    return {
      message: `Style changed to ${command.parameters.style}.`,
      success: true,
      updatedDefinition: next,
      updatedStyle: command.parameters.style as StyleId,
    };
  }

  return {
    error: `Command target "${command.target}" is not supported for ${currentDef.gameType} game type.`,
    success: false,
  };
}
