import { describe, expect, it } from "vitest";
import { createEmptyLevel, levelSchema } from "@/json/level-schema";

describe("levelSchema", () => {
  it("creates a valid empty platformer level with single-screen defaults", () => {
    const level = createEmptyLevel("First sketch");

    expect(levelSchema.safeParse(level).success).toBe(true);
    expect(level.name).toBe("First sketch");
    expect(level.player.id).toBe("player_start");
    expect(level.gameMode).toBe("single-screen");
    expect(level.viewport.width).toBe(1280);
    expect(level.viewport.height).toBe(720);
    expect(level.world?.width).toBe(1280);
    expect(level.world?.height).toBe(720);
  });

  it("supports side-scrolling level with wider world dimensions", () => {
    const sideScrollingLevel = createEmptyLevel("Scrolling Stage", "side-scrolling");

    expect(levelSchema.safeParse(sideScrollingLevel).success).toBe(true);
    expect(sideScrollingLevel.gameMode).toBe("side-scrolling");
    expect(sideScrollingLevel.viewport.width).toBe(1280);
    expect(sideScrollingLevel.world?.width).toBe(2560);
  });

  it("validates confidence scores between 0 and 1 on entities", () => {
    const base = createEmptyLevel("Confidence test");
    const validLevel = {
      ...base,
      player: {
        ...base.player,
        confidence: 0.95,
      },
    };
    expect(levelSchema.safeParse(validLevel).success).toBe(true);

    const invalidLevel = {
      ...base,
      player: {
        ...base.player,
        confidence: 1.5,
      },
    };
    expect(levelSchema.safeParse(invalidLevel).success).toBe(false);
  });
});
