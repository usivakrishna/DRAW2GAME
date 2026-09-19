import Phaser from "phaser";
import type { RuntimeGoal } from "@/game/levels/level-loader";
import {
  COLLISION_CATEGORIES,
  COLLISION_LABELS,
} from "@/game/physics/physics-config";
import type { ResolvedThemeConfig } from "@/game/themes/theme-types";

export class GoalManager {
  private scene: Phaser.Scene;
  private body: MatterJS.BodyType | null = null;
  private container: Phaser.GameObjects.Container | null = null;
  private tween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public spawnGoal(goalDef: RuntimeGoal | null, theme: ResolvedThemeConfig): void {
    this.destroy();
    if (!goalDef) return;

    const { centerX, centerY, height, width } = goalDef;
    const { borderWidth } = theme.style;
    const { aura, border, fill } = theme.goal;

    // 1. Static Sensor Matter Body
    this.body = this.scene.matter.add.rectangle(centerX, centerY, width, height, {
      collisionFilter: {
        category: COLLISION_CATEGORIES.GOAL,
        mask: COLLISION_CATEGORIES.PLAYER,
      },
      isSensor: true,
      isStatic: true,
      label: COLLISION_LABELS.GOAL,
    });

    // 2. Visual Flag / Portal Container
    this.container = this.scene.add.container(centerX, centerY);
    const gfx = this.scene.add.graphics();
    this.container.add(gfx);

    const halfW = width / 2;
    const halfH = height / 2;

    // Outer Aura
    if (aura && theme.style.glowStrength > 0) {
      gfx.fillStyle(aura, 0.35);
      gfx.fillCircle(0, 0, Math.max(halfW, halfH) + 6);
    }

    // Pole
    const poleW = Math.max(4, Math.round(width * 0.1));
    const poleH = height;
    gfx.fillStyle(0x475569, 1);
    gfx.fillRect(-halfW, -halfH, poleW, poleH);

    // Flag Pennant
    const flagW = width * 0.75;
    const flagH = height * 0.45;

    gfx.fillStyle(fill, 1);
    gfx.lineStyle(borderWidth, border, 1);

    gfx.beginPath();
    gfx.moveTo(-halfW + poleW, -halfH);
    gfx.lineTo(-halfW + poleW + flagW, -halfH + flagH / 2);
    gfx.lineTo(-halfW + poleW, -halfH + flagH);
    gfx.closePath();
    gfx.fillPath();
    gfx.strokePath();

    // Goal Base
    const baseW = width * 0.5;
    const baseH = Math.max(6, height * 0.15);
    gfx.fillStyle(0x334155, 1);
    gfx.fillRoundedRect(-halfW - 2, halfH - baseH, baseW, baseH, 2);

    // Gentle pulse animation
    this.tween = this.scene.tweens.add({
      alpha: 0.85,
      duration: 1000,
      ease: "Sine.easeInOut",
      repeat: -1,
      scaleX: 1.05,
      scaleY: 1.05,
      targets: this.container,
      yoyo: true,
    });
  }

  public isGoalBody(bodyId: number): boolean {
    return this.body !== null && this.body.id === bodyId;
  }

  public destroy(): void {
    if (this.body && this.scene.matter && this.scene.matter.world) {
      this.scene.matter.world.remove(this.body);
      this.body = null;
    }
    if (this.tween) {
      this.tween.stop();
      this.tween = null;
    }
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }
}
