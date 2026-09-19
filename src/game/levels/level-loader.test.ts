import { describe, expect, it } from "vitest";
import { loadRuntimeLevel } from "@/game/levels/level-loader";
import { createEmptyLevel, type LevelDefinition } from "@/json/level-schema";

describe("level-loader", () => {
  it("converts LevelDefinition top-left coordinates to Matter body center coordinates", () => {
    const level: LevelDefinition = {
      ...createEmptyLevel("Coordinate Test"),
      coins: [
        {
          confidence: 0.95,
          id: "coin-1",
          radius: 12,
          x: 200,
          y: 300,
        },
      ],
      enemies: [
        {
          confidence: 0.8,
          height: 40,
          id: "enemy-1",
          patrolDistance: 100,
          width: 30,
          x: 400,
          y: 500,
        },
      ],
      goal: {
        confidence: 0.9,
        height: 60,
        id: "goal-1",
        label: "Goal",
        width: 40,
        x: 600,
        y: 200,
      },
      platforms: [
        {
          confidence: 0.88,
          height: 30,
          id: "plat-1",
          oneWay: false,
          width: 100,
          x: 100,
          y: 200,
        },
      ],
      player: {
        confidence: 0.92,
        height: 50,
        id: "player-1",
        spawnFacing: "right",
        width: 30,
        x: 50,
        y: 100,
      },
      spikes: [
        {
          confidence: 0.85,
          direction: "up",
          height: 20,
          id: "spike-1",
          width: 40,
          x: 250,
          y: 350,
        },
      ],
    };

    const runtime = loadRuntimeLevel(level);

    // Player: x=50, w=30 -> centerX = 50 + 15 = 65; y=100, h=50 -> centerY = 100 + 25 = 125
    expect(runtime.player.centerX).toBe(65);
    expect(runtime.player.centerY).toBe(125);
    expect(runtime.player.width).toBe(30);
    expect(runtime.player.height).toBe(50);

    // Platform: x=100, w=100 -> centerX = 100 + 50 = 150; y=200, h=30 -> centerY = 200 + 15 = 215
    expect(runtime.platforms[0]?.centerX).toBe(150);
    expect(runtime.platforms[0]?.centerY).toBe(215);

    // Coin: x=200, y=300 (already center in schema)
    expect(runtime.coins[0]?.centerX).toBe(200);
    expect(runtime.coins[0]?.centerY).toBe(300);
    expect(runtime.coins[0]?.radius).toBe(12);

    // Enemy: x=400, w=30 -> centerX = 415; y=500, h=40 -> centerY = 520
    expect(runtime.enemies[0]?.centerX).toBe(415);
    expect(runtime.enemies[0]?.centerY).toBe(520);
    expect(runtime.enemies[0]?.patrolDistance).toBe(100);

    // Spike: x=250, w=40 -> centerX = 270; y=350, h=20 -> centerY = 360
    expect(runtime.spikes[0]?.centerX).toBe(270);
    expect(runtime.spikes[0]?.centerY).toBe(360);

    // Goal: x=600, w=40 -> centerX = 620; y=200, h=60 -> centerY = 230
    expect(runtime.goal?.centerX).toBe(620);
    expect(runtime.goal?.centerY).toBe(230);
  });

  it("configures world dimensions according to single-screen vs side-scrolling", () => {
    const singleScreen = createEmptyLevel("Single Screen", "single-screen");
    const runtimeSingle = loadRuntimeLevel(singleScreen);
    expect(runtimeSingle.gameMode).toBe("single-screen");
    expect(runtimeSingle.world.width).toBe(1280);
    expect(runtimeSingle.viewport.width).toBe(1280);

    const sideScrolling = createEmptyLevel("Side Scroller", "side-scrolling");
    const runtimeScrolling = loadRuntimeLevel(sideScrolling);
    expect(runtimeScrolling.gameMode).toBe("side-scrolling");
    expect(runtimeScrolling.world.width).toBe(2560);
    expect(runtimeScrolling.viewport.width).toBe(1280);
  });

  it("scales gravityY and jumpVelocity into Matter physics values", () => {
    const level: LevelDefinition = {
      ...createEmptyLevel("Physics test"),
      physics: {
        gravityY: 1400,
        jumpVelocity: -520,
      },
    };

    const runtime = loadRuntimeLevel(level);
    // 1400 / 1000 = 1.4
    expect(runtime.gravityY).toBeCloseTo(1.4, 2);
    // -520 / 40 = -13
    expect(runtime.jumpVelocity).toBeCloseTo(-13, 2);
  });

  it("handles null goal safely", () => {
    const level = createEmptyLevel("No Goal Level");
    level.goal = null;

    const runtime = loadRuntimeLevel(level);
    expect(runtime.goal).toBeNull();
  });
});
