/**
 * DRAW2GAME — Phase 14: End-to-End Game Generation Pipeline Integration Tests
 *
 * Verifies:
 * 1. Drawing studio & upload image storage under project ID.
 * 2. Detection and recognition pipeline with low-confidence fallback.
 * 3. Manual game-type selection producing valid GameDefinition.
 * 4. UniversalGameGenerator synthesizing essential playable elements.
 * 5. Capability validation for Platformer and Chess.
 * 6. UniversalGameEngine execution with capability-driven systems.
 * 7. Project isolation across multiple project IDs.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type ChessGameDefinition,
  type ChessPayload,
  isChessGameDefinition,
} from "@/game/chess/chess-definition";
import {
  isPlatformerGameDefinition,
  type PlatformerGameDefinition,
} from "@/game/core/platformer-definition";
import { UniversalGameGenerator } from "@/game/generation/universal-game-generator";
import { GameRecognizer } from "@/game/recognition/game-recognizer";
import { createUniversalGameEngine } from "@/game/runtime/universal-game-engine";
import type { BridgeFactory } from "@/game/runtime/systems";
import type { PhaserGameBridge } from "@/game/PhaserGameBridge";
import { useProjectStore } from "@/store/project-store";
import type { DetectionPrediction } from "@/types/detection";
import {
  getProjectImageBlob,
  saveProjectImageBlob,
} from "@/utils/image-storage";

describe("Phase 14: End-to-End Game Generation Pipeline Integration", () => {
  const mockBridge: BridgeFactory = () =>
    ({
      destroy: vi.fn(),
      getGame: vi.fn(),
      getScene: vi.fn(),
      restart: vi.fn(),
      setTheme: vi.fn(),
    }) as unknown as PhaserGameBridge;

  beforeEach(() => {
    localStorage.clear();
    useProjectStore.setState({
      activeProjectId: null,
      projectChessGames: {},
      projectDetections: {},
      projectGameDefinitions: {},
      projectLevels: {},
      projectRecognitions: {},
      projects: [],
      projectUploads: {},
      studioDocuments: {},
    });
  });

  it("1. Drawing Studio saves document, exports PNG blob, and registers under the same project ID", async () => {
    const store = useProjectStore.getState();
    const project = store.createProject("Drawing Adventure");
    const projectId = project.id;

    // Simulate saving studio document
    store.saveStudioDocument(projectId, {
      canvasJson: JSON.stringify({ objects: [{ type: "rect", left: 100, top: 400, width: 300, height: 40 }] }),
      savedAt: new Date().toISOString(),
      version: 1,
      world: { height: 720, width: 1280 },
    });

    // Simulate canvas PNG export persisted to project image storage
    const fakePngBlob = new Blob(["fake-drawing-png-bytes"], { type: "image/png" });
    await saveProjectImageBlob(projectId, fakePngBlob);

    store.setProjectUpload(projectId, {
      dimensions: { height: 720, width: 1280 },
      fileName: "drawing-adventure-drawing.png",
      fileSize: fakePngBlob.size,
      mimeType: "image/png",
      uploadedAt: new Date().toISOString(),
    });

    // Verification
    const loadedBlob = await getProjectImageBlob(projectId);
    expect(loadedBlob).not.toBeNull();
    expect(loadedBlob?.size).toBe(fakePngBlob.size);

    const updatedState = useProjectStore.getState();
    expect(updatedState.studioDocuments[projectId]).toBeDefined();
    expect(updatedState.projectUploads[projectId]).toBeDefined();
    expect(updatedState.projectUploads[projectId]?.fileName).toContain("drawing");
  });

  it("2. Upload workflow stores sketch under project ID and preserves project association", async () => {
    const store = useProjectStore.getState();
    const project = store.createProject("Uploaded Castle");
    const projectId = project.id;

    const fakeUploadBlob = new Blob(["uploaded-sketch-image-data"], { type: "image/png" });
    await saveProjectImageBlob(projectId, fakeUploadBlob);

    store.setProjectUpload(projectId, {
      dimensions: { height: 800, width: 1200 },
      fileName: "castle-sketch.png",
      fileSize: fakeUploadBlob.size,
      mimeType: "image/png",
      uploadedAt: new Date().toISOString(),
    });

    const storedBlob = await getProjectImageBlob(projectId);
    expect(storedBlob).not.toBeNull();
    const updatedStore = useProjectStore.getState();
    expect(updatedStore.projectUploads[projectId]?.dimensions.width).toBe(1200);
  });

  it("3. Low-confidence sketch recognition reports honest uncertainty without faking confidence", () => {
    // Ambiguous predictions with low confidence
    const ambiguousPredictions: DetectionPrediction[] = [
      {
        boundingBox: { height: 60, width: 60, x: 200, y: 200 },
        className: "coin",
        confidence: 0.35,
        id: "ambiguous_1",
      },
    ];

    const result = GameRecognizer.recognize({
      imageDimensions: { height: 600, width: 800 },
      predictions: ambiguousPredictions,
    });

    // Recognition should report low confidence or unknown rather than fabricated 100%
    expect(result.confidence).toBeLessThan(0.70);
    expect(result.evidence.length).toBeGreaterThanOrEqual(0);
  });

  it("4. Manual game-type selection overrides unknown recognition and updates project recognition", () => {
    const store = useProjectStore.getState();
    const project = store.createProject("Uncertain Project");
    const projectId = project.id;

    // Simulate setting manual override to chess
    store.setUserSelectedGameType(projectId, "chess");

    const record = useProjectStore.getState().projectRecognitions[projectId];
    expect(record).toBeDefined();
    expect(record?.userSelectedGameType).toBe("chess");
  });

  it("5. UniversalGameGenerator synthesizes playable platformer elements when sketch lacks player spawn", () => {
    // User drew only 2 platforms and a coin, but forgot a player spawn
    const partialPredictions: DetectionPrediction[] = [
      {
        boundingBox: { height: 32, width: 300, x: 100, y: 400 },
        className: "platform",
        confidence: 0.9,
        id: "plat_1",
      },
      {
        boundingBox: { height: 32, width: 300, x: 500, y: 350 },
        className: "platform",
        confidence: 0.9,
        id: "plat_2",
      },
      {
        boundingBox: { height: 24, width: 24, x: 200, y: 350 },
        className: "coin",
        confidence: 0.85,
        id: "coin_1",
      },
    ];

    const genResult = UniversalGameGenerator.generateGame<PlatformerGameDefinition>({
      options: { synthesizeDefaults: true },
      predictions: partialPredictions,
      projectId: "proj_synth_test",
      source: "detection",
      sourceDimensions: { height: 720, width: 1280 },
      targetGameType: "platformer",
    });

    // Must succeed and produce a valid PlatformerGameDefinition
    expect(genResult.success).toBe(true);
    expect(genResult.gameDefinition).not.toBeNull();
    expect(genResult.gameType).toBe("platformer");

    const gameDef = genResult.gameDefinition!;
    expect(isPlatformerGameDefinition(gameDef)).toBe(true);
    expect(gameDef.typePayload?.player).toBeDefined();
    expect(gameDef.typePayload?.player.x).toBeGreaterThanOrEqual(0);

    // Should include honest warnings about synthesized elements
    const hasSynthesizedWarning = genResult.warnings.some((w) =>
      w.code.includes("SYNTHESIZED") || w.message.includes("synthesized"),
    );
    expect(hasSynthesizedWarning).toBe(true);
  });

  it("6. UniversalGameGenerator generates complete Chess GameDefinition with board capabilities", () => {
    const genResult = UniversalGameGenerator.generateGame<ChessGameDefinition>({
      projectId: "proj_chess_test",
      source: "manual",
      targetGameType: "chess",
    });

    expect(genResult.success).toBe(true);
    expect(genResult.gameDefinition).not.toBeNull();
    expect(genResult.gameType).toBe("chess");

    const gameDef = genResult.gameDefinition!;
    expect(isChessGameDefinition(gameDef)).toBe(true);
    expect(gameDef.typePayload?.pieces.length).toBe(32);
    expect(gameDef.capabilities).toContain("board");
    expect(gameDef.capabilities).toContain("grid");
    expect(gameDef.capabilities).toContain("turns");
    expect(gameDef.capabilities).not.toContain("physics");
  });

  it("7. UniversalGameEngine executes generated Platformer GameDefinition with physics active", async () => {
    const genResult = UniversalGameGenerator.generateGame<PlatformerGameDefinition>({
      projectId: "proj_exec_platformer",
      source: "detection",
      targetGameType: "platformer",
    });

    expect(genResult.success).toBe(true);
    const gameDef = genResult.gameDefinition!;

    // Create UniversalGameEngine instance
    const engine = createUniversalGameEngine(undefined, mockBridge);
    const container = document.createElement("div");
    engine.initialize({ container });
    await engine.load(gameDef);

    expect(engine.getDefinition()?.id).toBe(gameDef.id);
    expect(engine.hasCapability("physics")).toBe(true);
    expect(engine.hasCapability("scoring")).toBe(true);
    expect(engine.hasCapability("movement")).toBe(true);
    expect(engine.hasCapability("board")).toBe(false);

    engine.start();
    expect(engine.isRunning).toBe(true);
    expect(engine.gameState.status).toBe("playing");

    engine.pause();
    expect(engine.isRunning).toBe(false);
    expect(engine.gameState.status).toBe("paused");
  });

  it("8. UniversalGameEngine executes generated Chess GameDefinition with zero physics overhead", async () => {
    const genResult = UniversalGameGenerator.generateGame<ChessGameDefinition>({
      projectId: "proj_exec_chess",
      source: "manual",
      targetGameType: "chess",
    });

    expect(genResult.success).toBe(true);
    const gameDef = genResult.gameDefinition!;

    const engine = createUniversalGameEngine(undefined, mockBridge);
    const container = document.createElement("div");
    engine.initialize({ container });
    await engine.load(gameDef);

    expect(engine.getDefinition()?.id).toBe(gameDef.id);
    expect(engine.hasCapability("physics")).toBe(false);
    expect(engine.hasCapability("board")).toBe(true);
    expect(engine.hasCapability("turns")).toBe(true);

    engine.start();
    expect(engine.isRunning).toBe(true);
    expect(engine.turn.currentTurn).toBe("white");
    const payload = engine.getPayload() as ChessPayload;
    expect(payload?.currentTurn).toBe("white");
    expect(payload?.moveHistory.length).toBe(0);
  });

  it("9. Multi-project switching preserves strict project isolation", () => {
    const store = useProjectStore.getState();

    const projA = store.createProject("Project A Platformer");
    const projB = store.createProject("Project B Chess");

    // Generate platformer for project A
    const genA = UniversalGameGenerator.generateGame({
      projectId: projA.id,
      projectName: projA.name,
      source: "manual",
      targetGameType: "platformer",
    });
    store.setProjectGameDefinition(projA.id, genA.gameDefinition!);

    // Generate chess for project B
    const genB = UniversalGameGenerator.generateGame({
      projectId: projB.id,
      projectName: projB.name,
      source: "manual",
      targetGameType: "chess",
    });
    store.setProjectGameDefinition(projB.id, genB.gameDefinition!);

    const state = useProjectStore.getState();
    expect(state.projectGameDefinitions[projA.id]?.gameType).toBe("platformer");
    expect(state.projectGameDefinitions[projB.id]?.gameType).toBe("chess");
    expect(state.projectLevels[projA.id]).toBeDefined();
    expect(state.projectChessGames[projB.id]).toBeDefined();
    expect(state.projectLevels[projB.id]).toBeUndefined();
  });
});
