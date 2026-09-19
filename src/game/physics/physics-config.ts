export const COLLISION_CATEGORIES = {
  PLAYER: 0x0001,
  GROUND_SENSOR: 0x0002,
  PLATFORM: 0x0004,
  COIN: 0x0008,
  ENEMY: 0x0010,
  HAZARD: 0x0020,
  GOAL: 0x0040,
  BOUNDARY: 0x0080,
} as const;

export const COLLISION_LABELS = {
  BOUNDARY: "boundary",
  COIN: "coin",
  ENEMY: "enemy",
  GOAL: "goal",
  GROUND_SENSOR: "player_ground_sensor",
  HAZARD: "hazard",
  PLATFORM: "platform",
  PLAYER: "player",
  PLAYER_BODY: "player_body",
} as const;

export const PLAYER_PHYSICS = {
  AIR_CONTROL: 0.85,
  FRICTION: 0.05,
  FRICTION_AIR: 0.02,
  MOVE_SPEED: 5.5,
  RESTITUTION: 0,
} as const;

export const ENEMY_PHYSICS = {
  DEFAULT_SPEED: 1.8,
  FRICTION: 0.1,
  FRICTION_AIR: 0.02,
} as const;

/**
 * Maps LevelDefinition.physics.gravityY to Phaser Matter world gravity (scale 0.001)
 */
export function scaleGravityY(gravityY = 1400): number {
  // Default 1400 maps to 1.4 in Matter world
  return Math.max(0.5, Math.min(3.0, gravityY / 1000));
}

/**
 * Maps LevelDefinition.physics.jumpVelocity to Matter linear velocity Y
 */
export function scaleJumpVelocity(jumpVelocity = -520): number {
  // Default -520 maps to -13 in Matter linear velocity
  return Math.min(-6, Math.max(-20, jumpVelocity / 40));
}
