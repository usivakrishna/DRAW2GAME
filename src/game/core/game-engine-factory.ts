/**
 * DRAW2GAME — Universal Game Engine Architecture
 * Universal Game Engine Factory & Resolver
 *
 * Provides a universal runtime resolver for instantiating UniversalGameEngine.
 * There are NO game-specific engine classes. A single UniversalGameEngine
 * runs all supported games (platformer, chess, and future extension games)
 * driven entirely by the GameDefinition's capabilities, rules, and data.
 */

import {
  EXTENSION_GAME_TYPES,
  type ExtensionGameType,
  type GameDefinition,
  type GameType,
  isSupportedGameType,
} from "./game-definition";
import {
  createUniversalGameEngine,
  UniversalGameEngine,
} from "@/game/runtime/universal-game-engine";

export type EngineFactorySuccess = {
  engine: UniversalGameEngine;
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

export type EngineBuilder = () => UniversalGameEngine;

export { createUniversalGameEngine };

export class GameEngineFactory {
  private static customRegistry = new Map<string, EngineBuilder>();

  /**
   * Registers a custom runtime builder (e.g. for testing or custom capability sets).
   */
  public static registerEngine(gameType: string, builder: EngineBuilder): void {
    this.customRegistry.set(gameType, builder);
  }

  public static unregisterEngine(gameType: string): void {
    this.customRegistry.delete(gameType);
  }

  public static clearCustomEngines(): void {
    this.customRegistry.clear();
  }

  /**
   * Creates or resolves a UniversalGameEngine for the given GameDefinition.
   * Runtime systems are activated dynamically based on the definition's capabilities.
   */
  public static createEngineForDefinition(definition: GameDefinition): UniversalGameEngine {
    return createUniversalGameEngine(definition);
  }

  /**
   * Resolves a UniversalGameEngine for the given game type.
   * Returns a universal runtime instance for supported game types ("platformer", "chess").
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

    // 2. Supported game types run on UniversalGameEngine
    if (isSupportedGameType(gameType)) {
      return {
        engine: new UniversalGameEngine(),
        gameType,
        success: true,
      };
    }

    // 3. Known extension types (rule / profile definitions in progress)
    if (
      (EXTENSION_GAME_TYPES as readonly string[]).includes(
        gameType as ExtensionGameType,
      )
    ) {
      return {
        error: `Game definition and rules for "${gameType}" are an architecture extension point reserved for future phases.`,
        isExtensionPoint: true,
        requestedType: gameType,
        success: false,
      };
    }

    // 4. Unknown game type
    return {
      error: `Unsupported game type: "${gameType}". Supported game types are "platformer", "chess".`,
      isExtensionPoint: false,
      requestedType: gameType,
      success: false,
    };
  }

  /**
   * Helper that throws if the engine cannot be created, otherwise returns the UniversalGameEngine.
   */
  public static createEngineOrThrow(gameType: GameType | string): UniversalGameEngine {
    const result = this.createEngine(gameType);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.engine;
  }

  /**
   * Lists all game types that currently have active support in the universal runtime.
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
