import Phaser from "phaser";
import type { RuntimeEnemy } from "@/game/levels/level-loader";
import {
  COLLISION_CATEGORIES,
  COLLISION_LABELS,
  ENEMY_PHYSICS,
} from "@/game/physics/physics-config";
import type { ResolvedThemeConfig } from "@/game/themes/theme-types";

interface EnemyEntry {
  body: MatterJS.BodyType;
  direction: 1 | -1;
  enemyDef: RuntimeEnemy;
  graphics: Phaser.GameObjects.Graphics;
  maxDistance: number;
  startX: number;
}

export class EnemyManager {
  private scene: Phaser.Scene;
  private enemies: EnemyEntry[] = [];
  private theme: ResolvedThemeConfig | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public spawnEnemies(
    enemies: RuntimeEnemy[],
    theme: ResolvedThemeConfig,
  ): void {
    this.destroy();
    this.theme = theme;

    const { borderWidth, cornerRadius } = theme.style;
    const { aura, border, eyeColor, fill } = theme.enemy;

    for (const enemyDef of enemies) {
      const { centerX, centerY, height, patrolDistance, width } = enemyDef;
      const maxDistance = patrolDistance > 0 ? patrolDistance : 80;

      // 1. Matter body with fixed rotation
      const body = this.scene.matter.add.rectangle(
        centerX,
        centerY,
        width,
        height,
        {
          chamfer: { radius: cornerRadius },
          collisionFilter: {
            category: COLLISION_CATEGORIES.ENEMY,
            mask:
              COLLISION_CATEGORIES.PLATFORM |
              COLLISION_CATEGORIES.PLAYER |
              COLLISION_CATEGORIES.BOUNDARY,
          },
          friction: ENEMY_PHYSICS.FRICTION,
          frictionAir: ENEMY_PHYSICS.FRICTION_AIR,
          label: COLLISION_LABELS.ENEMY,
        },
      );
      this.scene.matter.body.setInertia(body, Infinity);
      (body as { wrapBounds?: null }).wrapBounds = null;

      // 2. Visual graphics
      const gfx = this.scene.add.graphics();
      gfx.setPosition(centerX, centerY);

      const halfW = width / 2;
      const halfH = height / 2;

      // Outer aura if any
      if (aura && theme.style.glowStrength > 0) {
        gfx.fillStyle(aura, 0.35);
        gfx.fillRoundedRect(
          -halfW - 3,
          -halfH - 3,
          width + 6,
          height + 6,
          cornerRadius + 2,
        );
      }

      // Base body fill
      gfx.fillStyle(fill, 1);
      gfx.fillRoundedRect(-halfW, -halfH, width, height, cornerRadius);

      // Border outline
      gfx.lineStyle(borderWidth, border, 1);
      gfx.strokeRoundedRect(-halfW, -halfH, width, height, cornerRadius);

      // Menacing eyes
      const eyeR = Math.max(2, Math.round(Math.min(width, height) * 0.12));
      gfx.fillStyle(eyeColor ?? 0xffffff, 1);
      gfx.fillCircle(-halfW * 0.3, -halfH * 0.2, eyeR);
      gfx.fillCircle(halfW * 0.3, -halfH * 0.2, eyeR);

      // Slit pupils
      gfx.fillStyle(0x000000, 1);
      gfx.fillRect(-halfW * 0.3 - 1, -halfH * 0.2 - eyeR + 1, 2, eyeR * 2 - 2);
      gfx.fillRect(halfW * 0.3 - 1, -halfH * 0.2 - eyeR + 1, 2, eyeR * 2 - 2);

      this.enemies.push({
        body,
        direction: 1,
        enemyDef,
        graphics: gfx,
        maxDistance,
        startX: centerX,
      });
    }
  }

  public update(): void {
    for (const enemy of this.enemies) {
      const { body, direction, graphics, maxDistance, startX } = enemy;

      // Sync visual position
      graphics.setPosition(body.position.x, body.position.y);

      // Reverse direction if exceeded patrol limit
      const traveled = body.position.x - startX;
      if (direction === 1 && traveled >= maxDistance) {
        enemy.direction = -1;
      } else if (direction === -1 && traveled <= -maxDistance) {
        enemy.direction = 1;
      }

      // Apply horizontal speed
      this.scene.matter.setVelocityX(
        body,
        enemy.direction * ENEMY_PHYSICS.DEFAULT_SPEED,
      );
    }
  }

  public hasBody(bodyId: number): boolean {
    return this.enemies.some((e) => e.body.id === bodyId);
  }

  public destroy(): void {
    for (const enemy of this.enemies) {
      if (this.scene.matter && this.scene.matter.world) {
        this.scene.matter.world.remove(enemy.body);
      }
      enemy.graphics.destroy();
    }
    this.enemies = [];
  }
}
