import Phaser from "phaser";
import { CoinManager } from "@/game/entities/CoinManager";
import { EnemyManager } from "@/game/entities/EnemyManager";
import { GoalManager } from "@/game/entities/GoalManager";
import { HazardManager } from "@/game/entities/HazardManager";
import { PlatformManager } from "@/game/entities/PlatformManager";
import { Player, type PlayerControls } from "@/game/entities/Player";
import type { RuntimeLevelData } from "@/game/levels/level-loader";
import {
  COLLISION_CATEGORIES,
  COLLISION_LABELS,
} from "@/game/physics/physics-config";
import type { GameStateManager } from "@/game/systems/game-state-manager";
import type { ResolvedThemeConfig } from "@/game/themes/theme-types";

export interface SceneInitData {
  gameStateManager: GameStateManager;
  levelData: RuntimeLevelData;
  theme: ResolvedThemeConfig;
}

export class MainGameScene extends Phaser.Scene {
  private levelData!: RuntimeLevelData;
  private theme!: ResolvedThemeConfig;
  private gameStateManager!: GameStateManager;

  private player: Player | null = null;
  private platformManager!: PlatformManager;
  private coinManager!: CoinManager;
  private enemyManager!: EnemyManager;
  private hazardManager!: HazardManager;
  private goalManager!: GoalManager;

  private controls!: PlayerControls;
  private boundaryBodies: MatterJS.BodyType[] = [];
  private bgGraphics: Phaser.GameObjects.Graphics | null = null;
  private collisionHandlersBound = false;

  constructor() {
    super({ key: "MainGameScene" });
  }

  public init(data?: Partial<SceneInitData>): void {
    if (data?.levelData) {
      this.levelData = data.levelData;
      this.theme = data.theme!;
      this.gameStateManager = data.gameStateManager!;
    }
  }

  public create(data?: Partial<SceneInitData>): void {
    if (data?.levelData) {
      this.levelData = data.levelData;
      this.theme = data.theme!;
      this.gameStateManager = data.gameStateManager!;
    }
    if (!this.levelData) return;

    const worldW = this.levelData.world.width;
    const worldH = this.levelData.world.height;

    // 1. Configure Matter World Gravity
    this.matter.world.setGravity(0, this.levelData.gravityY);

    // 2. Initialize Managers
    this.platformManager = new PlatformManager(this);
    this.coinManager = new CoinManager(this);
    this.enemyManager = new EnemyManager(this);
    this.hazardManager = new HazardManager(this);
    this.goalManager = new GoalManager(this);

    // 3. Render Background & World Boundaries
    this.drawBackground(worldW, worldH);
    this.createWorldBoundaries(worldW, worldH);

    // 4. Setup Input Controls
    this.setupControls();

    // 5. Spawn Entities from Level Data
    this.spawnAll();

    // 6. Configure Camera
    this.setupCamera();

    // 7. Bind Collision Listeners
    if (!this.collisionHandlersBound) {
      this.setupCollisionHandlers();
      this.collisionHandlersBound = true;
    }

    // 8. Start Game State
    this.gameStateManager.start();
  }

  private drawBackground(width: number, height: number): void {
    if (this.bgGraphics) {
      this.bgGraphics.destroy();
    }
    this.bgGraphics = this.add.graphics();
    this.bgGraphics.setDepth(-100);

    const { accent, primary, secondary, type } = this.theme.background;

    if (type === "grid") {
      this.bgGraphics.fillStyle(primary, 1);
      this.bgGraphics.fillRect(0, 0, width, height);

      // Neon grid lines
      this.bgGraphics.lineStyle(1, secondary, 0.3);
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        this.bgGraphics.beginPath();
        this.bgGraphics.moveTo(x, 0);
        this.bgGraphics.lineTo(x, height);
        this.bgGraphics.strokePath();
      }
      for (let y = 0; y < height; y += gridSize) {
        this.bgGraphics.beginPath();
        this.bgGraphics.moveTo(0, y);
        this.bgGraphics.lineTo(width, y);
        this.bgGraphics.strokePath();
      }
    } else if (type === "stars") {
      this.bgGraphics.fillStyle(primary, 1);
      this.bgGraphics.fillRect(0, 0, width, height);

      // Starfield dots
      this.bgGraphics.fillStyle(0xffffff, 0.8);
      const starCount = Math.round((width * height) / 4500);
      for (let i = 0; i < starCount; i++) {
        const sx = Math.random() * width;
        const sy = Math.random() * height;
        const r = Math.random() < 0.2 ? 2 : 1;
        this.bgGraphics.fillCircle(sx, sy, r);
      }
    } else {
      // Gradient or solid
      this.bgGraphics.fillGradientStyle(
        primary,
        primary,
        secondary,
        secondary,
        1,
      );
      this.bgGraphics.fillRect(0, 0, width, height);

      if (accent) {
        this.bgGraphics.fillStyle(accent, 0.05);
        this.bgGraphics.fillCircle(width * 0.2, height * 0.3, 140);
        this.bgGraphics.fillCircle(width * 0.75, height * 0.2, 200);
      }
    }
  }

  private createWorldBoundaries(worldW: number, worldH: number): void {
    // Clear old boundaries
    for (const b of this.boundaryBodies) {
      this.matter.world.remove(b);
    }
    this.boundaryBodies = [];

    const wallThickness = 40;

    // Left wall
    const leftWall = this.matter.add.rectangle(
      -wallThickness / 2,
      worldH / 2,
      wallThickness,
      worldH * 3,
      {
        collisionFilter: {
          category: COLLISION_CATEGORIES.BOUNDARY,
          mask: COLLISION_CATEGORIES.PLAYER | COLLISION_CATEGORIES.ENEMY,
        },
        isStatic: true,
        label: COLLISION_LABELS.BOUNDARY,
      },
    );

    // Right wall
    const rightWall = this.matter.add.rectangle(
      worldW + wallThickness / 2,
      worldH / 2,
      wallThickness,
      worldH * 3,
      {
        collisionFilter: {
          category: COLLISION_CATEGORIES.BOUNDARY,
          mask: COLLISION_CATEGORIES.PLAYER | COLLISION_CATEGORIES.ENEMY,
        },
        isStatic: true,
        label: COLLISION_LABELS.BOUNDARY,
      },
    );

    // Top ceiling
    const ceiling = this.matter.add.rectangle(
      worldW / 2,
      -wallThickness / 2,
      worldW * 2,
      wallThickness,
      {
        collisionFilter: {
          category: COLLISION_CATEGORIES.BOUNDARY,
          mask: COLLISION_CATEGORIES.PLAYER,
        },
        isStatic: true,
        label: COLLISION_LABELS.BOUNDARY,
      },
    );

    this.boundaryBodies.push(leftWall, rightWall, ceiling);
  }

  private setupControls(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;

    this.controls = {
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      jumpAlt: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      jumpSpace: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      keyA: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      keyD: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      keyS: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      keyW: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
    };

    // ESC or P toggles pause
    keyboard.on("keydown-ESC", () => {
      this.gameStateManager.togglePause();
    });
    keyboard.on("keydown-P", () => {
      this.gameStateManager.togglePause();
    });

    // R quick restart
    keyboard.on("keydown-R", () => {
      this.restart();
    });
  }

  private spawnAll(): void {
    // 1. Player
    if (this.player) {
      this.player.destroy();
    }
    this.player = new Player(
      this,
      this.levelData.player,
      this.levelData.jumpVelocity,
      this.theme,
    );

    // 2. Platforms
    this.platformManager.spawnPlatforms(this.levelData.platforms, this.theme);

    // 3. Coins
    this.coinManager.spawnCoins(this.levelData.coins, this.theme);

    // 4. Enemies
    this.enemyManager.spawnEnemies(this.levelData.enemies, this.theme);

    // 5. Hazards (Spikes)
    this.hazardManager.spawnHazards(this.levelData.spikes, this.theme);

    // 6. Goal
    this.goalManager.spawnGoal(this.levelData.goal, this.theme);
  }

  private setupCamera(): void {
    const worldW = this.levelData.world.width;
    const worldH = this.levelData.world.height;

    this.cameras.main.setBounds(0, 0, worldW, worldH);

    if (this.levelData.gameMode === "side-scrolling" && this.player) {
      this.cameras.main.startFollow(this.player.container, true, 0.08, 0.08);
    } else {
      this.cameras.main.stopFollow();
      this.cameras.main.setScroll(0, 0);
    }
  }

  private setupCollisionHandlers(): void {
    this.matter.world.on(
      "collisionstart",
      (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
        if (this.gameStateManager.getSnapshot().status !== "playing") return;

        for (const pair of event.pairs) {
          const { bodyA, bodyB } = pair;

          // Ground Sensor detection
          if (
            (bodyA.label === COLLISION_LABELS.GROUND_SENSOR &&
              bodyB.label === COLLISION_LABELS.PLATFORM) ||
            (bodyB.label === COLLISION_LABELS.GROUND_SENSOR &&
              bodyA.label === COLLISION_LABELS.PLATFORM)
          ) {
            this.player?.onGroundContactStart();
          }

          // Coin Collection
          if (bodyA.label === COLLISION_LABELS.COIN || bodyB.label === COLLISION_LABELS.COIN) {
            const coinBody = bodyA.label === COLLISION_LABELS.COIN ? bodyA : bodyB;
            const otherBody = bodyA.label === COLLISION_LABELS.COIN ? bodyB : bodyA;

            if (
              otherBody.label === COLLISION_LABELS.PLAYER ||
              otherBody.label === COLLISION_LABELS.PLAYER_BODY
            ) {
              const collected = this.coinManager.collectCoin(coinBody.id);
              if (collected) {
                this.gameStateManager.collectCoin();
              }
            }
          }

          // Enemy Collision (Loss)
          if (bodyA.label === COLLISION_LABELS.ENEMY || bodyB.label === COLLISION_LABELS.ENEMY) {
            const otherBody = bodyA.label === COLLISION_LABELS.ENEMY ? bodyB : bodyA;
            if (
              otherBody.label === COLLISION_LABELS.PLAYER ||
              otherBody.label === COLLISION_LABELS.PLAYER_BODY
            ) {
              this.gameStateManager.lose("Eliminated by an enemy patrol.");
            }
          }

          // Spike / Hazard Collision (Loss)
          if (bodyA.label === COLLISION_LABELS.HAZARD || bodyB.label === COLLISION_LABELS.HAZARD) {
            const otherBody = bodyA.label === COLLISION_LABELS.HAZARD ? bodyB : bodyA;
            if (
              otherBody.label === COLLISION_LABELS.PLAYER ||
              otherBody.label === COLLISION_LABELS.PLAYER_BODY
            ) {
              this.gameStateManager.lose("Fell onto sharp spikes.");
            }
          }

          // Goal Collision (Win)
          if (bodyA.label === COLLISION_LABELS.GOAL || bodyB.label === COLLISION_LABELS.GOAL) {
            const otherBody = bodyA.label === COLLISION_LABELS.GOAL ? bodyB : bodyA;
            if (
              otherBody.label === COLLISION_LABELS.PLAYER ||
              otherBody.label === COLLISION_LABELS.PLAYER_BODY
            ) {
              this.gameStateManager.win();
            }
          }
        }
      },
    );

    this.matter.world.on(
      "collisionend",
      (event: Phaser.Physics.Matter.Events.CollisionEndEvent) => {
        for (const pair of event.pairs) {
          const { bodyA, bodyB } = pair;
          if (
            (bodyA.label === COLLISION_LABELS.GROUND_SENSOR &&
              bodyB.label === COLLISION_LABELS.PLATFORM) ||
            (bodyB.label === COLLISION_LABELS.GROUND_SENSOR &&
              bodyA.label === COLLISION_LABELS.PLATFORM)
          ) {
            this.player?.onGroundContactEnd();
          }
        }
      },
    );
  }

  public override update(): void {
    const status = this.gameStateManager.getSnapshot().status;
    if (status !== "playing") return;

    if (this.player && this.controls) {
      this.player.update(this.controls);

      // Fall-out-of-world boundary check
      const worldH = this.levelData.world.height;
      if (this.player.getY() > worldH + 64) {
        this.gameStateManager.lose("Fell out of the world boundaries.");
      }
    }

    if (this.enemyManager) {
      this.enemyManager.update();
    }
  }

  public restart(): void {
    this.spawnAll();
    this.setupCamera();
    this.gameStateManager.restart(this.levelData.coins.length);
  }

  public applyTheme(newTheme: ResolvedThemeConfig): void {
    this.theme = newTheme;
    const worldW = this.levelData.world.width;
    const worldH = this.levelData.world.height;
    this.drawBackground(worldW, worldH);
    this.spawnAll();
  }

  public destroyScene(): void {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    if (this.platformManager) this.platformManager.destroy();
    if (this.coinManager) this.coinManager.destroy();
    if (this.enemyManager) this.enemyManager.destroy();
    if (this.hazardManager) this.hazardManager.destroy();
    if (this.goalManager) this.goalManager.destroy();

    for (const b of this.boundaryBodies) {
      if (this.matter && this.matter.world) {
        this.matter.world.remove(b);
      }
    }
    this.boundaryBodies = [];

    if (this.bgGraphics) {
      this.bgGraphics.destroy();
      this.bgGraphics = null;
    }
  }
}
