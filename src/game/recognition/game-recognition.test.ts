/**
 * DRAW2GAME — Phase 11: Game Recognition & Game-Type Detection Test Suite
 */

import { beforeEach, describe, expect, it } from "vitest";
import { GameEngineFactory } from "@/game/core/game-engine-factory";
import { GameRecognizer } from "./game-recognizer";
import { CarromRecognizer } from "./recognizers/carrom-recognizer";
import { ChessRecognizer } from "./recognizers/chess-recognizer";
import { LudoRecognizer } from "./recognizers/ludo-recognizer";
import { PoolRecognizer } from "./recognizers/pool-recognizer";
import { PuzzleRecognizer } from "./recognizers/puzzle-recognizer";
import { RacingRecognizer } from "./recognizers/racing-recognizer";
import { ShooterRecognizer } from "./recognizers/shooter-recognizer";
import { SportsRecognizer } from "./recognizers/sports-recognizer";
import type { StructuralFeatures } from "./types";
import { useProjectStore } from "@/store/project-store";
import type { DetectionPrediction } from "@/types/detection";

describe("Phase 11: Game Recognition & Game-Type Detection", () => {
  beforeEach(() => {
    GameRecognizer.resetRecognizers();
    useProjectStore.setState({
      activeProjectId: null,
      projectDetections: {},
      projectLevels: {},
      projectRecognitions: {},
      projects: [],
      projectUploads: {},
    });
  });

  // 1. Platformer Recognition
  it("recognizes platformer games from platform, player, and goal structures", () => {
    const predictions: DetectionPrediction[] = [
      {
        boundingBox: { height: 30, width: 300, x: 50, y: 650 },
        className: "platform",
        confidence: 0.95,
        id: "plat-ground",
      },
      {
        boundingBox: { height: 25, width: 200, x: 200, y: 450 },
        className: "platform",
        confidence: 0.92,
        id: "plat-mid",
      },
      {
        boundingBox: { height: 40, width: 30, x: 80, y: 600 },
        className: "player",
        confidence: 0.9,
        id: "player-1",
      },
      {
        boundingBox: { height: 50, width: 30, x: 1100, y: 400 },
        className: "goal",
        confidence: 0.91,
        id: "goal-1",
      },
      {
        boundingBox: { height: 20, width: 20, x: 250, y: 400 },
        className: "coin",
        confidence: 0.88,
        id: "coin-1",
      },
    ];

    const result = GameRecognizer.recognize({ predictions });

    expect(result.gameType).toBe("platformer");
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    expect(result.supported).toBe(true);
    expect(result.evidence.some((e) => e.includes("platform"))).toBe(true);
    expect(result.evidence.some((e) => e.includes("Player spawn"))).toBe(true);
  });

  // 2. Chess Recognition
  it("recognizes chess games from square 8x8 grid structures", () => {
    const features: StructuralFeatures = {
      aspectRatio: 1.0,
      circularRegionsCount: 16,
      classCounts: { coin: 0, enemy: 0, goal: 0, platform: 0, player: 0, spike: 0 },
      continuousPathDetected: false,
      cornerPocketsCount: 0,
      dimensions: { height: 800, width: 800 },
      discreteTilesDetected: true,
      gridCellsCount: 64,
      hasBottomBaseline: false,
      hasPlayerGoalPair: false,
      hasVerticalSeparation: false,
      horizontalSegmentsCount: 0,
      isNearDoubleSquare: false,
      isNearSquare: true,
      opposingGoalZonesDetected: false,
      predictions: [],
      quadrantSymmetryDetected: false,
      reticleDetected: false,
      verticalSegmentsCount: 0,
    };

    const recognizer = new ChessRecognizer();
    const candidate = recognizer.analyze(features);

    expect(candidate.gameType).toBe("chess");
    expect(candidate.confidence).toBeGreaterThanOrEqual(0.8);
    expect(candidate.evidence.some((e) => e.includes("8×8 board"))).toBe(true);

    const fullResult = GameRecognizer.recognize(features);
    expect(fullResult.gameType).toBe("chess");
    expect(fullResult.supported).toBe(true); // Playable in Phase 12
  });

  // 3. Ludo Recognition
  it("recognizes ludo games from 4-quadrant symmetric home structures", () => {
    const features: StructuralFeatures = {
      aspectRatio: 1.0,
      circularRegionsCount: 8,
      classCounts: { coin: 0, enemy: 0, goal: 0, platform: 0, player: 0, spike: 0 },
      continuousPathDetected: false,
      cornerPocketsCount: 0,
      dimensions: { height: 600, width: 600 },
      discreteTilesDetected: false,
      gridCellsCount: 0,
      hasBottomBaseline: false,
      hasPlayerGoalPair: false,
      hasVerticalSeparation: false,
      horizontalSegmentsCount: 0,
      isNearDoubleSquare: false,
      isNearSquare: true,
      opposingGoalZonesDetected: false,
      predictions: [],
      quadrantSymmetryDetected: true,
      reticleDetected: false,
      verticalSegmentsCount: 0,
    };

    const candidate = new LudoRecognizer().analyze(features);
    expect(candidate.gameType).toBe("ludo");
    expect(candidate.confidence).toBeGreaterThanOrEqual(0.7);
    expect(candidate.evidence.some((e) => e.includes("home quadrant"))).toBe(true);

    const fullResult = GameRecognizer.recognize(features);
    expect(fullResult.gameType).toBe("ludo");
  });

  // 4. Pool Recognition
  it("recognizes pool from 2:1 table ratio and corner/side pockets", () => {
    const features: StructuralFeatures = {
      aspectRatio: 2.0,
      circularRegionsCount: 6,
      classCounts: { coin: 0, enemy: 0, goal: 0, platform: 0, player: 0, spike: 0 },
      continuousPathDetected: false,
      cornerPocketsCount: 6,
      dimensions: { height: 500, width: 1000 },
      discreteTilesDetected: false,
      gridCellsCount: 0,
      hasBottomBaseline: false,
      hasPlayerGoalPair: false,
      hasVerticalSeparation: false,
      horizontalSegmentsCount: 0,
      isNearDoubleSquare: true,
      isNearSquare: false,
      opposingGoalZonesDetected: false,
      predictions: [],
      quadrantSymmetryDetected: false,
      reticleDetected: false,
      verticalSegmentsCount: 0,
    };

    const candidate = new PoolRecognizer().analyze(features);
    expect(candidate.gameType).toBe("pool");
    expect(candidate.confidence).toBeGreaterThanOrEqual(0.75);
    expect(candidate.evidence.some((e) => e.includes("pocket regions"))).toBe(true);

    const fullResult = GameRecognizer.recognize(features);
    expect(fullResult.gameType).toBe("pool");
  });

  // 5. Carrom Recognition
  it("recognizes carrom from 1:1 square ratio, 4 corner pockets, and central circular tokens", () => {
    const features: StructuralFeatures = {
      aspectRatio: 1.0,
      circularRegionsCount: 9,
      classCounts: { coin: 0, enemy: 0, goal: 0, platform: 0, player: 0, spike: 0 },
      continuousPathDetected: false,
      cornerPocketsCount: 4,
      dimensions: { height: 700, width: 700 },
      discreteTilesDetected: false,
      gridCellsCount: 0,
      hasBottomBaseline: false,
      hasPlayerGoalPair: false,
      hasVerticalSeparation: false,
      horizontalSegmentsCount: 0,
      isNearDoubleSquare: false,
      isNearSquare: true,
      opposingGoalZonesDetected: false,
      predictions: [],
      quadrantSymmetryDetected: false,
      reticleDetected: false,
      verticalSegmentsCount: 0,
    };

    const candidate = new CarromRecognizer().analyze(features);
    expect(candidate.gameType).toBe("carrom");
    expect(candidate.confidence).toBeGreaterThanOrEqual(0.8);

    const fullResult = GameRecognizer.recognize(features);
    expect(fullResult.gameType).toBe("carrom");
  });

  // 6. Racing Recognition
  it("recognizes racing games from continuous circuit track geometry", () => {
    const features: StructuralFeatures = {
      aspectRatio: 1.5,
      circularRegionsCount: 0,
      classCounts: { coin: 0, enemy: 0, goal: 1, platform: 0, player: 0, spike: 0 },
      continuousPathDetected: true,
      cornerPocketsCount: 0,
      dimensions: { height: 600, width: 900 },
      discreteTilesDetected: false,
      gridCellsCount: 0,
      hasBottomBaseline: false,
      hasPlayerGoalPair: false,
      hasVerticalSeparation: false,
      horizontalSegmentsCount: 0,
      isNearDoubleSquare: false,
      isNearSquare: false,
      opposingGoalZonesDetected: false,
      predictions: [],
      quadrantSymmetryDetected: false,
      reticleDetected: false,
      verticalSegmentsCount: 0,
    };

    const candidate = new RacingRecognizer().analyze(features);
    expect(candidate.gameType).toBe("racing");
    expect(candidate.confidence).toBeGreaterThanOrEqual(0.75);

    const fullResult = GameRecognizer.recognize(features);
    expect(fullResult.gameType).toBe("racing");
  });

  // 7. Puzzle Recognition
  it("recognizes puzzle games from discrete matching tiles", () => {
    const candidate = new PuzzleRecognizer().analyze({
      aspectRatio: 1.0,
      circularRegionsCount: 0,
      classCounts: { coin: 0, enemy: 0, goal: 0, platform: 0, player: 0, spike: 0 },
      continuousPathDetected: false,
      cornerPocketsCount: 0,
      dimensions: { height: 600, width: 600 },
      discreteTilesDetected: true,
      gridCellsCount: 16,
      hasBottomBaseline: false,
      hasPlayerGoalPair: false,
      hasVerticalSeparation: false,
      horizontalSegmentsCount: 0,
      isNearDoubleSquare: false,
      isNearSquare: true,
      opposingGoalZonesDetected: false,
      predictions: [],
      quadrantSymmetryDetected: false,
      reticleDetected: false,
      verticalSegmentsCount: 0,
    });

    expect(candidate.gameType).toBe("puzzle");
    expect(candidate.confidence).toBeGreaterThanOrEqual(0.7);
  });

  // 8. Shooter Recognition
  it("recognizes shooter games from crosshair reticles and target clusters", () => {
    const candidate = new ShooterRecognizer().analyze({
      aspectRatio: 1.6,
      circularRegionsCount: 0,
      classCounts: { coin: 0, enemy: 4, goal: 0, platform: 0, player: 1, spike: 0 },
      continuousPathDetected: false,
      cornerPocketsCount: 0,
      dimensions: { height: 720, width: 1152 },
      discreteTilesDetected: false,
      gridCellsCount: 0,
      hasBottomBaseline: false,
      hasPlayerGoalPair: false,
      hasVerticalSeparation: false,
      horizontalSegmentsCount: 0,
      isNearDoubleSquare: false,
      isNearSquare: false,
      opposingGoalZonesDetected: false,
      predictions: [],
      quadrantSymmetryDetected: false,
      reticleDetected: true,
      verticalSegmentsCount: 0,
    });

    expect(candidate.gameType).toBe("shooter");
    expect(candidate.confidence).toBeGreaterThanOrEqual(0.75);
  });

  // 9. Sports Recognition
  it("recognizes sports from opposing goal zones on pitch", () => {
    const candidate = new SportsRecognizer().analyze({
      aspectRatio: 1.6,
      circularRegionsCount: 1,
      classCounts: { coin: 0, enemy: 0, goal: 0, platform: 0, player: 0, spike: 0 },
      continuousPathDetected: false,
      cornerPocketsCount: 0,
      dimensions: { height: 500, width: 800 },
      discreteTilesDetected: false,
      gridCellsCount: 0,
      hasBottomBaseline: false,
      hasPlayerGoalPair: false,
      hasVerticalSeparation: false,
      horizontalSegmentsCount: 0,
      isNearDoubleSquare: false,
      isNearSquare: false,
      opposingGoalZonesDetected: true,
      predictions: [],
      quadrantSymmetryDetected: false,
      reticleDetected: false,
      verticalSegmentsCount: 0,
    });

    expect(candidate.gameType).toBe("sports");
    expect(candidate.confidence).toBeGreaterThanOrEqual(0.7);
  });

  // 10. Unknown / Ambiguous Input
  it("returns unknown when layout has insufficient or ambiguous features", () => {
    // Empty drawing / no detections
    const result = GameRecognizer.recognize({ predictions: [] });

    expect(result.gameType).toBe("unknown");
    expect(result.confidence).toBeLessThan(0.4);
    expect(result.supported).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.suggestedAction).toContain("Add more recognizable game elements");
  });

  // 11. Manual Override
  it("respects user manual override with 100% confidence", () => {
    const result = GameRecognizer.recognize(
      { predictions: [] },
      { manualOverride: "chess" },
    );

    expect(result.gameType).toBe("chess");
    expect(result.confidence).toBe(1.0);
    expect(result.source).toBe("manual");
    expect(result.supported).toBe(true); // Playable in Phase 12
  });

  // 12. Project Store Persistence & Isolation
  it("stores recognition data per project without cross-contamination", () => {
    const store = useProjectStore.getState();

    // Create Project A and Project B
    const projectA = store.createProject("Project A");
    const projectB = store.createProject("Project B");

    // Set Project A as Chess
    store.setUserSelectedGameType(projectA.id, "chess");

    // Set Project B as Platformer
    store.setUserSelectedGameType(projectB.id, "platformer");

    const state = useProjectStore.getState();
    expect(state.projectRecognitions[projectA.id]?.userSelectedGameType).toBe("chess");
    expect(state.projectRecognitions[projectB.id]?.userSelectedGameType).toBe("platformer");

    // Deleting Project A does not delete Project B
    state.removeProject(projectA.id);
    const postDeleteState = useProjectStore.getState();
    expect(postDeleteState.projectRecognitions[projectA.id]).toBeUndefined();
    expect(postDeleteState.projectRecognitions[projectB.id]?.userSelectedGameType).toBe("platformer");
  });

  // 13. GameEngineFactory Integration
  it("verifies GameEngineFactory only instantiates playable engines and rejects extensions", () => {
    // Platformer succeeds
    const platResult = GameEngineFactory.createEngine("platformer");
    expect(platResult.success).toBe(true);

    // Chess succeeds (Phase 12 playable engine)
    const chessResult = GameEngineFactory.createEngine("chess");
    expect(chessResult.success).toBe(true);

    // Ludo returns typed failure (extension point)
    const ludoResult = GameEngineFactory.createEngine("ludo");
    expect(ludoResult.success).toBe(false);
    if (!ludoResult.success) {
      expect(ludoResult.isExtensionPoint).toBe(true);
      expect(ludoResult.error).toContain("extension point");
    }

    // Unsupported returns typed failure
    const unknownResult = GameEngineFactory.createEngine("unknown-genre");
    expect(unknownResult.success).toBe(false);
    if (!unknownResult.success) {
      expect(unknownResult.isExtensionPoint).toBe(false);
    }
  });
});
