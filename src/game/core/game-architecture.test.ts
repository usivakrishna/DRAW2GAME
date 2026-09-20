import { beforeEach, describe, expect, it } from "vitest";
import {
  EXTENSION_GAME_TYPES,
  isKnownGameType,
  isSupportedGameType,
  SUPPORTED_GAME_TYPES,
} from "./game-definition";
import { GameEngineFactory } from "./game-engine-factory";
import {
  DEFAULT_PLATFORMER_RULES,
  ensureGameDefinition,
  gameDefinitionToLevelDefinition,
  isLevelDefinition,
  isPlatformerGameDefinition,
  levelDefinitionToGameDefinition,
  platformerEntitiesToGameObjects,
} from "./platformer-definition";
import { PlatformerEngine } from "./platformer-engine";
import { applyEditCommand } from "@/game-editor/level-modifier";
import { parseEditCommand } from "@/game-editor/command-parser";
import {
  createPlayableDemoLevel,
  type LevelDefinition,
} from "@/json/level-schema";

describe("Phase 10: Universal 2D Game Architecture", () => {
  let sampleLevel: LevelDefinition;

  beforeEach(() => {
    sampleLevel = createPlayableDemoLevel("Space Odyssey");
    GameEngineFactory.clearCustomEngines();
  });

  describe("1. GameDefinition & GameType Model", () => {
    it("identifies supported and extension game types correctly", () => {
      expect(isSupportedGameType("platformer")).toBe(true);
      expect(isSupportedGameType("chess")).toBe(true);
      expect(isSupportedGameType("ludo")).toBe(false);
      expect(isSupportedGameType("unknown")).toBe(false);

      expect(isKnownGameType("platformer")).toBe(true);
      expect(isKnownGameType("chess")).toBe(true);
      expect(isKnownGameType("ludo")).toBe(true);
      expect(isKnownGameType("pool")).toBe(true);
      expect(isKnownGameType("carrom")).toBe(true);
      expect(isKnownGameType("racing")).toBe(true);
      expect(isKnownGameType("shooter")).toBe(true);
      expect(isKnownGameType("sports")).toBe(true);
      expect(isKnownGameType("alien_invasion")).toBe(false);
    });

    it("verifies supported and extension type constants", () => {
      expect(SUPPORTED_GAME_TYPES).toContain("platformer");
      expect(SUPPORTED_GAME_TYPES).toContain("chess");
      expect(EXTENSION_GAME_TYPES.length).toBeGreaterThanOrEqual(7);
      expect(EXTENSION_GAME_TYPES).toContain("ludo");
      expect(EXTENSION_GAME_TYPES).toContain("pool");
    });
  });

  describe("2. Generic Object & Rule Mapping", () => {
    it("transforms platformer entities into generic GameObjects", () => {
      const objects = platformerEntitiesToGameObjects(sampleLevel);

      const playerObj = objects.find((o) => o.type === "player");
      expect(playerObj).toBeDefined();
      expect(playerObj?.x).toBe(sampleLevel.player.x);
      expect(playerObj?.y).toBe(sampleLevel.player.y);
      expect(playerObj?.properties?.spawnFacing).toBe(sampleLevel.player.spawnFacing);

      const platformObjs = objects.filter((o) => o.type === "platform");
      expect(platformObjs.length).toBe(sampleLevel.platforms.length);

      const coinObjs = objects.filter((o) => o.type === "coin");
      expect(coinObjs.length).toBe(sampleLevel.coins.length);

      const enemyObjs = objects.filter((o) => o.type === "enemy");
      expect(enemyObjs.length).toBe(sampleLevel.enemies.length);

      const spikeObjs = objects.filter((o) => o.type === "spike");
      expect(spikeObjs.length).toBe(sampleLevel.spikes.length);

      const goalObj = objects.find((o) => o.type === "goal");
      expect(goalObj).toBeDefined();
      expect(goalObj?.x).toBe(sampleLevel.goal?.x);
    });

    it("includes standard platformer declarative rules", () => {
      expect(DEFAULT_PLATFORMER_RULES.length).toBeGreaterThanOrEqual(4);

      const coinRule = DEFAULT_PLATFORMER_RULES.find((r) => r.id === "rule_collect_coin");
      expect(coinRule).toBeDefined();
      expect(coinRule?.action).toBe("INCREASE_SCORE");

      const winRule = DEFAULT_PLATFORMER_RULES.find((r) => r.id === "rule_reach_goal");
      expect(winRule).toBeDefined();
      expect(winRule?.action).toBe("GAME_OVER_WIN");
    });
  });

  describe("3. Bidirectional Adapter & Backward Compatibility", () => {
    it("converts LevelDefinition to PlatformerGameDefinition with 100% fidelity", () => {
      const gameDef = levelDefinitionToGameDefinition(sampleLevel, "game_odyssey");

      expect(gameDef.id).toBe("game_odyssey");
      expect(gameDef.name).toBe("Space Odyssey");
      expect(gameDef.gameType).toBe("platformer");
      expect(gameDef.version).toBe(1);
      expect(gameDef.viewport.width).toBe(sampleLevel.viewport.width);
      expect(gameDef.viewport.height).toBe(sampleLevel.viewport.height);
      expect(gameDef.typePayload?.physics.gravityY).toBe(sampleLevel.physics.gravityY);
      expect(gameDef.typePayload?.coins.length).toBe(sampleLevel.coins.length);
      expect(gameDef.engineConfig.engineId).toBe("phaser-matter");
    });

    it("round-trips LevelDefinition -> PlatformerGameDefinition -> LevelDefinition accurately", () => {
      const gameDef = levelDefinitionToGameDefinition(sampleLevel);
      const reconstructed = gameDefinitionToLevelDefinition(gameDef);

      expect(reconstructed.name).toBe(sampleLevel.name);
      expect(reconstructed.gameMode).toBe(sampleLevel.gameMode);
      expect(reconstructed.physics.gravityY).toBe(sampleLevel.physics.gravityY);
      expect(reconstructed.physics.jumpVelocity).toBe(sampleLevel.physics.jumpVelocity);
      expect(reconstructed.player.x).toBe(sampleLevel.player.x);
      expect(reconstructed.player.y).toBe(sampleLevel.player.y);
      expect(reconstructed.platforms.length).toBe(sampleLevel.platforms.length);
      expect(reconstructed.coins.length).toBe(sampleLevel.coins.length);
      expect(reconstructed.enemies.length).toBe(sampleLevel.enemies.length);
      expect(reconstructed.spikes.length).toBe(sampleLevel.spikes.length);
      expect(reconstructed.goal?.x).toBe(sampleLevel.goal?.x);
    });

    it("reconstructs level from generic GameObjects when typePayload is omitted", () => {
      const strippedDef = { ...levelDefinitionToGameDefinition(sampleLevel) };
      delete strippedDef.typePayload;

      const recovered = gameDefinitionToLevelDefinition(strippedDef);
      expect(recovered.name).toBe(sampleLevel.name);
      expect(recovered.platforms.length).toBe(sampleLevel.platforms.length);
      expect(recovered.coins.length).toBe(sampleLevel.coins.length);
      expect(recovered.player.x).toBe(sampleLevel.player.x);
    });

    it("identifies data types using predicates correctly", () => {
      const gameDef = levelDefinitionToGameDefinition(sampleLevel);

      expect(isLevelDefinition(sampleLevel)).toBe(true);
      expect(isLevelDefinition(gameDef)).toBe(false);

      expect(isPlatformerGameDefinition(gameDef)).toBe(true);
      expect(isPlatformerGameDefinition(sampleLevel)).toBe(false);
    });

    it("transparently handles both LevelDefinition and GameDefinition via ensureGameDefinition", () => {
      const fromLevel = ensureGameDefinition(sampleLevel);
      expect(fromLevel.gameType).toBe("platformer");
      expect(fromLevel.name).toBe(sampleLevel.name);

      const fromGameDef = ensureGameDefinition(fromLevel);
      expect(fromGameDef).toBe(fromLevel); // Returns as-is
    });
  });

  describe("4. GameEngineFactory & Extensibility", () => {
    it("instantiates PlatformerEngine for gameType 'platformer'", () => {
      const result = GameEngineFactory.createEngine("platformer");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.engine).toBeInstanceOf(PlatformerEngine);
        expect(result.engine.gameType).toBe("platformer");
        expect(result.engine.engineId).toBe("platformer-phaser-matter");
      }
    });

    it("returns explicit failure for extension point game types", () => {
      const result = GameEngineFactory.createEngine("ludo");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.isExtensionPoint).toBe(true);
        expect(result.requestedType).toBe("ludo");
        expect(result.error).toContain("extension point");
      }
    });

    it("instantiates ChessEngine for gameType 'chess'", () => {
      const result = GameEngineFactory.createEngine("chess");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.gameType).toBe("chess");
        expect(result.engine.gameType).toBe("chess");
        expect(result.engine.engineId).toBe("chess-standard-board");
      }
    });

    it("returns explicit failure for unknown game types and never silently falls back to platformer", () => {
      const result = GameEngineFactory.createEngine("fps_shooter_3d");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.isExtensionPoint).toBe(false);
        expect(result.requestedType).toBe("fps_shooter_3d");
        expect(result.error).toContain("Unsupported game type");
      }
    });

    it("supports registering custom game engines dynamically", () => {
      const mockEngine = {
        destroy: () => {},
        engineId: "custom-test-engine",
        gameType: "puzzle" as const,
        initialize: () => {},
        isInitialized: true,
        isRunning: true,
        load: () => {},
        pause: () => {},
        restart: () => {},
        resume: () => {},
        start: () => {},
      };

      GameEngineFactory.registerEngine("puzzle", () => mockEngine);

      const result = GameEngineFactory.createEngine("puzzle");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.engine.engineId).toBe("custom-test-engine");
      }

      GameEngineFactory.unregisterEngine("puzzle");
      const afterUnregister = GameEngineFactory.createEngine("puzzle");
      expect(afterUnregister.success).toBe(false);
    });

    it("createEngineOrThrow returns engine or throws cleanly", () => {
      const engine = GameEngineFactory.createEngineOrThrow("platformer");
      expect(engine).toBeInstanceOf(PlatformerEngine);

      expect(() => GameEngineFactory.createEngineOrThrow("carrom")).toThrow();
    });
  });

  describe("5. PlatformerEngine Lifecycle Contract", () => {
    it("tracks initialization, start, pause, resume, and destroy states", () => {
      const engine = new PlatformerEngine();

      expect(engine.isInitialized).toBe(false);
      expect(engine.isRunning).toBe(false);

      const container = document.createElement("div");
      engine.initialize({ container });

      expect(engine.isInitialized).toBe(true);

      engine.pause();
      expect(engine.isRunning).toBe(false);

      engine.resume();
      expect(engine.isRunning).toBe(true);

      engine.destroy();
      expect(engine.isInitialized).toBe(false);
      expect(engine.isRunning).toBe(false);
    });
  });

  describe("6. AI Editor Compatibility with Phase 10 Architecture", () => {
    it("applies AI editing commands to a round-tripped PlatformerGameDefinition", () => {
      const gameDef = levelDefinitionToGameDefinition(sampleLevel);
      const levelToEdit = gameDefinitionToLevelDefinition(gameDef);

      const parsed = parseEditCommand("add 3 coins");
      expect(parsed.success).toBe(true);

      if (parsed.success && parsed.command) {
        const editResult = applyEditCommand(levelToEdit, parsed.command);
        expect(editResult.success).toBe(true);
        expect(editResult.updatedLevel?.coins.length).toBe(sampleLevel.coins.length + 3);

        // Convert modified level back to GameDefinition
        const updatedGameDef = levelDefinitionToGameDefinition(editResult.updatedLevel!);
        expect(updatedGameDef.typePayload?.coins.length).toBe(sampleLevel.coins.length + 3);
      }
    });

    it("applies gravity modifications through GameDefinition parameters", () => {
      const gameDef = levelDefinitionToGameDefinition(sampleLevel);
      const levelToEdit = gameDefinitionToLevelDefinition(gameDef);

      const parsed = parseEditCommand("Set gravity to 800");
      expect(parsed.success).toBe(true);

      if (parsed.success && parsed.command) {
        const editResult = applyEditCommand(levelToEdit, parsed.command);
        expect(editResult.success).toBe(true);
        expect(editResult.updatedLevel?.physics.gravityY).toBe(800);
      }
    });
  });
});
