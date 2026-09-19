import Phaser from "phaser";
import type { RuntimeCoin } from "@/game/levels/level-loader";
import {
  COLLISION_CATEGORIES,
  COLLISION_LABELS,
} from "@/game/physics/physics-config";
import type { ResolvedThemeConfig } from "@/game/themes/theme-types";

interface CoinEntry {
  body: MatterJS.BodyType;
  coinDef: RuntimeCoin;
  collected: boolean;
  graphics: Phaser.GameObjects.Graphics;
  tween?: Phaser.Tweens.Tween;
}

export class CoinManager {
  private scene: Phaser.Scene;
  private coinMap = new Map<number, CoinEntry>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public spawnCoins(coins: RuntimeCoin[], theme: ResolvedThemeConfig): void {
    this.destroy();

    const { borderWidth } = theme.style;
    const { aura, border, fill, shine } = theme.coin;

    for (const coin of coins) {
      const { centerX, centerY, radius } = coin;

      // 1. Static Sensor Matter Body
      const body = this.scene.matter.add.circle(centerX, centerY, radius, {
        collisionFilter: {
          category: COLLISION_CATEGORIES.COIN,
          mask: COLLISION_CATEGORIES.PLAYER,
        },
        isSensor: true,
        isStatic: true,
        label: COLLISION_LABELS.COIN,
      });

      // 2. Render coin visual
      const gfx = this.scene.add.graphics();
      gfx.setPosition(centerX, centerY);

      // Outer glow aura if present
      if (aura && theme.style.glowStrength > 0) {
        gfx.fillStyle(aura, 0.35);
        gfx.fillCircle(0, 0, radius + 4);
      }

      // Coin base fill
      gfx.fillStyle(fill, 1);
      gfx.fillCircle(0, 0, radius);

      // Coin border
      gfx.lineStyle(borderWidth, border, 1);
      gfx.strokeCircle(0, 0, radius);

      // Inner ring / shine highlight
      if (shine && radius >= 6) {
        gfx.fillStyle(shine, 0.7);
        gfx.fillCircle(-radius * 0.25, -radius * 0.25, Math.max(1, radius * 0.3));
      }

      // Floating / breathing animation
      const tween = this.scene.tweens.add({
        duration: 1200 + Math.random() * 400,
        ease: "Sine.easeInOut",
        repeat: -1,
        targets: gfx,
        y: centerY - 4,
        yoyo: true,
      });

      this.coinMap.set(body.id, {
        body,
        coinDef: coin,
        collected: false,
        graphics: gfx,
        tween,
      });
    }
  }

  /**
   * Collects coin by Matter body id. Returns true if first collection.
   */
  public collectCoin(bodyId: number): boolean {
    const entry = this.coinMap.get(bodyId);
    if (!entry || entry.collected) return false;

    entry.collected = true;

    // Remove physics body so it cannot trigger again
    if (this.scene.matter && this.scene.matter.world) {
      this.scene.matter.world.remove(entry.body);
    }

    if (entry.tween) {
      entry.tween.stop();
    }

    // Collection sparkle animation
    this.scene.tweens.add({
      alpha: 0,
      duration: 250,
      ease: "Power2",
      onComplete: () => {
        entry.graphics.destroy();
        this.coinMap.delete(bodyId);
      },
      scaleX: 1.6,
      scaleY: 1.6,
      targets: entry.graphics,
      y: entry.graphics.y - 15,
    });

    return true;
  }

  public getRemainingCount(): number {
    let count = 0;
    for (const entry of this.coinMap.values()) {
      if (!entry.collected) count++;
    }
    return count;
  }

  public destroy(): void {
    for (const entry of this.coinMap.values()) {
      if (this.scene.matter && this.scene.matter.world) {
        this.scene.matter.world.remove(entry.body);
      }
      if (entry.tween) {
        entry.tween.stop();
      }
      entry.graphics.destroy();
    }
    this.coinMap.clear();
  }
}
