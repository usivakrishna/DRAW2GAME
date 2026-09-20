/**
 * DRAW2GAME — Universal Game Engine Architecture
 * Physics Subsystem (Phaser 3 + Matter.js)
 *
 * Activated ONLY when a GameDefinition requires physics capabilities.
 * Wraps PhaserGameBridge for 2D rigid-body physics, platformer mechanics,
 * gravity, velocities, and collisions.
 *
 * Games without physics (e.g., Chess, Turn-based puzzles) do NOT activate this system,
 * avoiding unnecessary Matter.js and Canvas overhead.
 */

import { loadRuntimeLevel, type RuntimeLevelData } from "@/game/levels/level-loader";
import type { CreateGameOptions, PhaserGameBridge } from "@/game/PhaserGameBridge";
import type { GameStateManager } from "@/game/systems/game-state-manager";
import type { StyleId, ThemeId } from "@/game/themes/theme-types";
import type { LevelDefinition } from "@/json/level-schema";

export type BridgeFactory = (options: CreateGameOptions) => PhaserGameBridge;

export interface PhysicsSystemOptions {
  bridgeFactory?: BridgeFactory | undefined;
  container: HTMLElement;
  gameStateManager: GameStateManager;
  levelData?: RuntimeLevelData | undefined;
  levelDefinition?: LevelDefinition | undefined;
  styleId?: StyleId | undefined;
  themeId?: ThemeId | undefined;
}

export class PhysicsSystem {
  private _isActive = false;
  private bridge: PhaserGameBridge | null = null;
  private bridgeFactory?: BridgeFactory | undefined;
  private container: HTMLElement | null = null;
  private currentStyleId: StyleId = "clean";
  private currentThemeId: ThemeId = "classic";

  constructor(bridgeFactory?: BridgeFactory | undefined) {
    this.bridgeFactory = bridgeFactory;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public getBridge(): PhaserGameBridge | null {
    return this.bridge;
  }

  /**
   * Initializes and activates the Phaser 3 + Matter.js physics bridge.
   */
  public async activate(options: PhysicsSystemOptions): Promise<void> {
    this.container = options.container;
    this.bridgeFactory = options.bridgeFactory ?? this.bridgeFactory;

    if (options.themeId) this.currentThemeId = options.themeId;
    if (options.styleId) this.currentStyleId = options.styleId;

    // Destroy existing bridge if any
    if (this.bridge) {
      this.bridge.destroy();
      this.bridge = null;
    }

    // Resolve runtime level data
    let runtimeLevel = options.levelData;
    if (!runtimeLevel && options.levelDefinition) {
      runtimeLevel = loadRuntimeLevel(options.levelDefinition);
    }

    if (!runtimeLevel) {
      throw new Error("PhysicsSystem requires LevelDefinition or RuntimeLevelData to activate.");
    }

    const bridgeOptions: CreateGameOptions = {
      container: this.container,
      gameStateManager: options.gameStateManager,
      levelData: runtimeLevel,
      styleId: this.currentStyleId,
      themeId: this.currentThemeId,
    };

    if (this.bridgeFactory) {
      this.bridge = this.bridgeFactory(bridgeOptions);
    } else {
      const { PhaserGameBridge } = await import("@/game/PhaserGameBridge");
      this.bridge = new PhaserGameBridge(bridgeOptions);
    }

    this._isActive = true;
  }

  public pause(): void {
    // GameStateManager handles pause signaling to Phaser scene
  }

  public resume(): void {
    // GameStateManager handles resume signaling to Phaser scene
  }

  public restart(): void {
    if (this.bridge) {
      this.bridge.restart();
    }
  }

  public setTheme(themeId: ThemeId, styleId?: StyleId): void {
    this.currentThemeId = themeId;
    if (styleId) this.currentStyleId = styleId;
    if (this.bridge) {
      this.bridge.setTheme(this.currentThemeId, this.currentStyleId);
    }
  }

  public deactivate(): void {
    if (this.bridge) {
      this.bridge.destroy();
      this.bridge = null;
    }
    this.container = null;
    this._isActive = false;
  }

  public destroy(): void {
    this.deactivate();
  }
}
