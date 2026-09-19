import Phaser from "phaser";
import type { RuntimeLevelData } from "@/game/levels/level-loader";
import { MainGameScene } from "@/game/scenes/MainGameScene";
import type { GameStateManager } from "@/game/systems/game-state-manager";
import { resolveTheme } from "@/game/themes/theme-resolver";
import type { StyleId, ThemeId } from "@/game/themes/theme-types";

export interface CreateGameOptions {
  container: HTMLElement;
  gameStateManager: GameStateManager;
  levelData: RuntimeLevelData;
  styleId?: StyleId;
  themeId?: ThemeId;
}

export class PhaserGameBridge {
  private game: Phaser.Game | null = null;
  private scene: MainGameScene | null = null;
  private levelData: RuntimeLevelData;
  private gameStateManager: GameStateManager;
  private currentThemeId: ThemeId;
  private currentStyleId: StyleId;

  constructor(options: CreateGameOptions) {
    this.levelData = options.levelData;
    this.gameStateManager = options.gameStateManager;
    this.currentThemeId = options.themeId ?? "classic";
    this.currentStyleId = options.styleId ?? "clean";

    const resolvedTheme = resolveTheme(
      this.currentThemeId,
      this.currentStyleId,
    );

    const viewportWidth = options.levelData.viewport.width;
    const viewportHeight = options.levelData.viewport.height;

    const config: Phaser.Types.Core.GameConfig = {
      autoFocus: true,
      backgroundColor: resolvedTheme.background.primary,
      height: viewportHeight,
      parent: options.container,
      physics: {
        default: "matter",
        matter: {
          debug: false,
          gravity: {
            x: 0,
            y: options.levelData.gravityY,
          },
        },
      },
      pixelArt: resolvedTheme.style.pixelated,
      scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH,
        height: viewportHeight,
        mode: Phaser.Scale.FIT,
        parent: options.container,
        width: viewportWidth,
      },
      scene: [],
      type: Phaser.AUTO,
      width: viewportWidth,
    };

    this.game = new Phaser.Game(config);

    // Pass data to scene on start
    this.game.events.once("ready", () => {
      if (!this.game) return;
      this.game.scene.add("MainGameScene", MainGameScene, true, {
        gameStateManager: this.gameStateManager,
        levelData: this.levelData,
        theme: resolvedTheme,
      });
      this.scene = this.game.scene.getScene("MainGameScene") as MainGameScene | null;
    });
  }

  public restart(): void {
    if (this.scene) {
      this.scene.restart();
    }
  }

  public setTheme(themeId: ThemeId, styleId: StyleId = this.currentStyleId): void {
    this.currentThemeId = themeId;
    this.currentStyleId = styleId;
    const resolvedTheme = resolveTheme(themeId, styleId);
    if (this.scene) {
      this.scene.applyTheme(resolvedTheme);
    }
  }

  public destroy(): void {
    if (this.scene) {
      this.scene.destroyScene();
      this.scene = null;
    }
    if (this.game) {
      this.game.destroy(true, false);
      this.game = null;
    }
  }
}
