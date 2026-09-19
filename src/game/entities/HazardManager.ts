import Phaser from "phaser";
import type { RuntimeSpike } from "@/game/levels/level-loader";
import {
  COLLISION_CATEGORIES,
  COLLISION_LABELS,
} from "@/game/physics/physics-config";
import type { ResolvedThemeConfig } from "@/game/themes/theme-types";

interface SpikeEntry {
  body: MatterJS.BodyType;
  graphics: Phaser.GameObjects.Graphics;
  spikeDef: RuntimeSpike;
}

export class HazardManager {
  private scene: Phaser.Scene;
  private spikes: SpikeEntry[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public spawnHazards(spikes: RuntimeSpike[], theme: ResolvedThemeConfig): void {
    this.destroy();

    const { borderWidth } = theme.style;
    const { border, fill } = theme.spike;

    for (const spikeDef of spikes) {
      const { centerX, centerY, direction, height, width } = spikeDef;

      // 1. Static Sensor Matter Body
      const body = this.scene.matter.add.rectangle(
        centerX,
        centerY,
        width,
        height,
        {
          collisionFilter: {
            category: COLLISION_CATEGORIES.HAZARD,
            mask: COLLISION_CATEGORIES.PLAYER,
          },
          isSensor: true,
          isStatic: true,
          label: COLLISION_LABELS.HAZARD,
        },
      );

      // 2. Visual Graphics (triangular teeth)
      const gfx = this.scene.add.graphics();
      gfx.setPosition(centerX, centerY);

      const halfW = width / 2;
      const halfH = height / 2;
      const numTeeth = Math.max(1, Math.round(width / 16));
      const toothW = width / numTeeth;

      gfx.fillStyle(fill, 1);
      gfx.lineStyle(borderWidth, border, 1);

      if (direction === "up") {
        for (let i = 0; i < numTeeth; i++) {
          const x1 = -halfW + i * toothW;
          const x2 = x1 + toothW;
          const xMid = x1 + toothW / 2;
          const yBase = halfH;
          const yTip = -halfH;

          gfx.beginPath();
          gfx.moveTo(x1, yBase);
          gfx.lineTo(xMid, yTip);
          gfx.lineTo(x2, yBase);
          gfx.closePath();
          gfx.fillPath();
          gfx.strokePath();
        }
      } else if (direction === "down") {
        for (let i = 0; i < numTeeth; i++) {
          const x1 = -halfW + i * toothW;
          const x2 = x1 + toothW;
          const xMid = x1 + toothW / 2;
          const yBase = -halfH;
          const yTip = halfH;

          gfx.beginPath();
          gfx.moveTo(x1, yBase);
          gfx.lineTo(xMid, yTip);
          gfx.lineTo(x2, yBase);
          gfx.closePath();
          gfx.fillPath();
          gfx.strokePath();
        }
      } else {
        // Left or Right generic triangle block
        gfx.beginPath();
        gfx.moveTo(-halfW, halfH);
        gfx.lineTo(0, -halfH);
        gfx.lineTo(halfW, halfH);
        gfx.closePath();
        gfx.fillPath();
        gfx.strokePath();
      }

      this.spikes.push({
        body,
        graphics: gfx,
        spikeDef,
      });
    }
  }

  public hasBody(bodyId: number): boolean {
    return this.spikes.some((s) => s.body.id === bodyId);
  }

  public destroy(): void {
    for (const spike of this.spikes) {
      if (this.scene.matter && this.scene.matter.world) {
        this.scene.matter.world.remove(spike.body);
      }
      spike.graphics.destroy();
    }
    this.spikes = [];
  }
}
