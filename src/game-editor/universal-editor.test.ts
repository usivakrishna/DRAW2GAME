/**
 * DRAW2GAME — Phase 15: Universal Game Editor & Regeneration
 * Comprehensive Test Suite
 *
 * Verifies:
 * 1. Load GameDefinition into editor.
 * 2. Edit an object property.
 * 3. Edit object position.
 * 4. Add/remove an object where supported.
 * 5. Validate edited GameDefinition.
 * 6. Save edited GameDefinition.
 * 7. Persist under correct project ID.
 * 8. Reload project and recover edited definition.
 * 9. Play Again loads updated definition.
 * 10. UniversalGameEngine initializes from updated definition.
 * 11. Platformer still works after editing.
 * 12. Chess still works after editing.
 * 13. Project A edits do not affect Project B.
 * 14. Undo/redo does not corrupt the definition if supported.
 * 15. Invalid definitions are rejected.
 * 16. AI Natural Language commands update the universal GameDefinition.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDefaultChessGameDefinition,
} from "@/game/chess/chess-definition";
import type { GameDefinition, GameObject } from "@/game/core/game-definition";
import {
  levelDefinitionToGameDefinition,
} from "@/game/core/platformer-definition";
import { GenericGameValidator } from "@/game/generation/validators/generic-validator";
import {
  UniversalGameEngine,
} from "@/game/runtime/universal-game-engine";
import type { BridgeFactory } from "@/game/runtime/systems";
import type { PhaserGameBridge } from "@/game/PhaserGameBridge";
import { createPlayableDemoLevel } from "@/json/level-schema";
import { useProjectStore } from "@/store/project-store";
import {
  addGameObject,
  applyUniversalEditCommand,
  removeGameObject,
  updateGameObject,
  updateGameSettings,
} from "./game-definition-modifier";
import { parseEditCommand } from "./command-parser";

describe("Phase 15 — Universal Game Editor & Regeneration", () => {
  const mockBridge: BridgeFactory = () => ({
    destroy: vi.fn(),
    getGame: vi.fn(),
    getScene: vi.fn(),
    restart: vi.fn(),
    setTheme: vi.fn(),
  } as unknown as PhaserGameBridge);

  let initialPlatformerDef: GameDefinition;
  let initialChessDef: GameDefinition;

  beforeEach(() => {
    // Reset Zustand project store
    useProjectStore.setState({
      activeProjectId: null,
      projectChessGames: {},
      projectDetections: {},
      projectGameDefinitions: {},
      projectLevels: {},
      projectRecognitions: {},
      projects: [],
      projectUploads: {},
    });

    // Create fresh initial definitions
    const demoLevel = createPlayableDemoLevel("Project Alpha");
    initialPlatformerDef = levelDefinitionToGameDefinition(demoLevel, "project_alpha");
    initialChessDef = createDefaultChessGameDefinition("project_chess", "Project Chess");
  });

  // 1. Load GameDefinition into editor
  it("1. loads a GameDefinition into the editor state with all properties intact", () => {
    expect(initialPlatformerDef.id).toBe("project_alpha");
    expect(initialPlatformerDef.gameType).toBe("platformer");
    expect(initialPlatformerDef.objects.length).toBeGreaterThan(0);
    expect(initialPlatformerDef.capabilities).toContain("physics");
    expect(initialPlatformerDef.capabilities).toContain("movement");

    expect(initialChessDef.id).toBe("project_chess");
    expect(initialChessDef.gameType).toBe("chess");
    expect(initialChessDef.objects.length).toBe(32);
    expect(initialChessDef.capabilities).toContain("turns");
    expect(initialChessDef.capabilities).toContain("board");
  });

  // 2. Edit an object property
  it("2. edits an object property immutably on the universal GameDefinition", () => {
    const targetPlatform = initialPlatformerDef.objects.find((o) => o.type === "platform")!;
    expect(targetPlatform).toBeDefined();

    const updated = updateGameObject(initialPlatformerDef, targetPlatform.id, {
      name: "Super Bouncy Platform",
      properties: { ...targetPlatform.properties, friction: 0.95, bounce: 0.8 },
    });

    // Immutability check
    expect(updated).not.toBe(initialPlatformerDef);
    const modifiedPlatform = updated.objects.find((o) => o.id === targetPlatform.id)!;
    expect(modifiedPlatform.name).toBe("Super Bouncy Platform");
    expect(modifiedPlatform.properties?.bounce).toBe(0.8);
    expect(modifiedPlatform.properties?.friction).toBe(0.95);

    // Original remains untouched
    expect(targetPlatform.name).not.toBe("Super Bouncy Platform");
  });

  // 3. Edit object position
  it("3. edits object position accurately within bounds and updates typePayload", () => {
    const targetPlatform = initialPlatformerDef.objects.find((o) => o.type === "platform")!;
    const originalX = targetPlatform.x;
    const originalY = targetPlatform.y;

    const newX = originalX + 150;
    const newY = originalY - 50;

    const updated = updateGameObject(initialPlatformerDef, targetPlatform.id, {
      x: newX,
      y: newY,
    });

    const modifiedPlatform = updated.objects.find((o) => o.id === targetPlatform.id)!;
    expect(modifiedPlatform.x).toBe(newX);
    expect(modifiedPlatform.y).toBe(newY);

    // Platformer typePayload synchronization check
    if (updated.typePayload && typeof updated.typePayload === "object" && "platforms" in updated.typePayload) {
      const payloadPlatform = (updated.typePayload as { platforms: Array<{ id: string; x: number; y: number }> }).platforms.find(
        (p) => p.id === targetPlatform.id
      );
      expect(payloadPlatform).toBeDefined();
      expect(payloadPlatform?.x).toBe(newX);
      expect(payloadPlatform?.y).toBe(newY);
    }
  });

  // 4. Add/remove an object where supported
  it("4. adds and removes objects while protecting vital game objects", () => {
    const newCoin: GameObject = {
      height: 28,
      id: "coin_bonus_99",
      name: "Bonus Gold Coin",
      properties: { points: 250 },
      type: "coin",
      width: 28,
      x: 350,
      y: 200,
    };

    // Add object
    const withCoin = addGameObject(initialPlatformerDef, newCoin);
    expect(withCoin.objects.find((o) => o.id === "coin_bonus_99")).toBeDefined();
    expect(withCoin.objects.length).toBe(initialPlatformerDef.objects.length + 1);

    // Remove added object
    const withoutCoin = removeGameObject(withCoin, "coin_bonus_99");
    expect(withoutCoin.objects.find((o) => o.id === "coin_bonus_99")).toBeUndefined();
    expect(withoutCoin.objects.length).toBe(initialPlatformerDef.objects.length);

    // Safety check: Cannot remove player in platformer
    const playerObj = initialPlatformerDef.objects.find((o) => o.type === "player")!;
    expect(() => removeGameObject(initialPlatformerDef, playerObj.id)).toThrow("Cannot delete player spawn");

    // Safety check: Cannot remove king in chess
    const whiteKing = initialChessDef.objects.find((o) => o.type === "chess-king" || o.name?.includes("king"))!;
    expect(() => removeGameObject(initialChessDef, whiteKing.id)).toThrow("Cannot delete King piece");
  });

  // 5. Validate edited GameDefinition
  it("5. validates edited GameDefinition using generic and genre validators", () => {
    // Valid edit
    const validEdit = updateGameSettings(initialPlatformerDef, {
      title: "Alpha World - Level 1 Revamped",
    });
    const validResult = GenericGameValidator.validate(validEdit);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors.length).toBe(0);

    // Invalid edit (empty name, invalid viewport)
    const invalidEdit: GameDefinition = {
      ...initialPlatformerDef,
      name: "",
      viewport: { height: -200, width: 0 },
    };
    const invalidResult = GenericGameValidator.validate(invalidEdit);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });

  // 6. Save edited GameDefinition
  it("6. saves edited GameDefinition to project-store canonical state", () => {
    const store = useProjectStore.getState();
    const project = store.createProject("Project Alpha");
    const projId = project.id;

    const editedDef = updateGameSettings(initialPlatformerDef, {
      id: projId,
      name: "Saved Platformer Level",
    });

    store.setProjectGameDefinition(projId, editedDef);

    const retrieved = useProjectStore.getState().projectGameDefinitions[projId];
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe("Saved Platformer Level");
  });

  // 7. Persist under correct project ID
  it("7. persists strictly under the specified project ID", () => {
    const store = useProjectStore.getState();
    const proj1 = store.createProject("Project 1");
    const proj2 = store.createProject("Project 2");

    const def1: GameDefinition = { ...initialPlatformerDef, id: proj1.id, name: "Level 1" };
    const def2: GameDefinition = { ...initialChessDef, id: proj2.id, name: "Chess Match 2" };

    store.setProjectGameDefinition(proj1.id, def1);
    store.setProjectGameDefinition(proj2.id, def2);

    expect(useProjectStore.getState().projectGameDefinitions[proj1.id]?.name).toBe("Level 1");
    expect(useProjectStore.getState().projectGameDefinitions[proj2.id]?.name).toBe("Chess Match 2");
  });

  // 8. Reload project and recover edited definition
  it("8. reloads project and recovers the exact edited definition", () => {
    const store = useProjectStore.getState();
    const proj = store.createProject("Reload Test");
    const platform = initialPlatformerDef.objects.find((o) => o.type === "platform")!;

    const editedDef = updateGameObject(
      { ...initialPlatformerDef, id: proj.id },
      platform.id,
      { x: 777, y: 888 }
    );

    store.setProjectGameDefinition(proj.id, editedDef);

    // Simulate page reload by querying store
    const stateAfterReload = useProjectStore.getState();
    const recovered = stateAfterReload.projectGameDefinitions[proj.id];
    expect(recovered).toBeDefined();
    const recoveredPlatform = recovered?.objects.find((o) => o.id === platform.id);
    expect(recoveredPlatform?.x).toBe(777);
    expect(recoveredPlatform?.y).toBe(888);
  });

  // 9. Play Again loads updated definition
  it("9. loads updated definition when Play Again is triggered", async () => {
    const engine = new UniversalGameEngine(mockBridge);
    await engine.initialize({ container: document.createElement("div") });

    // Initial load
    await engine.load(initialPlatformerDef);
    expect(engine.getGameDefinition()?.name).toBe(initialPlatformerDef.name);

    // User edits platformer title and platform position
    const updatedDef = updateGameSettings(initialPlatformerDef, {
      name: "Play Again Revamped Level",
    });

    // Play Again re-loads the engine with updatedDef
    await engine.load(updatedDef);
    engine.start();

    expect(engine.getGameDefinition()?.name).toBe("Play Again Revamped Level");
    engine.destroy();
  });

  // 10. UniversalGameEngine initializes from updated definition
  it("10. initializes UniversalGameEngine properly from the updated definition", async () => {
    const engine = new UniversalGameEngine(mockBridge);
    await engine.initialize({ container: document.createElement("div") });

    const updatedDef = updateGameSettings(initialPlatformerDef, {
      viewport: { height: 900, width: 1600 },
    });

    await engine.load(updatedDef);
    expect(engine.getGameDefinition()?.viewport.width).toBe(1600);
    expect(engine.getGameDefinition()?.viewport.height).toBe(900);
    expect(engine.isLoaded()).toBe(true);

    engine.destroy();
  });

  // 11. Platformer still works after editing
  it("11. keeps platformer capabilities, rules and systems functional after editing", async () => {
    const engine = new UniversalGameEngine(mockBridge);
    await engine.initialize({ container: document.createElement("div") });

    // Add coin and move platform
    const platform = initialPlatformerDef.objects.find((o) => o.type === "platform")!;
    const editedDef = updateGameObject(initialPlatformerDef, platform.id, {
      x: platform.x + 80,
    });

    await engine.load(editedDef);
    engine.start();

    // Verify capabilities
    expect(engine.hasCapability("physics")).toBe(true);
    expect(engine.hasCapability("movement")).toBe(true);
    expect(engine.hasCapability("collision")).toBe(true);

    // Verify rules
    const rules = engine.getRules();
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.some((r) => r.action === "INCREASE_SCORE")).toBe(true);
    expect(rules.some((r) => r.action === "GAME_OVER_WIN")).toBe(true);

    engine.destroy();
  });

  // 12. Chess still works after editing
  it("12. keeps chess board and legal moves functional after editing settings", async () => {
    const engine = new UniversalGameEngine();
    await engine.initialize({ container: document.createElement("div") });

    // Edit chess title/settings
    const editedChess = updateGameSettings(initialChessDef, {
      title: "Championship Blitz Edition",
    });

    await engine.load(editedChess);
    engine.start();

    expect(engine.hasCapability("turns")).toBe(true);
    expect(engine.hasCapability("board")).toBe(true);

    // Verify legal moves work via engine
    const e2Square = "e2";
    const legalMoves = engine.getLegalMoves(e2Square);
    expect(legalMoves.length).toBeGreaterThan(0);
    expect(legalMoves).toContain("e4");

    // Make move e2 -> e4
    const moveResult = engine.makeMove("e2", "e4");
    expect(moveResult.success).toBe(true);

    engine.destroy();
  });

  // 13. Project A edits do not affect Project B
  it("13. ensures complete project isolation when editing Project A vs Project B", () => {
    const store = useProjectStore.getState();
    const projA = store.createProject("Project A");
    const projB = store.createProject("Project B");

    const defA: GameDefinition = {
      ...initialPlatformerDef,
      id: projA.id,
      name: "Project A Original",
    };
    const defB: GameDefinition = {
      ...initialPlatformerDef,
      id: projB.id,
      name: "Project B Original",
    };

    store.setProjectGameDefinition(projA.id, defA);
    store.setProjectGameDefinition(projB.id, defB);

    // Edit Project A
    const editedA = updateGameSettings(defA, { name: "Project A Heavily Modified" });
    store.setProjectGameDefinition(projA.id, editedA);

    // Check Project B remains completely untouched
    const currentA = useProjectStore.getState().projectGameDefinitions[projA.id];
    const currentB = useProjectStore.getState().projectGameDefinitions[projB.id];

    expect(currentA?.name).toBe("Project A Heavily Modified");
    expect(currentB?.name).toBe("Project B Original");
  });

  // 14. Undo/redo does not corrupt the definition if supported
  it("14. maintains history integrity across sequential edits and undo operations", () => {
    const history: GameDefinition[] = [initialPlatformerDef];
    let current = initialPlatformerDef;

    // Edit 1: change name
    current = updateGameSettings(current, { name: "Step 1" });
    history.push(current);

    // Edit 2: change viewport
    current = updateGameSettings(current, { viewport: { height: 1200, width: 2000 } });
    history.push(current);

    expect(history.length).toBe(3);
    expect(current.name).toBe("Step 1");
    expect(current.viewport.width).toBe(2000);

    // Undo 1 step
    history.pop();
    const undoneStep = history[history.length - 1]!;
    expect(undoneStep.name).toBe("Step 1");
    expect(undoneStep.viewport.width).toBe(initialPlatformerDef.viewport.width);

    // Undo to initial
    history.pop();
    const initialRestored = history[history.length - 1]!;
    expect(initialRestored.name).toBe(initialPlatformerDef.name);
  });

  // 15. Invalid definitions are rejected
  it("15. rejects invalid GameDefinitions with clear actionable errors", () => {
    const invalidDefinitions: GameDefinition[] = [
      {
        ...initialPlatformerDef,
        gameType: "invalid_type" as never,
      },
      {
        ...initialPlatformerDef,
        id: "",
      },
      {
        ...initialPlatformerDef,
        viewport: { height: 0, width: -50 },
      },
    ];

    for (const invalidDef of invalidDefinitions) {
      const result = GenericGameValidator.validate(invalidDef);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  // 16. AI Natural Language commands update universal GameDefinition
  it("16. parses AI natural language commands and updates universal GameDefinition", () => {
    const prompt = "add 2 coins";
    const parseRes = parseEditCommand(prompt);
    expect(parseRes.success).toBe(true);
    expect(parseRes.command).toBeDefined();

    const initialCoinCount = initialPlatformerDef.objects.filter((o) => o.type === "coin").length;

    const editRes = applyUniversalEditCommand(
      initialPlatformerDef,
      parseRes.command!,
      "classic",
      "clean"
    );

    expect(editRes.success).toBe(true);
    expect(editRes.updatedDefinition).toBeDefined();

    const newCoinCount = editRes.updatedDefinition!.objects.filter((o) => o.type === "coin").length;
    expect(newCoinCount).toBe(initialCoinCount + 2);
  });
});
