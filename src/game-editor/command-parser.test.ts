import { describe, expect, it } from "vitest";
import { parseEditCommand } from "./command-parser";

describe("command-parser", () => {
  describe("Coins", () => {
    it("parses 'Add 5 coins'", () => {
      const res = parseEditCommand("Add 5 coins");
      expect(res.success).toBe(true);
      expect(res.command).toEqual({
        action: "ADD",
        parameters: { count: 5 },
        rawPrompt: "Add 5 coins",
        target: "coin",
      });
    });

    it("parses word numbers 'add two coins'", () => {
      const res = parseEditCommand("add two coins");
      expect(res.success).toBe(true);
      expect(res.command?.parameters.count).toBe(2);
    });

    it("parses 'Remove all coins'", () => {
      const res = parseEditCommand("Remove all coins");
      expect(res.success).toBe(true);
      expect(res.command).toEqual({
        action: "REMOVE",
        parameters: { all: true },
        rawPrompt: "Remove all coins",
        target: "coin",
      });
    });

    it("parses 'clear coins'", () => {
      const res = parseEditCommand("clear coins");
      expect(res.success).toBe(true);
      expect(res.command?.action).toBe("REMOVE");
      expect(res.command?.target).toBe("coin");
    });
  });

  describe("Hazards & Spikes", () => {
    it("parses 'Remove all spikes'", () => {
      const res = parseEditCommand("Remove all spikes");
      expect(res.success).toBe(true);
      expect(res.command).toEqual({
        action: "REMOVE",
        parameters: { all: true },
        rawPrompt: "Remove all spikes",
        target: "spike",
      });
    });

    it("parses 'no spikes'", () => {
      const res = parseEditCommand("no spikes");
      expect(res.success).toBe(true);
      expect(res.command?.action).toBe("REMOVE");
    });

    it("parses 'Add 3 spikes'", () => {
      const res = parseEditCommand("Add 3 spikes");
      expect(res.success).toBe(true);
      expect(res.command).toEqual({
        action: "ADD",
        parameters: { count: 3 },
        rawPrompt: "Add 3 spikes",
        target: "spike",
      });
    });
  });

  describe("Enemies", () => {
    it("parses 'Make enemies faster'", () => {
      const res = parseEditCommand("Make enemies faster");
      expect(res.success).toBe(true);
      expect(res.command).toEqual({
        action: "UPDATE",
        parameters: { speedMultiplier: 1.6 },
        rawPrompt: "Make enemies faster",
        target: "enemy",
      });
    });

    it("parses 'slow down enemies'", () => {
      const res = parseEditCommand("slow down enemies");
      expect(res.success).toBe(true);
      expect(res.command?.action).toBe("UPDATE");
      expect(res.command?.parameters.speedMultiplier).toBeLessThan(1);
    });

    it("parses 'Add an enemy'", () => {
      const res = parseEditCommand("Add an enemy");
      expect(res.success).toBe(true);
      expect(res.command?.action).toBe("ADD");
      expect(res.command?.target).toBe("enemy");
      expect(res.command?.parameters.count).toBe(1);
    });

    it("parses 'Remove all enemies'", () => {
      const res = parseEditCommand("Remove all enemies");
      expect(res.success).toBe(true);
      expect(res.command?.action).toBe("REMOVE");
      expect(res.command?.target).toBe("enemy");
    });
  });

  describe("Platforms", () => {
    it("parses 'Add more platforms'", () => {
      const res = parseEditCommand("Add more platforms");
      expect(res.success).toBe(true);
      expect(res.command?.action).toBe("ADD");
      expect(res.command?.target).toBe("platform");
    });

    it("parses 'Make platforms wider'", () => {
      const res = parseEditCommand("Make platforms wider");
      expect(res.success).toBe(true);
      expect(res.command?.action).toBe("RESIZE");
      expect(res.command?.parameters.widthMultiplier).toBeGreaterThan(1);
    });

    it("parses 'Make platforms narrower'", () => {
      const res = parseEditCommand("Make platforms narrower");
      expect(res.success).toBe(true);
      expect(res.command?.action).toBe("RESIZE");
      expect(res.command?.parameters.widthMultiplier).toBeLessThan(1);
    });
  });

  describe("Physics & Player", () => {
    it("parses 'Make the player jump higher'", () => {
      const res = parseEditCommand("Make the player jump higher");
      expect(res.success).toBe(true);
      expect(res.command?.action).toBe("UPDATE");
      expect(res.command?.target).toBe("jump");
    });

    it("parses 'Make gravity lower'", () => {
      const res = parseEditCommand("Make gravity lower");
      expect(res.success).toBe(true);
      expect(res.command?.action).toBe("UPDATE");
      expect(res.command?.target).toBe("gravity");
    });

    it("parses 'Set gravity to 800'", () => {
      const res = parseEditCommand("Set gravity to 800");
      expect(res.success).toBe(true);
      expect(res.command).toEqual({
        action: "SET",
        parameters: { value: 800 },
        rawPrompt: "Set gravity to 800",
        target: "gravity",
      });
    });

    it("rejects 'Remove player' safely with explanation", () => {
      const res = parseEditCommand("Remove player");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Cannot remove the player");
    });
  });

  describe("Themes & Styles", () => {
    it("parses 'Change theme to Cyberpunk'", () => {
      const res = parseEditCommand("Change theme to Cyberpunk");
      expect(res.success).toBe(true);
      expect(res.command).toEqual({
        action: "CHANGE_THEME",
        parameters: { themeId: "cyberpunk" },
        rawPrompt: "Change theme to Cyberpunk",
        target: "theme",
      });
    });

    it("parses 'Use Samurai theme'", () => {
      const res = parseEditCommand("Use Samurai theme");
      expect(res.success).toBe(true);
      expect(res.command?.parameters.themeId).toBe("samurai");
    });

    it("parses 'Change style to Neon Glow'", () => {
      const res = parseEditCommand("Change style to Neon Glow");
      expect(res.success).toBe(true);
      expect(res.command).toEqual({
        action: "CHANGE_STYLE",
        parameters: { styleId: "neon" },
        rawPrompt: "Change style to Neon Glow",
        target: "style",
      });
    });

    it("parses 'Make it retro'", () => {
      const res = parseEditCommand("Make it retro");
      expect(res.success).toBe(true);
      expect(res.command?.parameters.styleId).toBe("retro");
    });
  });

  describe("Game Mode & World", () => {
    it("parses 'Change the game to side-scrolling'", () => {
      const res = parseEditCommand("Change the game to side-scrolling");
      expect(res.success).toBe(true);
      expect(res.command).toEqual({
        action: "CHANGE_MODE",
        parameters: { mode: "side-scrolling" },
        rawPrompt: "Change the game to side-scrolling",
        target: "game_mode",
      });
    });

    it("parses 'Make the level wider'", () => {
      const res = parseEditCommand("Make the level wider");
      expect(res.success).toBe(true);
      expect(res.command?.action).toBe("RESIZE");
      expect(res.command?.target).toBe("world");
    });
  });

  describe("Error & Edge Cases", () => {
    it("handles empty or whitespace string", () => {
      const res = parseEditCommand("   ");
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
      expect(res.suggestions).toBeDefined();
    });

    it("handles gibberish gracefully with suggestions", () => {
      const res = parseEditCommand("make me a cheese pizza");
      expect(res.success).toBe(false);
      expect(res.error).toContain("couldn't understand");
      expect(res.suggestions?.length).toBeGreaterThan(0);
    });
  });
});
