/**
 * Universal 2D Game Architecture - Platformer Engine Adapter
 *
 * Implements the generic GameEngine contract for the platformer genre,
 * wrapping Phaser 3 + Matter.js runtime execution seamlessly.
 */

import type { GameEngine, GameEngineInitOptions } from "./game-engine";
import {
  gameDefinitionToLevelDefinition,
  type PlatformerGameDefinition,
} from "./platformer-definition";
import { loadRuntimeLevel, type RuntimeLevelData } from "@/game/levels/level-loader";
import type { CreateGameOptions, PhaserGameBridge } from "@/game/PhaserGameBridge";
import { GameStateManager } from "@/game/systems/game-state-manager";
import type { StyleId, ThemeId } from "@/game/themes/theme-types";

export type BridgeFactory = (options: CreateGameOptions) => PhaserGameBridge;

export class PlatformerEngine
  implements GameEngine<PlatformerGameDefinition>
{
  public readonly engineId = "platformer-phaser-matter";
  public readonly gameType = "platformer" as const;

  private bridge: PhaserGameBridge | null = null;
  private bridgeFactory?: BridgeFactory | undefined;
  private container: HTMLElement | null = null;
  private currentDefinition: PlatformerGameDefinition | null = null;
  private gameStateManager: GameStateManager | null = null;
  private _isInitialized = false;
  private _isRunning = false;
  private currentStyleId: StyleId = "clean";
  private currentThemeId: ThemeId = "classic";

  constructor(bridgeFactory?: BridgeFactory | undefined) {
    this.bridgeFactory = bridgeFactory;
  }

  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  public get isRunning(): boolean {
    return this._isRunning;
  }

  public initialize(options: GameEngineInitOptions): void {
    this.container = options.container;
    this.gameStateManager =
      options.gameStateManager ?? new GameStateManager(0);

    if (options.settings?.themeId) {
      this.currentThemeId = options.settings.themeId as ThemeId;
    }
    if (options.settings?.styleId) {
      this.currentStyleId = options.settings.styleId as StyleId;
    }

    this._isInitialized = true;
  }

  public async load(definition: PlatformerGameDefinition): Promise<void> {
    this.currentDefinition = definition;

    if (!this.container) {
      throw new Error(
        "PlatformerEngine must be initialized with a container before loading a level.",
      );
    }

    // Convert to canonical level definition and load runtime data
    const levelDefinition = gameDefinitionToLevelDefinition(definition);
    const runtimeLevel: RuntimeLevelData = loadRuntimeLevel(levelDefinition);

    // If no gameStateManager exists yet, create one sized for the coins
    if (!this.gameStateManager) {
      this.gameStateManager = new GameStateManager(runtimeLevel.coins.length);
    }

    // Clean up previous bridge instance if reloading
    if (this.bridge) {
      this.bridge.destroy();
      this.bridge = null;
    }

    // Extract theme/style from definition settings if specified
    if (definition.settings.themeId) {
      this.currentThemeId = definition.settings.themeId as ThemeId;
    }
    if (definition.settings.styleId) {
      this.currentStyleId = definition.settings.styleId as StyleId;
    }

    const bridgeOptions: CreateGameOptions = {
      container: this.container,
      gameStateManager: this.gameStateManager,
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

    this._isRunning = true;
  }

  public start(): void {
    if (!this.bridge && this.currentDefinition) {
      void this.load(this.currentDefinition);
    }
    this._isRunning = true;
  }

  public pause(): void {
    if (this.gameStateManager) {
      this.gameStateManager.pause();
    }
    this._isRunning = false;
  }

  public resume(): void {
    if (this.gameStateManager) {
      this.gameStateManager.resume();
    }
    this._isRunning = true;
  }

  public restart(): void {
    if (this.bridge) {
      this.bridge.restart();
    } else if (this.gameStateManager) {
      this.gameStateManager.restart();
    }
  }

  public setTheme(themeId: ThemeId, styleId?: StyleId): void {
    this.currentThemeId = themeId;
    if (styleId) {
      this.currentStyleId = styleId;
    }
    if (this.bridge) {
      this.bridge.setTheme(this.currentThemeId, this.currentStyleId);
    }
  }

  public getBridge(): PhaserGameBridge | null {
    return this.bridge;
  }

  public destroy(): void {
    if (this.bridge) {
      this.bridge.destroy();
      this.bridge = null;
    }
    this.container = null;
    this.currentDefinition = null;
    this.gameStateManager = null;
    this._isInitialized = false;
    this._isRunning = false;
  }
}
