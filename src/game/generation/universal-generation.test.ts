/**
 * DRAW2GAME — Phase 13: Universal Game Generation Architecture Tests
 * Comprehensive test suite verifying:
 * 1. Platformer generation
 * 2. Chess generation
 * 3. Invalid platformer generation rejection
 * 4. Invalid chess generation rejection
 * 5. Generator selection & custom generator registration
 * 6. Unsupported future game type extension-point handling
 * 7. Recognition → generation integration
 * 8. Validation layer (Generic, Platformer, Chess)
 * 9. Project store isolation and two-way synchronization
 * 10. Deterministic generation
 * 11. Existing Platformer regression preservation
 * 12. Existing Chess regression preservation
 * 13. GameEngineFactory integration
 * 14. Existing Phase 11 GameRecognizer integration
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  type ChessGameDefinition,
  type ChessSquare,
} from "@/game/chess/chess-definition";
import { GameEngineFactory } from "@/game/core/game-engine-factory";
import type { PlatformerGameDefinition } from "@/game/core/platformer-definition";
import {
  ChessValidator,
  type GameDefinitionGenerator,
  type GameGenerationInput,
  GenericGameValidator,
  PlatformerValidator,
  UniversalGameGenerator,
} from "@/game/generation";
import { UniversalGameEngine } from "@/game/runtime/universal-game-engine";
import { GameRecognizer } from "@/game/recognition/game-recognizer";
import { useProjectStore } from "@/store/project-store";

describe("Phase 13: Universal Game Generation Architecture", () => {
  beforeEach(() => {
    UniversalGameGenerator.resetGenerators();
  });

  // 1. Platformer Generation
  describe("1. Platformer Generation", () => {
    it("generates a valid, complete PlatformerGameDefinition from predictions", () => {
      const input: GameGenerationInput = {
        predictions: [
          {
            boundingBox: { height: 48, width: 32, x: 100, y: 300 },
            className: "player",
            confidence: 0.95,
            id: "pred_p1",
          },
          {
            boundingBox: { height: 32, width: 200, x: 50, y: 400 },
            className: "platform",
            confidence: 0.9,
            id: "pred_plat1",
          },
          {
            boundingBox: { height: 24, width: 24, x: 150, y: 250 },
            className: "coin",
            confidence: 0.88,
            id: "pred_c1",
          },
          {
            boundingBox: { height: 60, width: 40, x: 600, y: 340 },
            className: "goal",
            confidence: 0.92,
            id: "pred_g1",
          },
        ],
        projectId: "proj_plat_1",
        projectName: "Test Platformer",
        source: "detection",
        targetGameType: "platformer",
      };

      const result = UniversalGameGenerator.generateGame<PlatformerGameDefinition>(input);

      expect(result.success).toBe(true);
      expect(result.gameType).toBe("platformer");
      expect(result.gameDefinition).not.toBeNull();
      expect(result.errors).toHaveLength(0);

      const def = result.gameDefinition!;
      expect(def.id).toBe("proj_plat_1");
      expect(def.name).toBe("Test Platformer");
      expect(def.gameType).toBe("platformer");
      expect(def.engineConfig.engineId).toBe("universal-2d-engine");
      expect(def.capabilities).toContain("physics");
      expect(def.capabilities).toContain("collision");
      expect(def.typePayload?.player).toBeDefined();
      expect(def.typePayload?.player.x).toBe(100);
      expect(def.typePayload?.platforms).toHaveLength(1);
      expect(def.typePayload?.coins).toHaveLength(1);
      expect(def.typePayload?.goal).not.toBeNull();
      expect(def.rules.length).toBeGreaterThan(0);
    });
  });

  // 2. Chess Generation
  describe("2. Chess Generation", () => {
    it("generates a standard playable ChessGameDefinition when no piece overrides are provided", () => {
      const input: GameGenerationInput = {
        projectId: "proj_chess_1",
        projectName: "Grandmaster Match",
        source: "manual",
        targetGameType: "chess",
      };

      const result = UniversalGameGenerator.generateGame<ChessGameDefinition>(input);

      expect(result.success).toBe(true);
      expect(result.gameType).toBe("chess");
      expect(result.gameDefinition).not.toBeNull();
      expect(result.errors).toHaveLength(0);

      const def = result.gameDefinition!;
      expect(def.typePayload?.pieces).toHaveLength(32);
      expect(def.typePayload?.boardSize).toBe(8);
      expect(def.typePayload?.currentTurn).toBe("white");
      expect(def.objects).toHaveLength(32);
      expect(def.rules).toHaveLength(4);
    });

    it("generates custom ChessGameDefinition from structured understanding pieces", () => {
      const input: GameGenerationInput = {
        genreSpecificData: {
          currentTurn: "black",
          orientation: "white",
          pieces: [
            { color: "white", id: "wk1", square: "e1", type: "king" },
            { color: "black", id: "bk1", square: "e8", type: "king" },
            { color: "white", id: "wq1", square: "d1", type: "queen" },
          ],
        },
        projectId: "proj_chess_endgame",
        projectName: "Endgame Puzzle",
        source: "drawing",
        targetGameType: "chess",
      };

      const result = UniversalGameGenerator.generateGame<ChessGameDefinition>(input);

      expect(result.success).toBe(true);
      expect(result.gameType).toBe("chess");
      const def = result.gameDefinition!;
      expect(def.typePayload?.pieces).toHaveLength(3);
      expect(def.typePayload?.currentTurn).toBe("black");
    });
  });

  // 3. Invalid Platformer Generation
  describe("3. Invalid Platformer Generation", () => {
    it("rejects platformer generation when player entity is missing", () => {
      const input: GameGenerationInput = {
        predictions: [
          {
            boundingBox: { height: 32, width: 200, x: 50, y: 400 },
            className: "platform",
            confidence: 0.9,
            id: "pred_plat1",
          },
        ],
        projectId: "proj_invalid_plat",
        source: "detection",
        targetGameType: "platformer",
      };

      const result = UniversalGameGenerator.generateGame(input);

      expect(result.success).toBe(false);
      expect(result.gameDefinition).toBeNull();
      expect(result.errors.some((e) => e.code === "PLAYER_MISSING")).toBe(true);
    });

    it("rejects platformer with negative or zero dimensions", () => {
      const invalidDef = {
        assets: [],
        engineConfig: { engineId: "phaser-matter" },
        gameType: "platformer" as const,
        id: "bad_def",
        name: "Bad Def",
        objects: [],
        rules: [],
        settings: {},
        typePayload: {
          coins: [],
          enemies: [],
          gameMode: "single-screen" as const,
          goal: null,
          physics: { gravityY: 1400, jumpVelocity: -520 },
          platforms: [],
          player: { height: -10, id: "p1", width: 0, x: 10, y: 10 },
          spikes: [],
        },
        version: 1,
        viewport: { height: 720, width: 1280 },
      } as unknown as PlatformerGameDefinition;

      const validation = PlatformerValidator.validate(invalidDef);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes("invalid dimensions"))).toBe(true);
    });
  });

  // 4. Invalid Chess Generation
  describe("4. Invalid Chess Generation", () => {
    it("rejects chess board missing white king", () => {
      const input: GameGenerationInput = {
        genreSpecificData: {
          currentTurn: "white",
          pieces: [
            { color: "black", id: "bk1", square: "e8", type: "king" },
            { color: "white", id: "wq1", square: "e1", type: "queen" },
          ],
        },
        projectId: "proj_no_white_king",
        source: "manual",
        targetGameType: "chess",
      };

      const result = UniversalGameGenerator.generateGame(input);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.code === "MISSING_WHITE_KING")).toBe(true);
    });

    it("rejects chess board missing black king", () => {
      const input: GameGenerationInput = {
        genreSpecificData: {
          currentTurn: "white",
          pieces: [
            { color: "white", id: "wk1", square: "e1", type: "king" },
            { color: "white", id: "wp1", square: "e2", type: "pawn" },
          ],
        },
        projectId: "proj_no_black_king",
        source: "manual",
        targetGameType: "chess",
      };

      const result = UniversalGameGenerator.generateGame(input);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.code === "MISSING_BLACK_KING")).toBe(true);
    });

    it("rejects chess board with duplicate pieces on the same square", () => {
      const input: GameGenerationInput = {
        genreSpecificData: {
          currentTurn: "white",
          pieces: [
            { color: "white", id: "wk1", square: "e1", type: "king" },
            { color: "black", id: "bk1", square: "e8", type: "king" },
            { color: "white", id: "wq1", square: "e1", type: "queen" }, // Collision on e1!
          ],
        },
        projectId: "proj_dup_square",
        source: "manual",
        targetGameType: "chess",
      };

      const result = UniversalGameGenerator.generateGame(input);

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.code === "DUPLICATE_SQUARE_OCCUPANCY")).toBe(true);
    });

    it("rejects chess board with invalid algebraic coordinates", () => {
      const invalidChessDef: ChessGameDefinition = {
        assets: [],
        engineConfig: { engineId: "chess-engine" },
        gameType: "chess",
        id: "bad_sq",
        name: "Bad Square",
        objects: [],
        rules: [],
        settings: {},
        typePayload: {
          boardSize: 8,
          capturedBlack: [],
          capturedWhite: [],
          currentTurn: "white",
          gameStatus: "in-progress",
          moveHistory: [],
          orientation: "white",
          pieces: [
            { color: "white", id: "wk1", square: "z9" as unknown as ChessSquare, type: "king" },
            { color: "black", id: "bk1", square: "e8", type: "king" },
          ],
        },
        version: 1,
        viewport: { height: 800, width: 800 },
      };

      const validation = ChessValidator.validate(invalidChessDef);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes("invalid square"))).toBe(true);
    });
  });

  // 5. Universal Generator Extensibility & Custom Generators
  describe("5. Universal Generator Extensibility & Custom Generators", () => {
    it("generates platformer and chess without game-specific generator subclasses", () => {
      const platResult = UniversalGameGenerator.generateGame({
        projectId: "test_gen_plat",
        source: "manual",
        targetGameType: "platformer",
      });
      expect(platResult.gameType).toBe("platformer");
      expect(platResult.gameDefinition?.capabilities).toContain("physics");

      const chessResult = UniversalGameGenerator.generateGame({
        projectId: "test_gen_chess",
        source: "manual",
        targetGameType: "chess",
      });
      expect(chessResult.gameType).toBe("chess");
      expect(chessResult.gameDefinition?.capabilities).toContain("board");
    });

    it("allows registering and unregistering custom generator", () => {
      const customGen: GameDefinitionGenerator = {
        canHandle: (type) => type === "custom-runner",
        gameType: "platformer",
        generate: (input) => ({
          confidence: 1.0,
          errors: [],
          gameDefinition: {
            assets: [],
            engineConfig: { engineId: "custom" },
            gameType: "platformer",
            id: input.projectId,
            name: "Custom",
            objects: [],
            rules: [],
            settings: {},
            version: 1,
            viewport: { height: 600, width: 800 },
          },
          gameType: "platformer",
          isExtensionPoint: false,
          metadata: { generatedAt: "", generatorId: "custom-runner-gen" },
          success: true,
          warnings: [],
        }),
        generatorId: "custom-runner-gen",
      };

      UniversalGameGenerator.registerGenerator(customGen);
      expect(UniversalGameGenerator.findGenerator("custom-runner")).toBe(customGen);

      UniversalGameGenerator.unregisterGenerator("custom-runner-gen");
      expect(UniversalGameGenerator.findGenerator("custom-runner")).toBeUndefined();
    });
  });

  // 6. Unsupported Future Game Types (Extension Points)
  describe("6. Unsupported Future Game Types", () => {
    const extensionTypes = [
      "ludo",
      "pool",
      "carrom",
      "racing",
      "puzzle",
      "shooter",
      "sports",
    ] as const;

    extensionTypes.forEach((extType) => {
      it(`gracefully reports extension point status for ${extType}`, () => {
        const input: GameGenerationInput = {
          projectId: `proj_${extType}`,
          source: "manual",
          targetGameType: extType,
        };

        const result = UniversalGameGenerator.generateGame(input);

        expect(result.success).toBe(false);
        expect(result.isExtensionPoint).toBe(true);
        expect(result.gameDefinition).toBeNull();
        expect(result.gameType).toBe(extType);
        expect(result.errors[0]?.code).toBe("EXTENSION_POINT_UNIMPLEMENTED");
      });
    });
  });

  // 7. Recognition → Generation Integration
  describe("7. Recognition → Generation Integration", () => {
    it("generates platformer definition from recognition result", () => {
      const platformerPredictions = [
        { boundingBox: { height: 30, width: 300, x: 50, y: 650 }, className: "platform" as const, confidence: 0.95, id: "plat-ground" },
        { boundingBox: { height: 25, width: 200, x: 200, y: 450 }, className: "platform" as const, confidence: 0.92, id: "plat-mid" },
        { boundingBox: { height: 40, width: 30, x: 80, y: 600 }, className: "player" as const, confidence: 0.9, id: "player-1" },
        { boundingBox: { height: 50, width: 30, x: 1100, y: 400 }, className: "goal" as const, confidence: 0.91, id: "goal-1" },
      ];

      const recResult = GameRecognizer.recognize({
        imageDimensions: { height: 720, width: 1280 },
        predictions: platformerPredictions,
      });

      expect(recResult.gameType).toBe("platformer");

      const genResult = UniversalGameGenerator.generateGame({
        predictions: platformerPredictions,
        projectId: "proj_rec_test",
        recognitionResult: recResult,
        source: "detection",
      });

      expect(genResult.success).toBe(true);
      expect(genResult.gameType).toBe("platformer");
    });
  });

  // 8. Generic Game Validator
  describe("8. Generic Game Validator", () => {
    it("rejects non-object or null definitions", () => {
      expect(GenericGameValidator.validate(null).isValid).toBe(false);
      expect(GenericGameValidator.validate(undefined).isValid).toBe(false);
      expect(GenericGameValidator.validate("not an object").isValid).toBe(false);
    });

    it("rejects definitions with invalid viewport dimensions", () => {
      const def = {
        assets: [],
        engineConfig: { engineId: "test" },
        gameType: "platformer",
        id: "id_1",
        name: "Test",
        objects: [],
        rules: [],
        settings: {},
        version: 1,
        viewport: { height: -50, width: 0 },
      };

      const result = GenericGameValidator.validate(def);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("Viewport"))).toBe(true);
    });
  });

  // 9. Project Isolation
  describe("9. Project Isolation", () => {
    it("maintains separate game definitions across different projects", () => {
      const store = useProjectStore.getState();

      const projA = store.createProject("Project A");
      const projB = store.createProject("Project B");

      const platInput: GameGenerationInput = {
        predictions: [
          { boundingBox: { height: 48, width: 32, x: 50, y: 300 }, className: "player", confidence: 0.9, id: "p1" },
          { boundingBox: { height: 32, width: 180, x: 40, y: 380 }, className: "platform", confidence: 0.9, id: "plat1" },
          { boundingBox: { height: 50, width: 40, x: 500, y: 330 }, className: "goal", confidence: 0.9, id: "g1" },
        ],
        projectId: projA.id,
        source: "detection",
        targetGameType: "platformer",
      };

      const chessInput: GameGenerationInput = {
        projectId: projB.id,
        source: "manual",
        targetGameType: "chess",
      };

      const resA = UniversalGameGenerator.generateGame(platInput);
      const resB = UniversalGameGenerator.generateGame(chessInput);

      expect(resA.success).toBe(true);
      expect(resB.success).toBe(true);

      store.setProjectGameDefinition(projA.id, resA.gameDefinition!);
      store.setProjectGameDefinition(projB.id, resB.gameDefinition!);

      const state = useProjectStore.getState();
      expect(state.projectGameDefinitions[projA.id]?.gameType).toBe("platformer");
      expect(state.projectGameDefinitions[projB.id]?.gameType).toBe("chess");

      // Verify two-way synchronization
      expect(state.projectLevels[projA.id]?.name).toBeDefined();
      expect(state.projectChessGames[projB.id]?.typePayload?.pieces).toHaveLength(32);

      // Clean up Project A does not affect Project B
      store.removeProject(projA.id);
      const afterState = useProjectStore.getState();
      expect(afterState.projectGameDefinitions[projA.id]).toBeUndefined();
      expect(afterState.projectGameDefinitions[projB.id]).toBeDefined();
    });
  });

  // 10. Deterministic Generation
  describe("10. Deterministic Generation", () => {
    it("produces identical game objects and properties for identical inputs", () => {
      const input: GameGenerationInput = {
        predictions: [
          { boundingBox: { height: 48, width: 32, x: 100, y: 200 }, className: "player", confidence: 0.95, id: "p1" },
          { boundingBox: { height: 32, width: 120, x: 80, y: 280 }, className: "platform", confidence: 0.89, id: "plat1" },
          { boundingBox: { height: 20, width: 20, x: 150, y: 160 }, className: "coin", confidence: 0.91, id: "c1" },
        ],
        projectId: "proj_det",
        projectName: "Deterministic Test",
        source: "detection",
        targetGameType: "platformer",
      };

      const res1 = UniversalGameGenerator.generateGame<PlatformerGameDefinition>(input);
      const res2 = UniversalGameGenerator.generateGame<PlatformerGameDefinition>(input);

      expect(res1.gameDefinition?.typePayload?.player).toEqual(res2.gameDefinition?.typePayload?.player);
      expect(res1.gameDefinition?.typePayload?.platforms).toEqual(res2.gameDefinition?.typePayload?.platforms);
      expect(res1.gameDefinition?.typePayload?.coins).toEqual(res2.gameDefinition?.typePayload?.coins);
    });
  });

  // 11. UniversalGameEngine Compatibility for Generated Platformer
  describe("11. UniversalGameEngine Compatibility for Generated Platformer", () => {
    it("creates live UniversalGameEngine for generated platformer game definition", () => {
      const input: GameGenerationInput = {
        predictions: [
          { boundingBox: { height: 48, width: 32, x: 100, y: 200 }, className: "player", confidence: 0.95, id: "p1" },
          { boundingBox: { height: 32, width: 120, x: 80, y: 280 }, className: "platform", confidence: 0.89, id: "plat1" },
        ],
        projectId: "proj_plat_engine",
        source: "detection",
        targetGameType: "platformer",
      };

      const genResult = UniversalGameGenerator.generateGame(input);
      expect(genResult.success).toBe(true);

      const engineResult = GameEngineFactory.createEngine(genResult.gameType);
      expect(engineResult.success).toBe(true);
      if (engineResult.success) {
        expect(engineResult.engine).toBeInstanceOf(UniversalGameEngine);
        expect(engineResult.engine.engineId).toBe("universal-2d-engine");
      }
    });
  });

  // 12. UniversalGameEngine Compatibility for Generated Chess
  describe("12. UniversalGameEngine Compatibility for Generated Chess", () => {
    it("creates live UniversalGameEngine for generated chess game definition", () => {
      const input: GameGenerationInput = {
        projectId: "proj_chess_engine",
        source: "manual",
        targetGameType: "chess",
      };

      const genResult = UniversalGameGenerator.generateGame(input);
      expect(genResult.success).toBe(true);

      const engineResult = GameEngineFactory.createEngine(genResult.gameType);
      expect(engineResult.success).toBe(true);
      if (engineResult.success) {
        expect(engineResult.engine).toBeInstanceOf(UniversalGameEngine);
        expect(engineResult.engine.engineId).toBe("universal-2d-engine");
      }
    });
  });
});
