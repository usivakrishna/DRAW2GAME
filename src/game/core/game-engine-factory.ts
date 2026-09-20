/**
 * Universal 2D Game Architecture - Game Engine Factory
 *
 * Provides a type-safe registry and factory for resolving and instantiating
 * the appropriate GameEngine implementation based on GameType.
 *
 * Future genres (chess, ludo, pool, carrom, racing, puzzle, shooter, sports)
 * are represented as extension points that explicitly return typed error results
 * rather than silently falling back or fabricating mock implementations.
 */

import {
  EXTENSION_GAME_TYPES,
  type ExtensionGameType,
  type GameType,
} from "./game-definition";
import type { GameEngine } from "./game-engine";
import { PlatformerEngine } from "./platformer-engine";
import { ChessEngine } from "@/game/chess/chess-engine";

export type EngineFactorySuccess = {
  engine: GameEngine;
  gameType: GameType;
  success: true;
};

export type EngineFactoryFailure = {
  error: string;
  isExtensionPoint: boolean;
  requestedType: string;
  success: false;
};

export type EngineFactoryResult = EngineFactorySuccess | EngineFactoryFailure;

export type EngineBuilder = () => GameEngine;

export class GameEngineFactory {
  private static customRegistry = new Map<string, EngineBuilder>();

  /**
   * Registers a custom engine builder for a new or existing GameType.
   * Useful for future plugin and engine additions.
   */
  public static registerEngine(gameType: string, builder: EngineBuilder): void {
    this.customRegistry.set(gameType, builder);
  }

  /**
   * Unregisters a previously registered engine builder.
   */
  public static unregisterEngine(gameType: string): void {
    this.customRegistry.delete(gameType);
  }

  /**
   * Clears custom registered engines (useful for testing).
   */
  public static clearCustomEngines(): void {
    this.customRegistry.clear();
  }

  /**
   * Resolves and instantiates the engine for the given GameType.
   *
   * - "platformer" -> Returns a live PlatformerEngine
   * - extension point types -> Returns a typed failure explaining it is an extension point
   * - unknown types -> Returns a typed failure
   *
   * Never silently falls back to a platformer engine.
   */
  public static createEngine(gameType: GameType | string): EngineFactoryResult {
    // 1. Check custom registry first
    const customBuilder = this.customRegistry.get(gameType);
    if (customBuilder) {
      return {
        engine: customBuilder(),
        gameType: gameType as GameType,
        success: true,
      };
    }

    // 2. Built-in platformer engine
    if (gameType === "platformer") {
      return {
        engine: new PlatformerEngine(),
        gameType: "platformer",
        success: true,
      };
    }

    // 3. Built-in chess engine (Phase 12)
    if (gameType === "chess") {
      return {
        engine: new ChessEngine(),
        gameType: "chess",
        success: true,
      };
    }

    // 4. Known extension types (Phase 11+ extension points)
    if (
      (EXTENSION_GAME_TYPES as readonly string[]).includes(
        gameType as ExtensionGameType,
      )
    ) {
      return {
        error: `Engine for "${gameType}" is not implemented yet. This is an extension point reserved for future phases.`,
        isExtensionPoint: true,
        requestedType: gameType,
        success: false,
      };
    }

    // 5. Unknown game type
    return {
      error: `Unsupported game type: "${gameType}". Supported types are "platformer", "chess".`,
      isExtensionPoint: false,
      requestedType: gameType,
      success: false,
    };
  }

  /**
   * Helper that throws if the engine cannot be created, otherwise returns the engine.
   */
  public static createEngineOrThrow(gameType: GameType | string): GameEngine {
    const result = this.createEngine(gameType);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.engine;
  }

  /**
   * Lists all game types that currently have active engine implementations.
   */
  public static getAvailableGameTypes(): string[] {
    const types = ["platformer", "chess", ...Array.from(this.customRegistry.keys())];
    return Array.from(new Set(types));
  }

  /**
   * Lists all future extension game types recognized by the architecture.
   */
  public static getExtensionGameTypes(): readonly string[] {
    return EXTENSION_GAME_TYPES;
  }
}
