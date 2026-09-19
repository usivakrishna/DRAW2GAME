import { describe, expect, it } from "vitest";
import {
  convertDetectionsToLevel,
  validateLevel,
} from "@/json/detection-to-level";
import { createEmptyLevel, levelSchema } from "@/json/level-schema";
import type { DetectionPrediction } from "@/types/detection";

describe("detection-to-level conversion", () => {
  it("handles empty detections with explicit validation issues and valid schema fallback", () => {
    const result = convertDetectionsToLevel([], { levelName: "Empty Sketch" });

    expect(result.detectionCount).toBe(0);
    expect(result.mappedCount).toBe(0);
    expect(result.unmappedDetections).toEqual([]);
    expect(result.level.name).toBe("Empty Sketch");

    // Schema validation succeeds on the generated object structure
    expect(levelSchema.safeParse(result.level).success).toBe(true);

    // But validation issues report missing player, goal, and platforms
    expect(result.validation.isValid).toBe(false);
    expect(result.validation.errors).toContain(
      "Player is missing: No player was detected in the sketch. A player spawn is required.",
    );
    expect(result.validation.warnings).toContain(
      "Goal is missing: No goal flag was detected in the sketch.",
    );
    expect(result.validation.warnings).toContain(
      "No platforms detected: No platform entities were detected in the sketch.",
    );
  });

  it("converts a complete set of detections into a valid LevelDefinition with stable IDs", () => {
    const sampleDetections: DetectionPrediction[] = [
      {
        boundingBox: { height: 48, width: 32, x: 100, y: 300 },
        className: "player",
        confidence: 0.92,
        id: "det-player-1",
      },
      {
        boundingBox: { height: 32, width: 200, x: 80, y: 348 },
        className: "platform",
        confidence: 0.88,
        id: "det-plat-1",
      },
      {
        boundingBox: { height: 32, width: 160, x: 400, y: 300 },
        className: "platform",
        confidence: 0.85,
        id: "det-plat-2",
      },
      {
        boundingBox: { height: 40, width: 36, x: 450, y: 260 },
        className: "enemy",
        confidence: 0.79,
        id: "det-enemy-1",
      },
      {
        boundingBox: { height: 24, width: 24, x: 220, y: 280 },
        className: "coin",
        confidence: 0.95,
        id: "det-coin-1",
      },
      {
        boundingBox: { height: 24, width: 48, x: 320, y: 324 },
        className: "spike",
        confidence: 0.82,
        id: "det-spike-1",
      },
      {
        boundingBox: { height: 64, width: 48, x: 520, y: 236 },
        className: "goal",
        confidence: 0.91,
        id: "det-goal-1",
      },
    ];

    const result = convertDetectionsToLevel(sampleDetections, {
      gameMode: "single-screen",
      levelName: "Level One",
    });

    expect(result.detectionCount).toBe(7);
    expect(result.mappedCount).toBe(7);
    expect(result.unmappedDetections).toHaveLength(0);
    expect(result.validation.isValid).toBe(true);
    expect(result.validation.errors).toHaveLength(0);

    // Check Player
    expect(result.level.player.id).toBe("player-1");
    expect(result.level.player.x).toBe(100);
    expect(result.level.player.y).toBe(300);
    expect(result.level.player.width).toBe(32);
    expect(result.level.player.height).toBe(48);
    expect(result.level.player.confidence).toBe(0.92);

    // Check Platforms
    expect(result.level.platforms).toHaveLength(2);
    expect(result.level.platforms[0]?.id).toBe("platform-1");
    expect(result.level.platforms[1]?.id).toBe("platform-2");
    expect(result.level.platforms[0]?.confidence).toBe(0.88);

    // Check Enemy
    expect(result.level.enemies).toHaveLength(1);
    expect(result.level.enemies[0]?.id).toBe("enemy-1");
    expect(result.level.enemies[0]?.confidence).toBe(0.79);

    // Check Coin (center coordinate conversion & radius)
    expect(result.level.coins).toHaveLength(1);
    expect(result.level.coins[0]?.id).toBe("coin-1");
    // Center: x + w/2 = 220 + 12 = 232; y + h/2 = 280 + 12 = 292; radius = 12
    expect(result.level.coins[0]?.x).toBe(232);
    expect(result.level.coins[0]?.y).toBe(292);
    expect(result.level.coins[0]?.radius).toBe(12);
    expect(result.level.coins[0]?.confidence).toBe(0.95);

    // Check Spike
    expect(result.level.spikes).toHaveLength(1);
    expect(result.level.spikes[0]?.id).toBe("spike-1");
    expect(result.level.spikes[0]?.confidence).toBe(0.82);

    // Check Goal
    expect(result.level.goal).not.toBeNull();
    expect(result.level.goal?.id).toBe("goal-1");
    expect(result.level.goal?.confidence).toBe(0.91);
  });

  it("scales coordinates accurately from source sketch dimensions to target world dimensions", () => {
    // Source sketch is 800 x 600
    // Target world is 1280 x 720 (scaleX = 1.6, scaleY = 1.2)
    const detections: DetectionPrediction[] = [
      {
        boundingBox: { height: 50, width: 25, x: 100, y: 200 },
        className: "player",
        confidence: 0.9,
        id: "det-1",
      },
      {
        boundingBox: { height: 50, width: 100, x: 200, y: 400 },
        className: "platform",
        confidence: 0.85,
        id: "det-2",
      },
    ];

    const result = convertDetectionsToLevel(detections, {
      levelName: "Scaled Level",
      sourceDimensions: { height: 600, width: 800 },
      targetViewport: { height: 720, width: 1280 },
    });

    // Player x: 100 * 1.6 = 160; y: 200 * 1.2 = 240; w: 25 * 1.6 = 40; h: 50 * 1.2 = 60
    expect(result.level.player.x).toBe(160);
    expect(result.level.player.y).toBe(240);
    expect(result.level.player.width).toBe(40);
    expect(result.level.player.height).toBe(60);

    // Platform x: 200 * 1.6 = 320; y: 400 * 1.2 = 480; w: 100 * 1.6 = 160; h: 50 * 1.2 = 60
    expect(result.level.platforms[0]?.x).toBe(320);
    expect(result.level.platforms[0]?.y).toBe(480);
    expect(result.level.platforms[0]?.width).toBe(160);
    expect(result.level.platforms[0]?.height).toBe(60);
  });

  it("supports single-screen and side-scrolling game modes with appropriate world dimensions", () => {
    const singleScreen = convertDetectionsToLevel([], {
      gameMode: "single-screen",
    });
    expect(singleScreen.level.gameMode).toBe("single-screen");
    expect(singleScreen.level.viewport.width).toBe(1280);
    expect(singleScreen.level.world?.width).toBe(1280);

    const sideScrolling = convertDetectionsToLevel([], {
      gameMode: "side-scrolling",
    });
    expect(sideScrolling.level.gameMode).toBe("side-scrolling");
    expect(sideScrolling.level.viewport.width).toBe(1280);
    expect(sideScrolling.level.world?.width).toBe(2560);
  });

  it("handles multiple player detections by picking highest confidence and warning", () => {
    const multiPlayers: DetectionPrediction[] = [
      {
        boundingBox: { height: 48, width: 32, x: 50, y: 100 },
        className: "player",
        confidence: 0.65,
        id: "det-low",
      },
      {
        boundingBox: { height: 48, width: 32, x: 150, y: 200 },
        className: "player",
        confidence: 0.94,
        id: "det-high",
      },
    ];

    const result = convertDetectionsToLevel(multiPlayers);

    expect(result.level.player.x).toBe(150);
    expect(result.level.player.confidence).toBe(0.94);
    expect(
      result.validation.warnings.some((w) => w.includes("Multiple players detected")),
    ).toBe(true);
  });

  it("handles multiple goal detections by picking highest confidence and warning", () => {
    const multiGoals: DetectionPrediction[] = [
      {
        boundingBox: { height: 60, width: 40, x: 600, y: 300 },
        className: "goal",
        confidence: 0.96,
        id: "det-goal-high",
      },
      {
        boundingBox: { height: 60, width: 40, x: 800, y: 300 },
        className: "goal",
        confidence: 0.72,
        id: "det-goal-low",
      },
    ];

    const result = convertDetectionsToLevel(multiGoals);

    expect(result.level.goal?.x).toBe(600);
    expect(result.level.goal?.confidence).toBe(0.96);
    expect(
      result.validation.warnings.some((w) => w.includes("Multiple goals detected")),
    ).toBe(true);
  });

  it("safely separates unknown / unmapped classes into unmappedDetections", () => {
    const detectionsWithUnknown: DetectionPrediction[] = [
      {
        boundingBox: { height: 50, width: 50, x: 10, y: 10 },
        className: "unknown_vehicle" as unknown as DetectionPrediction["className"],
        confidence: 0.8,
        id: "det-unknown-1",
      },
      {
        boundingBox: { height: 32, width: 120, x: 50, y: 200 },
        className: "platform",
        confidence: 0.9,
        id: "det-plat-1",
      },
    ];

    const result = convertDetectionsToLevel(detectionsWithUnknown);

    expect(result.unmappedDetections).toHaveLength(1);
    expect(result.unmappedDetections[0]?.className).toBe("unknown_vehicle");
    expect(result.level.platforms).toHaveLength(1);
  });
});

describe("validateLevel", () => {
  it("identifies a valid level as isValid: true", () => {
    const emptyLevel = createEmptyLevel("Test");
    const res = validateLevel(emptyLevel);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it("flags invalid platform dimensions as an error", () => {
    const emptyLevel = createEmptyLevel("Test");
    const badLevel = {
      ...emptyLevel,
      platforms: [
        {
          height: -10,
          id: "bad-plat",
          oneWay: false,
          width: 0,
          x: 100,
          y: 200,
        },
      ],
    };

    const res = validateLevel(badLevel);
    expect(res.isValid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it("flags player spawn outside boundaries as a warning", () => {
    const emptyLevel = createEmptyLevel("Test");
    const outLevel = {
      ...emptyLevel,
      player: {
        ...emptyLevel.player,
        x: 5000,
      },
    };

    const res = validateLevel(outLevel);
    expect(res.warnings.some((w) => w.includes("outside the world width"))).toBe(true);
  });
});
