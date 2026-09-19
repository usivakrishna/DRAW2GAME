import { describe, expect, it } from "vitest";
import { applyEditCommand } from "./level-modifier";
import { parseEditCommand } from "./command-parser";
import { createPlayableDemoLevel } from "@/json/level-schema";

describe("level-modifier", () => {
  const getBaseLevel = () => createPlayableDemoLevel("Modifier Test", "side-scrolling");

  describe("Coin modifications", () => {
    it("adds 5 coins and preserves schema validity", () => {
      const base = getBaseLevel();
      const initialCoinCount = base.coins.length;

      const parsed = parseEditCommand("Add 5 coins");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!);
      expect(result.success).toBe(true);
      expect(result.updatedLevel?.coins.length).toBe(initialCoinCount + 5);
      expect(result.message).toContain("Added 5 coin(s)");
    });

    it("removes all coins", () => {
      const base = getBaseLevel();
      const parsed = parseEditCommand("Remove all coins");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!);
      expect(result.success).toBe(true);
      expect(result.updatedLevel?.coins.length).toBe(0);
      expect(result.message).toContain("Removed all");
    });
  });

  describe("Spike hazard modifications", () => {
    it("removes all spikes", () => {
      const base = getBaseLevel();
      expect(base.spikes.length).toBeGreaterThan(0);

      const parsed = parseEditCommand("Remove all spikes");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!);
      expect(result.success).toBe(true);
      expect(result.updatedLevel?.spikes.length).toBe(0);
      expect(result.message).toContain("Removed all");
    });

    it("adds spikes without exceeding bounds", () => {
      const base = getBaseLevel();
      const parsed = parseEditCommand("Add 2 spikes");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!);
      expect(result.success).toBe(true);
      expect(result.updatedLevel?.spikes.length).toBe(base.spikes.length + 2);
    });
  });

  describe("Platform modifications", () => {
    it("adds platforms", () => {
      const base = getBaseLevel();
      const initialCount = base.platforms.length;

      const parsed = parseEditCommand("Add 2 platforms");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!);
      expect(result.success).toBe(true);
      expect(result.updatedLevel?.platforms.length).toBe(initialCount + 2);
    });

    it("resizes platforms wider", () => {
      const base = getBaseLevel();
      const initialFirstW = base.platforms[0]?.width ?? 200;

      const parsed = parseEditCommand("Make platforms wider");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!);
      expect(result.success).toBe(true);
      expect(result.updatedLevel?.platforms[0]?.width).toBeGreaterThan(initialFirstW);
    });

    it("prevents removing all platforms", () => {
      const base = { ...getBaseLevel(), platforms: [getBaseLevel().platforms[0]!] };
      const parsed = parseEditCommand("Remove 1 platforms");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot remove all platforms");
    });
  });

  describe("Enemy modifications", () => {
    it("adjusts enemy speed/patrol distance", () => {
      const base = getBaseLevel();
      const initialPatrol = base.enemies[0]?.patrolDistance ?? 80;

      const parsed = parseEditCommand("Make enemies faster");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!);
      expect(result.success).toBe(true);
      expect(result.updatedLevel?.enemies[0]?.patrolDistance).toBeGreaterThan(initialPatrol);
    });

    it("removes all enemies", () => {
      const base = getBaseLevel();
      const parsed = parseEditCommand("Remove all enemies");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!);
      expect(result.success).toBe(true);
      expect(result.updatedLevel?.enemies.length).toBe(0);
    });
  });

  describe("Physics modifications", () => {
    it("lowers gravity safely within physical bounds", () => {
      const base = getBaseLevel();
      const initialGravity = base.physics?.gravityY ?? 1400;

      const parsed = parseEditCommand("Make gravity lower");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!);
      expect(result.success).toBe(true);
      expect(result.updatedLevel?.physics?.gravityY).toBeLessThan(initialGravity);
      expect(result.updatedLevel?.physics?.gravityY).toBeGreaterThanOrEqual(400);
    });

    it("sets gravity explicitly and clamps to safe bounds", () => {
      const base = getBaseLevel();
      const parsed = parseEditCommand("Set gravity to 9000");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!);
      expect(result.success).toBe(true);
      // Clamped to 3000 max
      expect(result.updatedLevel?.physics?.gravityY).toBe(3000);
    });

    it("increases jump velocity (higher jump)", () => {
      const base = getBaseLevel();
      const initialJump = base.physics?.jumpVelocity ?? -520;

      const parsed = parseEditCommand("Make the player jump higher");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!);
      expect(result.success).toBe(true);
      // Higher jump means more negative in Phaser/Matter Y-axis
      expect(Math.abs(result.updatedLevel?.physics?.jumpVelocity ?? 0)).toBeGreaterThan(
        Math.abs(initialJump),
      );
    });
  });

  describe("Theme and Style modifications", () => {
    it("changes theme to Cyberpunk", () => {
      const base = getBaseLevel();
      const parsed = parseEditCommand("Change theme to Cyberpunk");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!, "classic", "clean");
      expect(result.success).toBe(true);
      expect(result.updatedTheme).toBe("cyberpunk");
      expect(result.updatedStyle).toBe("clean");
    });

    it("changes style to Neon Glow", () => {
      const base = getBaseLevel();
      const parsed = parseEditCommand("Change style to Neon Glow");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!, "classic", "clean");
      expect(result.success).toBe(true);
      expect(result.updatedStyle).toBe("neon");
      expect(result.updatedTheme).toBe("classic");
    });
  });

  describe("Game Mode & World dimensions", () => {
    it("switches to side-scrolling and expands world width", () => {
      const base = { ...getBaseLevel(), gameMode: "single-screen" as const, world: { height: 720, width: 1280 } };
      const parsed = parseEditCommand("Change game to side-scrolling");
      expect(parsed.success).toBe(true);

      const result = applyEditCommand(base, parsed.command!);
      expect(result.success).toBe(true);
      expect(result.updatedLevel?.gameMode).toBe("side-scrolling");
      expect(result.updatedLevel?.world?.width).toBe(2560);
    });
  });
});
