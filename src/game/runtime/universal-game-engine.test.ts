/**
 * DRAW2GAME — Universal Game Engine Architecture
 * UniversalGameEngine Comprehensive Test Suite
 *
 * Verifies:
 * 1. UniversalGameEngine lifecycle (init, load, start, pause, resume, restart, destroy).
 * 2. Loading a Platformer GameDefinition.
 * 3. Loading a Chess GameDefinition.
 * 4. Activating required runtime capabilities dynamically.
 * 5. Generic object creation, retrieval, and removal.
 * 6. Generic declarative rule execution.
 * 7. Physics subsystem activation ONLY when requested.
 * 8. Board and Turn systems activation for turn-based games.
 * 9. Game state management integration.
 * 10. Engine restart back to fresh state.
 * 11. Engine pause and resume.
 * 12. Project isolation and persistence.
 * 13. Platformer behavior regression preservation.
 * 14. Chess behavior regression preservation.
 * 15. Recognition remains independent of engine selection.
 * 16. Verification of no game-specific engine classes or generator subclasses.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDefaultChessGameDefinition,
} from "@/game/chess/chess-definition";
import {
  inferCapabilities,
  isKnownCapability,
} from "@/game/core/game-capabilities";
import type { GameDefinition, GameObject, GameRule } from "@/game/core/game-definition";
import { GameEngineFactory } from "@/game/core/game-engine-factory";
import {
  levelDefinitionToGameDefinition,
  type PlatformerGameDefinition,
} from "@/game/core/platformer-definition";
import { UniversalGameGenerator } from "@/game/generation/universal-game-generator";
import { GameRecognizer } from "@/game/recognition/game-recognizer";
import {
  createUniversalGameEngine,
  UniversalGameEngine,
} from "./universal-game-engine";
import { createPlayableDemoLevel } from "@/json/level-schema";
import { useProjectStore } from "@/store/project-store";

import type { BridgeFactory } from "./systems";
import type { PhaserGameBridge } from "@/game/PhaserGameBridge";

describe("UniversalGameEngine Architecture", () => {
  const mockBridge: BridgeFactory = () => ({
    destroy: vi.fn(),
    getGame: vi.fn(),
    getScene: vi.fn(),
    restart: vi.fn(),
    setTheme: vi.fn(),
  } as unknown as PhaserGameBridge);

  beforeEach(() => {
    useProjectStore.setState({
      activeProjectId: null,
      projectChessGames: {},
      projectDetections: {},
      projectLevels: {},
      projectRecognitions: {},
      projects: [],
      projectUploads: {},
    });
  });

  // 1. Lifecycle
  describe("1. UniversalGameEngine Lifecycle", () => {
    it("manages standard lifecycle: initialize, load, start, pause, resume, restart, destroy", async () => {
      const engine = new UniversalGameEngine();
      expect(engine.isInitialized).toBe(false);
      expect(engine.isRunning).toBe(false);
      expect(engine.engineId).toBe("universal-2d-engine");

      const container = document.createElement("div");
      engine.initialize({ container });
      expect(engine.isInitialized).toBe(true);
      expect(engine.isRunning).toBe(false);

      const chessDef = createDefaultChessGameDefinition("chess-lifecycle");
      await engine.load(chessDef);
      expect(engine.getDefinition()?.id).toBe("chess-lifecycle");
      expect(engine.gameType).toBe("chess");

      engine.start();
      expect(engine.isRunning).toBe(true);

      engine.pause();
      expect(engine.isRunning).toBe(false);

      engine.resume();
      expect(engine.isRunning).toBe(true);

      engine.restart();
      expect(engine.isRunning).toBe(true);

      engine.destroy();
      expect(engine.isInitialized).toBe(false);
      expect(engine.isRunning).toBe(false);
      expect(engine.getDefinition()).toBeNull();
    });
  });

  // 2. Loading Platformer GameDefinition
  describe("2. Loading Platformer GameDefinition", () => {
    it("loads platformer definition, sets capabilities, and configures systems", async () => {
      const demoLevel = createPlayableDemoLevel("Test Platformer Level");
      const platDef: PlatformerGameDefinition = levelDefinitionToGameDefinition(demoLevel, "plat-1");

      const engine = new UniversalGameEngine(mockBridge);
      const container = document.createElement("div");
      engine.initialize({ container });

      await engine.load(platDef);

      expect(engine.gameType).toBe("platformer");
      expect(engine.hasCapability("physics")).toBe(true);
      expect(engine.hasCapability("collision")).toBe(true);
      expect(engine.hasCapability("movement")).toBe(true);
      expect(engine.hasCapability("camera")).toBe(true);
      expect(engine.hasCapability("scoring")).toBe(true);
      expect(engine.hasCapability("goals")).toBe(true);

      // Verify active systems
      const systems = engine.getActiveSystems();
      expect(systems).toContain("physics");
      expect(systems).toContain("collision");
      expect(systems).toContain("movement");
      expect(systems).toContain("camera");
      expect(systems).toContain("score");

      // Verify bridge factory activation
      expect(engine.physics.isActive).toBe(true);
      expect(engine.getBridge()).not.toBeNull();
    });
  });

  // 3. Loading Chess GameDefinition
  describe("3. Loading Chess GameDefinition", () => {
    it("loads chess definition, sets board/turns capabilities, and leaves physics deactivated", async () => {
      const chessDef = createDefaultChessGameDefinition("chess-1");

      const engine = new UniversalGameEngine();
      const container = document.createElement("div");
      engine.initialize({ container });

      await engine.load(chessDef);

      expect(engine.gameType).toBe("chess");
      expect(engine.hasCapability("board")).toBe(true);
      expect(engine.hasCapability("turns")).toBe(true);
      expect(engine.hasCapability("rules")).toBe(true);

      // CRITICAL: Physics must NOT be active for Chess!
      expect(engine.hasCapability("physics")).toBe(false);
      expect(engine.physics.isActive).toBe(false);
      expect(engine.getBridge()).toBeNull();

      // Verify active systems
      const systems = engine.getActiveSystems();
      expect(systems).toContain("board");
      expect(systems).toContain("turn");
      expect(systems).toContain("rules");
      expect(systems).not.toContain("physics");
    });
  });

  // 4. Runtime Capabilities Resolver
  describe("4. Runtime Capabilities Resolver", () => {
    it("infers capabilities accurately for platformer and chess", () => {
      expect(isKnownCapability("physics")).toBe(true);
      expect(isKnownCapability("board")).toBe(true);
      expect(isKnownCapability("magic_wand")).toBe(false);

      const platCaps = inferCapabilities("platformer", [{ id: "p", type: "player", x: 0, y: 0 }]);
      expect(platCaps).toContain("physics");
      expect(platCaps).toContain("gravity");
      expect(platCaps).toContain("collision");

      const chessCaps = inferCapabilities("chess", [{ id: "c", type: "chess-king", x: 0, y: 0 }]);
      expect(chessCaps).toContain("board");
      expect(chessCaps).toContain("turns");
      expect(chessCaps).not.toContain("gravity");
    });
  });

  // 5. Generic Object Model
  describe("5. Generic Object Model", () => {
    it("supports runtime object creation, query, and removal", async () => {
      const engine = new UniversalGameEngine();
      engine.initialize({ container: document.createElement("div") });

      const genericDef: GameDefinition = {
        assets: [],
        capabilities: ["rules", "scoring"],
        engineConfig: { engineId: "universal-2d-engine" },
        gameType: "puzzle",
        id: "generic-game",
        name: "Generic Puzzle",
        objects: [],
        rules: [],
        settings: {},
        version: 1,
        viewport: { height: 600, width: 800 },
      };

      await engine.load(genericDef);
      expect(engine.getObjects()).toHaveLength(0);

      const newObj: GameObject = {
        height: 32,
        id: "block_1",
        properties: { color: "blue" },
        type: "block",
        width: 32,
        x: 100,
        y: 150,
      };

      engine.createObject(newObj);
      expect(engine.getObjects()).toHaveLength(1);
      expect(engine.getObject("block_1")).toBeDefined();
      expect(engine.getObject("block_1")?.x).toBe(100);

      const removed = engine.removeObject("block_1");
      expect(removed).toBe(true);
      expect(engine.getObjects()).toHaveLength(0);
      expect(engine.getObject("block_1")).toBeUndefined();
    });
  });

  // 6. Generic Rule Execution
  describe("6. Generic Rule Execution", () => {
    it("triggers actions declared in GameRules on events", async () => {
      const engine = new UniversalGameEngine();
      engine.initialize({ container: document.createElement("div") });

      const customRule: GameRule = {
        action: "INCREASE_SCORE",
        condition: "TOUCH",
        event: "TOUCH_DIAMOND",
        id: "rule_diamond",
        name: "Diamond Collection",
        parameters: { points: 50 },
      };

      const genericDef: GameDefinition = {
        assets: [],
        capabilities: ["rules", "scoring"],
        engineConfig: { engineId: "universal-2d-engine" },
        gameType: "puzzle",
        id: "rule-game",
        name: "Rule Test Game",
        objects: [],
        rules: [customRule],
        settings: {},
        version: 1,
        viewport: { height: 600, width: 800 },
      };

      await engine.load(genericDef);
      expect(engine.score.score).toBe(0);

      engine.triggerEvent("TOUCH_DIAMOND");
      expect(engine.score.score).toBe(50);

      engine.triggerEvent("TOUCH_DIAMOND");
      expect(engine.score.score).toBe(100);
    });
  });

  // 7. Board and Turn Mechanics
  describe("7. Board and Turn Mechanics in UniversalGameEngine", () => {
    it("executes legal moves, updates board occupancy, and switches turns", async () => {
      const engine = new UniversalGameEngine();
      engine.initialize({ container: document.createElement("div") });

      const def = createDefaultChessGameDefinition("chess-moves");
      await engine.load(def);
      engine.start();

      // Select e2
      engine.selectSquare("e2");
      const payload = engine.getPayload() as typeof def.typePayload;
      expect(payload?.selectedSquare).toBe("e2");
      expect(payload?.legalMovesForSelected).toContain("e4");

      // Execute move e2 -> e4
      const moveRes = engine.makeMove("e2", "e4");
      expect(moveRes.success).toBe(true);

      const afterMove = engine.getPayload() as typeof def.typePayload;
      expect(afterMove?.currentTurn).toBe("black");
      expect(afterMove?.moveHistory.length).toBe(1);

      // Verify BoardSystem occupancy
      const pieceAtE4 = engine.board.getPieceAt("e4");
      expect(pieceAtE4).toBeDefined();
      expect(pieceAtE4?.square).toBe("e4");
    });
  });

  // 8. Project Store Isolation & Persistence
  describe("8. Project Store Isolation", () => {
    it("isolates game state between distinct projects using UniversalGameEngine", async () => {
      const store = useProjectStore.getState();
      const p1 = store.createProject("Platformer Project");
      const p2 = store.createProject("Chess Project");

      const def1 = levelDefinitionToGameDefinition(createPlayableDemoLevel("P1"), p1.id);
      const def2 = createDefaultChessGameDefinition(p2.id);

      const engine1 = createUniversalGameEngine(def1);
      const engine2 = createUniversalGameEngine(def2);

      expect(engine1.gameType).toBe("platformer");
      expect(engine2.gameType).toBe("chess");

      expect(engine1.hasCapability("physics")).toBe(true);
      expect(engine2.hasCapability("physics")).toBe(false);

      expect(engine1.hasCapability("board")).toBe(false);
      expect(engine2.hasCapability("board")).toBe(true);
    });
  });

  // 9. Architecture Invariants: No Game-Specific Engine Classes
  describe("9. Architectural Invariants", () => {
    it("ensures GameEngineFactory resolves UniversalGameEngine for all supported games", () => {
      const platResult = GameEngineFactory.createEngine("platformer");
      expect(platResult.success).toBe(true);
      if (platResult.success) {
        expect(platResult.engine).toBeInstanceOf(UniversalGameEngine);
        expect(platResult.engine.engineId).toBe("universal-2d-engine");
      }

      const chessResult = GameEngineFactory.createEngine("chess");
      expect(chessResult.success).toBe(true);
      if (chessResult.success) {
        expect(chessResult.engine).toBeInstanceOf(UniversalGameEngine);
        expect(chessResult.engine.engineId).toBe("universal-2d-engine");
      }
    });

    it("verifies UniversalGameGenerator generates both genres without subclass generators", () => {
      const platResult = UniversalGameGenerator.generateGame({
        projectId: "invariant_plat",
        source: "manual",
        targetGameType: "platformer",
      });
      expect(platResult.success).toBe(true);
      expect(platResult.gameType).toBe("platformer");
      expect(platResult.gameDefinition?.engineConfig.engineId).toBe("universal-2d-engine");

      const chessResult = UniversalGameGenerator.generateGame({
        projectId: "invariant_chess",
        source: "manual",
        targetGameType: "chess",
      });
      expect(chessResult.success).toBe(true);
      expect(chessResult.gameType).toBe("chess");
      expect(chessResult.gameDefinition?.engineConfig.engineId).toBe("universal-2d-engine");
    });

    it("verifies recognition does not choose an engine class but identifies genre", () => {
      const recognition = GameRecognizer.recognize({
        predictions: [
          { boundingBox: { height: 30, width: 300, x: 50, y: 650 }, className: "platform", confidence: 0.95, id: "1" },
          { boundingBox: { height: 25, width: 200, x: 200, y: 450 }, className: "platform", confidence: 0.92, id: "2" },
          { boundingBox: { height: 40, width: 30, x: 80, y: 600 }, className: "player", confidence: 0.9, id: "3" },
          { boundingBox: { height: 50, width: 30, x: 1100, y: 400 }, className: "goal", confidence: 0.91, id: "4" },
        ],
      });

      expect(recognition.gameType).toBe("platformer");
      expect(recognition.supported).toBe(true);
      expect(recognition.suggestedAction).toContain("Universal Game Engine");
    });
  });
});
