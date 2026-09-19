import Phaser from "phaser";
import type { RuntimePlatform } from "@/game/levels/level-loader";
import {
  COLLISION_CATEGORIES,
  COLLISION_LABELS,
} from "@/game/physics/physics-config";
import type { ResolvedThemeConfig } from "@/game/themes/theme-types";

export class PlatformManager {
  private scene: Phaser.Scene;
  private bodies: MatterJS.BodyType[] = [];
  private graphicsList: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public spawnPlatforms(
    platforms: RuntimePlatform[],
    theme: ResolvedThemeConfig,
  ): void {
    this.destroy();

    const { borderWidth, cornerRadius } = theme.style;
    const { border, fill, surfaceFill } = theme.platform;

    for (const plat of platforms) {
      const { centerX, centerY, height, width } = plat;

      // 1. Create static Matter body
      const body = this.scene.matter.add.rectangle(
        centerX,
        centerY,
        width,
        height,
        {
          chamfer: { radius: cornerRadius },
          collisionFilter: {
            category: COLLISION_CATEGORIES.PLATFORM,
            mask:
              COLLISION_CATEGORIES.PLAYER |
              COLLISION_CATEGORIES.GROUND_SENSOR |
              COLLISION_CATEGORIES.ENEMY,
          },
          friction: 0.8,
          isStatic: true,
          label: COLLISION_LABELS.PLATFORM,
        },
      );
      this.bodies.push(body);

      // 2. Render graphics
      const gfx = this.scene.add.graphics();
      const halfW = width / 2;
      const halfH = height / 2;

      // Main platform body
      gfx.fillStyle(fill, 1);
      gfx.fillRoundedRect(
        centerX - halfW,
        centerY - halfH,
        width,
        height,
        cornerRadius,
      );

      // Top surface accent strip (e.g. grass, chrome ledge)
      if (surfaceFill && height >= 10) {
        const stripH = Math.min(8, Math.max(3, Math.round(height * 0.25)));
        gfx.fillStyle(surfaceFill, 1);
        gfx.fillRoundedRect(
          centerX - halfW,
          centerY - halfH,
          width,
          stripH,
          {
            bl: 0,
            br: 0,
            tl: cornerRadius,
            tr: cornerRadius,
          },
        );
      }

      // Border outline
      gfx.lineStyle(borderWidth, border, 1);
      gfx.strokeRoundedRect(
        centerX - halfW,
        centerY - halfH,
        width,
        height,
        cornerRadius,
      );

      this.graphicsList.push(gfx);
    }
  }

  public destroy(): void {
    for (const body of this.bodies) {
      if (this.scene.matter && this.scene.matter.world) {
        this.scene.matter.world.remove(body);
      }
    }
    this.bodies = [];

    for (const gfx of this.graphicsList) {
      gfx.destroy();
    }
    this.graphicsList = [];
  }
}
