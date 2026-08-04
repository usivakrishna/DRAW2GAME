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

const rectangularEntitySchema = positionSchema.merge(dimensionsSchema).extend({
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

export const coinSchema = positionSchema.extend({
  id: z.string().min(1),
  radius: z.number().positive().default(12),
});

export const spikeSchema = rectangularEntitySchema.extend({
  direction: z.enum(["down", "left", "right", "up"]).default("up"),
});

export const goalSchema = rectangularEntitySchema.extend({
  label: z.string().min(1).max(80).default("Goal"),
});

export const levelSchema = z
  .object({
    coins: z.array(coinSchema),
    enemies: z.array(enemySchema),
    goal: goalSchema.nullable(),
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
  })
  .strict();

export type LevelDefinition = z.infer<typeof levelSchema>;

export function createEmptyLevel(name = "Untitled level"): LevelDefinition {
  return levelSchema.parse({
    coins: [],
    enemies: [],
    goal: null,
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
      height: 720,
      width: 1280,
    },
  });
}
