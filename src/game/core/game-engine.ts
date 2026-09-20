/**
 * Universal 2D Game Architecture - Generic Game Engine Interface
 *
 * Defines the standard lifecycle contract for any 2D game engine in DRAW2GAME,
 * completely decoupled from specific rendering technologies (Phaser, Canvas, WebGL).
 */

import type { GameDefinition, GameSettings, GameType } from "./game-definition";
import type { GameStateManager } from "@/game/systems/game-state-manager";

export interface GameEngineInitOptions {
  container: HTMLElement;
  gameStateManager?: GameStateManager;
  settings?: GameSettings;
}

export interface GameEngine<TDef extends GameDefinition = GameDefinition> {
  /**
   * Cleans up all DOM nodes, listeners, scenes, and allocated memory.
   */
  destroy(): void;

  /**
   * Unique engine identifier (e.g. "platformer-phaser-matter").
   */
  readonly engineId: string;

  /**
   * The game genre/type this engine executes.
   */
  readonly gameType: GameType;

  /**
   * Initializes display targets and runtime services.
   */
  initialize(options: GameEngineInitOptions): Promise<void> | void;

  /**
   * Whether the engine display target is mounted and ready.
   */
  readonly isInitialized: boolean;

  /**
   * Whether the game loop is actively running (not paused or stopped).
   */
  readonly isRunning: boolean;

  /**
   * Loads or replaces the active game definition into runtime structures.
   */
  load(definition: TDef): Promise<void> | void;

  /**
   * Pauses runtime physics, animations, and game time.
   */
  pause(): void;

  /**
   * Restarts the current level/match from the beginning.
   */
  restart(): void;

  /**
   * Resumes gameplay from a paused state.
   */
  resume(): void;

  /**
   * Begins or resumes the game loop and user input.
   */
  start(): void;

  /**
   * Optional tick update hook for manual game loops.
   */
  update?(time: number, delta: number): void;
}
