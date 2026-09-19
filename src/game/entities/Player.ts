import Phaser from "phaser";
import type { RuntimePlayer } from "@/game/levels/level-loader";
import {
  COLLISION_CATEGORIES,
  COLLISION_LABELS,
  PLAYER_PHYSICS,
} from "@/game/physics/physics-config";
import type { ResolvedThemeConfig } from "@/game/themes/theme-types";

// Use Phaser's internal Matter bundle to avoid dual-instance prototype conflicts
const Matter = (
  Phaser.Physics.Matter as unknown as { Matter: typeof import("matter-js") }
).Matter;

export interface PlayerControls {
  down: Phaser.Input.Keyboard.Key;
  jumpAlt: Phaser.Input.Keyboard.Key;
  jumpSpace: Phaser.Input.Keyboard.Key;
  keyA: Phaser.Input.Keyboard.Key;
  keyD: Phaser.Input.Keyboard.Key;
  keyS: Phaser.Input.Keyboard.Key;
  keyW: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
}

export class Player {
  private scene: Phaser.Scene;
  public body: Matter.Body;
  public groundSensor: Matter.Body;
  public container: Phaser.GameObjects.Container;
  private graphics: Phaser.GameObjects.Graphics;
  private groundContacts = 0;
  private facing: "left" | "right" = "right";
  private jumpVelocity: number;
  private playerDef: RuntimePlayer;
  private theme: ResolvedThemeConfig;

  constructor(
    scene: Phaser.Scene,
    playerDef: RuntimePlayer,
    jumpVelocity: number,
    theme: ResolvedThemeConfig,
  ) {
    this.scene = scene;
    this.playerDef = playerDef;
    this.jumpVelocity = jumpVelocity;
    this.theme = theme;
    this.facing = playerDef.spawnFacing;

    const { centerX, centerY, height, width } = playerDef;

    // 1. Create Matter physics compound body
    const mainBody = Matter.Bodies.rectangle(0, 0, width, height, {
      chamfer: { radius: theme.style.cornerRadius },
      collisionFilter: {
        category: COLLISION_CATEGORIES.PLAYER,
        mask:
          COLLISION_CATEGORIES.PLATFORM |
          COLLISION_CATEGORIES.COIN |
          COLLISION_CATEGORIES.ENEMY |
          COLLISION_CATEGORIES.HAZARD |
          COLLISION_CATEGORIES.GOAL |
          COLLISION_CATEGORIES.BOUNDARY,
      },
      friction: PLAYER_PHYSICS.FRICTION,
      frictionAir: PLAYER_PHYSICS.FRICTION_AIR,
      label: COLLISION_LABELS.PLAYER_BODY,
      restitution: PLAYER_PHYSICS.RESTITUTION,
    });
    (mainBody as { wrapBounds?: null }).wrapBounds = null;

    this.groundSensor = Matter.Bodies.rectangle(
      0,
      height / 2 + 2,
      Math.max(4, width * 0.7),
      6,
      {
        collisionFilter: {
          category: COLLISION_CATEGORIES.GROUND_SENSOR,
          mask: COLLISION_CATEGORIES.PLATFORM,
        },
        isSensor: true,
        label: COLLISION_LABELS.GROUND_SENSOR,
      },
    );
    (this.groundSensor as { wrapBounds?: null }).wrapBounds = null;

    this.body = Matter.Body.create({
      friction: PLAYER_PHYSICS.FRICTION,
      frictionAir: PLAYER_PHYSICS.FRICTION_AIR,
      inertia: Infinity, // Fixed rotation
      label: COLLISION_LABELS.PLAYER,
      parts: [mainBody, this.groundSensor],
      restitution: PLAYER_PHYSICS.RESTITUTION,
    });
    Matter.Body.setPosition(this.body, { x: centerX, y: centerY });
    (this.body as { wrapBounds?: null }).wrapBounds = null;
    for (const part of this.body.parts) {
      (part as { wrapBounds?: null }).wrapBounds = null;
    }

    this.scene.matter.world.add(this.body);

    // 2. Create visual container
    this.container = this.scene.add.container(centerX, centerY);
    this.graphics = this.scene.add.graphics();
    this.container.add(this.graphics);

    this.renderVisuals();
  }

  public renderVisuals(): void {
    this.graphics.clear();
    const { height, width } = this.playerDef;
    const halfW = width / 2;
    const halfH = height / 2;

    const { borderWidth, cornerRadius } = this.theme.style;
    const { border, eyeColor, fill, glow } = this.theme.player;

    // Outer glow if neon
    if (glow && this.theme.style.glowStrength > 0) {
      this.graphics.lineStyle(borderWidth + 4, glow, 0.4);
      this.graphics.strokeRoundedRect(
        -halfW - 2,
        -halfH - 2,
        width + 4,
        height + 4,
        cornerRadius + 2,
      );
    }

    // Body Fill & Border
    this.graphics.fillStyle(fill, 1);
    this.graphics.fillRoundedRect(-halfW, -halfH, width, height, cornerRadius);

    this.graphics.lineStyle(borderWidth, border, 1);
    this.graphics.strokeRoundedRect(-halfW, -halfH, width, height, cornerRadius);

    // Eyes
    const eyeR = Math.max(2, Math.round(Math.min(width, height) * 0.1));
    const eyeOffsetX = this.facing === "right" ? halfW * 0.35 : -halfW * 0.35;
    const eyeOffsetY = -halfH * 0.25;

    this.graphics.fillStyle(eyeColor ?? 0xffffff, 1);
    this.graphics.fillCircle(eyeOffsetX, eyeOffsetY, eyeR);
    this.graphics.fillCircle(
      eyeOffsetX + (this.facing === "right" ? -eyeR * 2.2 : eyeR * 2.2),
      eyeOffsetY,
      eyeR,
    );

    // Eye pupils
    this.graphics.fillStyle(0x0f172a, 1);
    const pupilOffset = this.facing === "right" ? 1 : -1;
    this.graphics.fillCircle(eyeOffsetX + pupilOffset, eyeOffsetY, Math.max(1, eyeR * 0.5));
    this.graphics.fillCircle(
      eyeOffsetX + (this.facing === "right" ? -eyeR * 2.2 : eyeR * 2.2) + pupilOffset,
      eyeOffsetY,
      Math.max(1, eyeR * 0.5),
    );
  }

  public update(controls: PlayerControls): void {
    if (!this.body) return;

    // Sync container position with physics body
    this.container.setPosition(this.body.position.x, this.body.position.y);

    let moveX = 0;
    const isLeft = controls.left.isDown || controls.keyA.isDown;
    const isRight = controls.right.isDown || controls.keyD.isDown;
    const isJump =
      Phaser.Input.Keyboard.JustDown(controls.up) ||
      Phaser.Input.Keyboard.JustDown(controls.keyW) ||
      Phaser.Input.Keyboard.JustDown(controls.jumpSpace) ||
      Phaser.Input.Keyboard.JustDown(controls.jumpAlt);

    if (isLeft) {
      moveX = -PLAYER_PHYSICS.MOVE_SPEED;
      if (this.facing !== "left") {
        this.facing = "left";
        this.renderVisuals();
      }
    } else if (isRight) {
      moveX = PLAYER_PHYSICS.MOVE_SPEED;
      if (this.facing !== "right") {
        this.facing = "right";
        this.renderVisuals();
      }
    }

    // Apply horizontal velocity
    Matter.Body.setVelocity(this.body, {
      x: moveX,
      y: this.body.velocity.y,
    });

    // Jump
    if (isJump && this.isGrounded()) {
      Matter.Body.setVelocity(this.body, {
        x: this.body.velocity.x,
        y: this.jumpVelocity,
      });
      this.groundContacts = 0; // Immediate reset
    }
  }

  public onGroundContactStart(): void {
    this.groundContacts += 1;
  }

  public onGroundContactEnd(): void {
    this.groundContacts = Math.max(0, this.groundContacts - 1);
  }

  public isGrounded(): boolean {
    return this.groundContacts > 0;
  }

  public getX(): number {
    return this.body.position.x;
  }

  public getY(): number {
    return this.body.position.y;
  }

  public destroy(): void {
    if (this.scene && this.scene.matter && this.body) {
      this.scene.matter.world.remove(this.body);
    }
    if (this.container) {
      this.container.destroy();
    }
  }
}
