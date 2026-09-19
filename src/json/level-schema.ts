import { z } from "zod";

const positionSchema = z
  .object({
    x: z.number().finite(),
    y: z.number().finite(),
  })
  .strict();

const dimensionsSchema = z
  .object({
    height: z.number().positive(),
    width: z.number().positive(),
  })
  .strict();

const entityBaseSchema = positionSchema.extend({
  confidence: z.number().min(0).max(1).optional(),
});

const rectangularEntitySchema = entityBaseSchema.merge(dimensionsSchema).extend({
  id: z.string().min(1),
});

export const playerSchema = rectangularEntitySchema.extend({
  spawnFacing: z.enum(["left", "right"]).default("right"),
});

export const platformSchema = rectangularEntitySchema.extend({
  oneWay: z.boolean().default(false),
});

export const enemySchema = rectangularEntitySchema.extend({
  patrolDistance: z.number().nonnegative().default(0),
});

export const coinSchema = entityBaseSchema.extend({
  id: z.string().min(1),
  radius: z.number().positive().default(12),
});

export const spikeSchema = rectangularEntitySchema.extend({
  direction: z.enum(["down", "left", "right", "up"]).default("up"),
});

export const goalSchema = rectangularEntitySchema.extend({
  label: z.string().min(1).max(80).default("Goal"),
});

export const gameModeSchema = z
  .enum(["single-screen", "side-scrolling"])
  .default("single-screen");

export type GameMode = z.infer<typeof gameModeSchema>;

export const worldDimensionsSchema = z
  .object({
    height: z.number().int().positive(),
    width: z.number().int().positive(),
  })
  .strict();

export type WorldDimensions = z.infer<typeof worldDimensionsSchema>;

export const levelMetadataSchema = z
  .object({
    createdAt: z.string().optional(),
    description: z.string().max(300).optional(),
    generatedAt: z.string().optional(),
    source: z.enum(["detection", "drawing", "manual"]).default("detection"),
  })
  .strict();

export type LevelMetadata = z.infer<typeof levelMetadataSchema>;

export const levelSchema = z
  .object({
    coins: z.array(coinSchema),
    enemies: z.array(enemySchema),
    gameMode: gameModeSchema,
    goal: goalSchema.nullable(),
    metadata: levelMetadataSchema.optional(),
    name: z.string().min(1).max(120),
    physics: z
      .object({
        gravityY: z.number().positive(),
        jumpVelocity: z.number().negative(),
      })
      .strict(),
    platforms: z.array(platformSchema),
    player: playerSchema,
    spikes: z.array(spikeSchema),
    version: z.literal(1),
    viewport: z
      .object({
        height: z.number().int().positive(),
        width: z.number().int().positive(),
      })
      .strict(),
    world: worldDimensionsSchema.optional(),
  })
  .strict();

export type LevelDefinition = z.infer<typeof levelSchema>;
export type PlayerEntity = z.infer<typeof playerSchema>;
export type PlatformEntity = z.infer<typeof platformSchema>;
export type EnemyEntity = z.infer<typeof enemySchema>;
export type CoinEntity = z.infer<typeof coinSchema>;
export type SpikeEntity = z.infer<typeof spikeSchema>;
export type GoalEntity = z.infer<typeof goalSchema>;

export function createEmptyLevel(
  name = "Untitled level",
  gameMode: GameMode = "single-screen",
): LevelDefinition {
  const isSideScrolling = gameMode === "side-scrolling";
  const viewportWidth = 1280;
  const viewportHeight = 720;
  const worldWidth = isSideScrolling ? 2560 : 1280;
  const worldHeight = 720;

  return levelSchema.parse({
    coins: [],
    enemies: [],
    gameMode,
    goal: null,
    metadata: {
      createdAt: new Date().toISOString(),
      source: "manual",
    },
    name,
    physics: {
      gravityY: 1400,
      jumpVelocity: -520,
    },
    platforms: [],
    player: {
      height: 48,
      id: "player_start",
      width: 32,
      x: 96,
      y: 384,
    },
    spikes: [],
    version: 1,
    viewport: {
      height: viewportHeight,
      width: viewportWidth,
    },
    world: {
      height: worldHeight,
      width: worldWidth,
    },
  });
}

export function createPlayableDemoLevel(
  name = "Playable Demo Level",
  gameMode: GameMode = "single-screen",
): LevelDefinition {
  const base = createEmptyLevel(name, gameMode);
  return levelSchema.parse({
    ...base,
    coins: [
      { id: "coin_1", radius: 14, x: 300, y: 460 },
      { id: "coin_2", radius: 14, x: 550, y: 360 },
      { id: "coin_3", radius: 14, x: 750, y: 280 },
    ],
    enemies: [
      { height: 36, id: "enemy_patrol", patrolDistance: 80, width: 32, x: 520, y: 384 },
    ],
    goal: { height: 64, id: "goal_flag", label: "Goal Flag", width: 44, x: 1100, y: 456 },
    platforms: [
      { height: 40, id: "ground_start", oneWay: false, width: 360, x: 60, y: 520 },
      { height: 32, id: "plat_mid", oneWay: false, width: 220, x: 440, y: 420 },
      { height: 32, id: "plat_high", oneWay: false, width: 200, x: 680, y: 340 },
      { height: 40, id: "ground_end", oneWay: false, width: 320, x: 920, y: 520 },
    ],
    player: {
      height: 48,
      id: "player_start",
      spawnFacing: "right",
      width: 32,
      x: 120,
      y: 450,
    },
    spikes: [
      { direction: "up", height: 20, id: "spike_hazard", width: 48, x: 410, y: 540 },
    ],
  });
}

