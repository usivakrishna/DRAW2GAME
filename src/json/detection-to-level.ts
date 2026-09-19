import {
  type CoinEntity,
  type EnemyEntity,
  type GameMode,
  type GoalEntity,
  type LevelDefinition,
  levelSchema,
  type PlatformEntity,
  type PlayerEntity,
  type SpikeEntity,
} from "@/json/level-schema";
import type { DetectionPrediction } from "@/types/detection";

export interface LevelValidationIssue {
  code: string;
  entityId?: string;
  message: string;
  severity: "error" | "warning";
}

export interface LevelValidationResult {
  errors: string[];
  isValid: boolean;
  issues: LevelValidationIssue[];
  warnings: string[];
}

export interface ConversionOptions {
  gameMode?: GameMode | undefined;
  levelName?: string | undefined;
  sourceDimensions?: { height: number; width: number } | undefined;
  targetViewport?: { height: number; width: number } | undefined;
  targetWorld?: { height: number; width: number } | undefined;
}

export interface DetectionToLevelResult {
  detectionCount: number;
  level: LevelDefinition;
  mappedCount: number;
  unmappedDetections: DetectionPrediction[];
  validation: LevelValidationResult;
}

/**
 * Validates a level object against levelSchema and DRAW2GAME gameplay rules.
 */
export function validateLevel(level: unknown): LevelValidationResult {
  const issues: LevelValidationIssue[] = [];

  const parsed = levelSchema.safeParse(level);

  if (!parsed.success) {
    for (const error of parsed.error.issues) {
      const pathStr = error.path.join(".");
      issues.push({
        code: error.code,
        message: `${pathStr ? `[${pathStr}] ` : ""}${error.message}`,
        severity: "error",
      });
    }
  }

  const levelObj = (
    parsed.success ? parsed.data : (level as Partial<LevelDefinition> | undefined)
  );

  if (levelObj) {
    // 1. Player validation
    if (!levelObj.player) {
      issues.push({
        code: "PLAYER_MISSING",
        message: "Player is missing: The level must have a Player spawn point to be playable.",
        severity: "error",
      });
    } else {
      if (levelObj.player.width <= 0 || levelObj.player.height <= 0) {
        issues.push({
          code: "PLAYER_INVALID_DIMENSIONS",
          entityId: levelObj.player.id,
          message: "Player dimensions must be positive numbers.",
          severity: "error",
        });
      }
    }

    // 2. Goal validation
    if (!levelObj.goal) {
      issues.push({
        code: "GOAL_MISSING",
        message: "Goal is missing: The level has no win condition or goal flag.",
        severity: "warning",
      });
    }

    // 3. Platform validation
    if (!levelObj.platforms || levelObj.platforms.length === 0) {
      issues.push({
        code: "PLATFORMS_EMPTY",
        message: "No platforms detected: The level has no solid surfaces for the player to stand on.",
        severity: "warning",
      });
    } else {
      for (const plat of levelObj.platforms) {
        if (plat.width <= 0 || plat.height <= 0) {
          issues.push({
            code: "PLATFORM_INVALID_DIMENSIONS",
            entityId: plat.id,
            message: `Platform "${plat.id}" has non-positive dimensions (${plat.width}×${plat.height}).`,
            severity: "error",
          });
        }
      }
    }

    // 4. Boundary checks
    const worldWidth = levelObj.world?.width ?? levelObj.viewport?.width ?? 1280;
    const worldHeight = levelObj.world?.height ?? levelObj.viewport?.height ?? 720;

    if (levelObj.player && (levelObj.player.x < 0 || levelObj.player.x > worldWidth)) {
      issues.push({
        code: "PLAYER_OUT_OF_BOUNDS",
        entityId: levelObj.player.id,
        message: `Player spawn (x: ${levelObj.player.x}) is outside the world width (${worldWidth}px).`,
        severity: "warning",
      });
    }

    if (levelObj.player && (levelObj.player.y < 0 || levelObj.player.y > worldHeight)) {
      issues.push({
        code: "PLAYER_OUT_OF_BOUNDS",
        entityId: levelObj.player.id,
        message: `Player spawn (y: ${levelObj.player.y}) is outside the world height (${worldHeight}px).`,
        severity: "warning",
      });
    }
  }

  const errors = issues.filter((i) => i.severity === "error").map((i) => i.message);
  const warnings = issues.filter((i) => i.severity === "warning").map((i) => i.message);

  return {
    errors,
    isValid: errors.length === 0,
    issues,
    warnings,
  };
}

/**
 * Converts Phase 4 DetectionPrediction objects into a validated LevelDefinition.
 * Does NOT invent fake detections. If objects are missing, reports honest validation results.
 */
export function convertDetectionsToLevel(
  predictions: DetectionPrediction[],
  options: ConversionOptions = {},
): DetectionToLevelResult {
  const levelName = options.levelName ?? "Generated Level";

  // Determine game mode: explicit option, or infer from aspect ratio
  let gameMode: GameMode = options.gameMode ?? "single-screen";
  if (!options.gameMode && options.sourceDimensions) {
    const ratio = options.sourceDimensions.width / options.sourceDimensions.height;
    if (ratio >= 2.0 || options.sourceDimensions.width >= 2000) {
      gameMode = "side-scrolling";
    }
  }

  const isSideScrolling = gameMode === "side-scrolling";
  const viewportWidth = options.targetViewport?.width ?? 1280;
  const viewportHeight = options.targetViewport?.height ?? 720;

  const worldWidth =
    options.targetWorld?.width ?? (isSideScrolling ? 2560 : viewportWidth);
  const worldHeight = options.targetWorld?.height ?? viewportHeight;

  // Coordinate scaling factors
  let scaleX = 1;
  let scaleY = 1;

  if (options.sourceDimensions && options.sourceDimensions.width > 0 && options.sourceDimensions.height > 0) {
    scaleX = worldWidth / options.sourceDimensions.width;
    scaleY = worldHeight / options.sourceDimensions.height;
  }

  const scaleXCoord = (val: number) => Math.round(val * scaleX);
  const scaleYCoord = (val: number) => Math.round(val * scaleY);
  const scaleWidth = (val: number) => Math.max(4, Math.round(val * scaleX));
  const scaleHeight = (val: number) => Math.max(4, Math.round(val * scaleY));

  // Partition detections by class
  const playerDetections: DetectionPrediction[] = [];
  const platformDetections: DetectionPrediction[] = [];
  const enemyDetections: DetectionPrediction[] = [];
  const coinDetections: DetectionPrediction[] = [];
  const spikeDetections: DetectionPrediction[] = [];
  const goalDetections: DetectionPrediction[] = [];
  const unmappedDetections: DetectionPrediction[] = [];

  for (const pred of predictions) {
    switch (pred.className) {
      case "player":
        playerDetections.push(pred);
        break;
      case "platform":
        platformDetections.push(pred);
        break;
      case "enemy":
        enemyDetections.push(pred);
        break;
      case "coin":
        coinDetections.push(pred);
        break;
      case "spike":
        spikeDetections.push(pred);
        break;
      case "goal":
        goalDetections.push(pred);
        break;
      default:
        unmappedDetections.push(pred);
        break;
    }
  }

  const issues: LevelValidationIssue[] = [];

  // Map Player
  let player: PlayerEntity;
  if (playerDetections.length === 0) {
    // If no player detected, use default placeholder so schema can parse, but flag validation error!
    player = {
      confidence: undefined,
      height: 48,
      id: "player_start",
      spawnFacing: "right",
      width: 32,
      x: 96,
      y: 384,
    };
    issues.push({
      code: "PLAYER_MISSING",
      message: "Player is missing: No player was detected in the sketch. A player spawn is required.",
      severity: "error",
    });
  } else {
    // Sort descending by confidence
    playerDetections.sort((a, b) => b.confidence - a.confidence);
    const chosenPlayer = playerDetections[0] as DetectionPrediction;

    player = {
      confidence: chosenPlayer.confidence,
      height: scaleHeight(chosenPlayer.boundingBox.height),
      id: "player-1",
      spawnFacing: "right",
      width: scaleWidth(chosenPlayer.boundingBox.width),
      x: scaleXCoord(chosenPlayer.boundingBox.x),
      y: scaleYCoord(chosenPlayer.boundingBox.y),
    };

    if (playerDetections.length > 1) {
      issues.push({
        code: "MULTIPLE_PLAYERS_DETECTED",
        message: `Multiple players detected (${playerDetections.length}). Using the highest confidence detection (${(chosenPlayer.confidence * 100).toFixed(0)}%) for the player spawn.`,
        severity: "warning",
      });
    }
  }

  // Map Goal
  let goal: GoalEntity | null = null;
  if (goalDetections.length === 0) {
    goal = null;
    issues.push({
      code: "GOAL_MISSING",
      message: "Goal is missing: No goal flag was detected in the sketch.",
      severity: "warning",
    });
  } else {
    goalDetections.sort((a, b) => b.confidence - a.confidence);
    const chosenGoal = goalDetections[0] as DetectionPrediction;

    goal = {
      confidence: chosenGoal.confidence,
      height: scaleHeight(chosenGoal.boundingBox.height),
      id: "goal-1",
      label: "Goal",
      width: scaleWidth(chosenGoal.boundingBox.width),
      x: scaleXCoord(chosenGoal.boundingBox.x),
      y: scaleYCoord(chosenGoal.boundingBox.y),
    };

    if (goalDetections.length > 1) {
      issues.push({
        code: "MULTIPLE_GOALS_DETECTED",
        message: `Multiple goals detected (${goalDetections.length}). Using the highest confidence detection (${(chosenGoal.confidence * 100).toFixed(0)}%) for the level goal.`,
        severity: "warning",
      });
    }
  }

  // Map Platforms
  const platforms: PlatformEntity[] = platformDetections.map((p, idx) => ({
    confidence: p.confidence,
    height: scaleHeight(p.boundingBox.height),
    id: `platform-${idx + 1}`,
    oneWay: false,
    width: scaleWidth(p.boundingBox.width),
    x: scaleXCoord(p.boundingBox.x),
    y: scaleYCoord(p.boundingBox.y),
  }));

  if (platforms.length === 0) {
    issues.push({
      code: "PLATFORMS_EMPTY",
      message: "No platforms detected: No platform entities were detected in the sketch.",
      severity: "warning",
    });
  }

  // Map Enemies
  const enemies: EnemyEntity[] = enemyDetections.map((e, idx) => ({
    confidence: e.confidence,
    height: scaleHeight(e.boundingBox.height),
    id: `enemy-${idx + 1}`,
    patrolDistance: Math.round(64 * scaleX),
    width: scaleWidth(e.boundingBox.width),
    x: scaleXCoord(e.boundingBox.x),
    y: scaleYCoord(e.boundingBox.y),
  }));

  // Map Coins (centered position, radius = min(w, h)/2)
  const coins: CoinEntity[] = coinDetections.map((c, idx) => {
    const w = scaleWidth(c.boundingBox.width);
    const h = scaleHeight(c.boundingBox.height);
    const cx = scaleXCoord(c.boundingBox.x) + Math.round(w / 2);
    const cy = scaleYCoord(c.boundingBox.y) + Math.round(h / 2);
    const radius = Math.max(6, Math.round(Math.min(w, h) / 2));

    return {
      confidence: c.confidence,
      id: `coin-${idx + 1}`,
      radius,
      x: cx,
      y: cy,
    };
  });

  // Map Spikes
  const spikes: SpikeEntity[] = spikeDetections.map((s, idx) => ({
    confidence: s.confidence,
    direction: "up",
    height: scaleHeight(s.boundingBox.height),
    id: `spike-${idx + 1}`,
    width: scaleWidth(s.boundingBox.width),
    x: scaleXCoord(s.boundingBox.x),
    y: scaleYCoord(s.boundingBox.y),
  }));

  // Build the LevelDefinition
  const level: LevelDefinition = {
    coins,
    enemies,
    gameMode,
    goal,
    metadata: {
      createdAt: new Date().toISOString(),
      generatedAt: new Date().toISOString(),
      source: "detection",
    },
    name: levelName,
    physics: {
      gravityY: 1400,
      jumpVelocity: -520,
    },
    platforms,
    player,
    spikes,
    version: 1,
    viewport: {
      height: viewportHeight,
      width: viewportWidth,
    },
    world: {
      height: worldHeight,
      width: worldWidth,
    },
  };

  // Run full validation
  const baseValidation = validateLevel(level);

  // Combine conversion-specific issues with schema validation
  const allIssues = [...issues, ...baseValidation.issues.filter(
    (bi) => !issues.some((i) => i.code === bi.code),
  )];

  const errors = allIssues.filter((i) => i.severity === "error").map((i) => i.message);
  const warnings = allIssues.filter((i) => i.severity === "warning").map((i) => i.message);

  const mappedCount =
    (playerDetections.length > 0 ? 1 : 0) +
    (goalDetections.length > 0 ? 1 : 0) +
    platforms.length +
    enemies.length +
    coins.length +
    spikes.length;

  return {
    detectionCount: predictions.length,
    level,
    mappedCount,
    unmappedDetections,
    validation: {
      errors,
      isValid: errors.length === 0,
      issues: allIssues,
      warnings,
    },
  };
}
