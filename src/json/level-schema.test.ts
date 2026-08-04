import { describe, expect, it } from "vitest";
import { createEmptyLevel, levelSchema } from "@/json/level-schema";

describe("levelSchema", () => {
  it("creates a valid empty platformer level", () => {
    const level = createEmptyLevel("First sketch");

    expect(levelSchema.safeParse(level).success).toBe(true);
    expect(level.name).toBe("First sketch");
    expect(level.player.id).toBe("player_start");
  });
});
