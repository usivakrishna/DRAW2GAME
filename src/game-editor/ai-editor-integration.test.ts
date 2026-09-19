import { beforeEach, describe, expect, it } from "vitest";
import { parseEditCommand } from "./command-parser";
import { applyEditCommand } from "./level-modifier";
import { createPlayableDemoLevel, levelSchema } from "@/json/level-schema";
import { loadRuntimeLevel } from "@/game/levels/level-loader";
import { useProjectStore } from "@/store/project-store";

describe("Phase 7 AI Editor Integration & Project Isolation", () => {
  beforeEach(() => {
    useProjectStore.setState({
      activeProjectId: null,
      projectDetections: {},
      projectLevels: {},
      projects: [],
      projectUploads: {},
      studioDocuments: {},
    });
  });

  describe("Validation & Safety Guards", () => {
    it("rejects attempt to remove the player entity", () => {
      const parsed = parseEditCommand("remove player");
      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain("Cannot remove the player");
      expect(parsed.suggestions).toBeDefined();
    });

    it("rejects attempt to remove the goal flag", () => {
      const parsed = parseEditCommand("delete goal");
      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain("Cannot remove the goal flag");
      expect(parsed.suggestions).toBeDefined();
    });

    it("rejects gibberish/unsupported prompts with friendly suggestions", () => {
      const parsed = parseEditCommand("make pizza with pepperoni");
      expect(parsed.success).toBe(false);
      expect(parsed.error).toContain("I couldn't understand that command");
      expect(parsed.suggestions?.length).toBeGreaterThan(0);
    });

    it("clamps extreme gravity values safely within bounds [400, 3000]", () => {
      const base = createPlayableDemoLevel("Gravity Test");

      const lowParsed = parseEditCommand("set gravity to -500");
      expect(lowParsed.success).toBe(false); // negative not matched by set gravity

      const highParsed = parseEditCommand("set gravity to 99999");
      expect(highParsed.success).toBe(true);

      const highResult = applyEditCommand(base, highParsed.command!);
      expect(highResult.success).toBe(true);
      expect(highResult.updatedLevel?.physics.gravityY).toBe(3000);
    });

    it("clamps extreme jump velocity safely within bounds [-1000, -300]", () => {
      const base = createPlayableDemoLevel("Jump Test");

      const parsed = parseEditCommand("set jump to -9999");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!);
      expect(result.success).toBe(true);
      expect(result.updatedLevel?.physics.jumpVelocity).toBe(-1000);
    });

    it("always produces a LevelDefinition that conforms strictly to levelSchema", () => {
      const base = createPlayableDemoLevel("Schema Check");
      const commands = [
        "Add 5 coins",
        "Remove all spikes",
        "Make enemies faster",
        "Make platforms wider",
        "Make gravity lower",
        "Make the player jump higher",
        "Change game to side-scrolling",
      ];

      let current = base;
      for (const cmd of commands) {
        const parsed = parseEditCommand(cmd);
        expect(parsed.success).toBe(true);
        const res = applyEditCommand(current, parsed.command!);
        expect(res.success).toBe(true);
        expect(res.updatedLevel).toBeDefined();

        // Validate schema
        const validation = levelSchema.safeParse(res.updatedLevel);
        expect(validation.success).toBe(true);
        current = res.updatedLevel!;
      }
    });
  });

  describe("Project Isolation & Store Persistence", () => {
    it("ensures edits to Project A never mutate or leak into Project B", () => {
      const store = useProjectStore.getState();

      const projA = store.createProject("Project Alpha");
      const projB = store.createProject("Project Beta");

      const levelA = createPlayableDemoLevel("Level Alpha");
      const levelB = createPlayableDemoLevel("Level Beta");

      store.setProjectLevel(projA.id, levelA);
      store.setProjectLevel(projB.id, levelB);

      const initialCoinsA = levelA.coins.length;
      const initialCoinsB = levelB.coins.length;

      // Execute AI edit on Project A only
      const parsed = parseEditCommand("Add 5 coins");
      expect(parsed.success).toBe(true);

      const editResult = applyEditCommand(
        useProjectStore.getState().projectLevels[projA.id]!,
        parsed.command!,
      );
      expect(editResult.success).toBe(true);

      store.setProjectLevel(projA.id, editResult.updatedLevel!);

      // Verify Project A has updated coins
      const updatedLevels = useProjectStore.getState().projectLevels;
      expect(updatedLevels[projA.id]?.coins.length).toBe(initialCoinsA + 5);

      // Verify Project B is strictly untouched
      expect(updatedLevels[projB.id]?.coins.length).toBe(initialCoinsB);
      expect(updatedLevels[projB.id]?.name).toBe("Level Beta");
    });

    it("ensures updated LevelDefinition is directly readable by Phaser level-loader", () => {
      const base = createPlayableDemoLevel("Loader Test");
      const parsed = parseEditCommand("Add 3 coins");
      const res = applyEditCommand(base, parsed.command!);
      expect(res.success).toBe(true);

      const runtimeData = loadRuntimeLevel(res.updatedLevel!);
      expect(runtimeData).toBeDefined();
      expect(runtimeData.coins.length).toBe(base.coins.length + 3);
      expect(runtimeData.player).toBeDefined();
      expect(runtimeData.platforms.length).toBe(base.platforms.length);
    });
  });
});
