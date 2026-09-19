import { describe, expect, it, vi } from "vitest";
import { GameStateManager } from "@/game/systems/game-state-manager";

describe("GameStateManager", () => {
  it("initializes in idle status with 0 score", () => {
    const manager = new GameStateManager(5);
    const snapshot = manager.getSnapshot();

    expect(snapshot.status).toBe("idle");
    expect(snapshot.score).toBe(0);
    expect(snapshot.coinsCollected).toBe(0);
    expect(snapshot.totalCoins).toBe(5);
  });

  it("transitions to playing on start", () => {
    const manager = new GameStateManager(3);
    manager.start();
    expect(manager.getSnapshot().status).toBe("playing");
  });

  it("handles pause and resume", () => {
    const manager = new GameStateManager(3);
    manager.start();

    manager.pause();
    expect(manager.getSnapshot().status).toBe("paused");

    manager.resume();
    expect(manager.getSnapshot().status).toBe("playing");

    manager.togglePause();
    expect(manager.getSnapshot().status).toBe("paused");

    manager.togglePause();
    expect(manager.getSnapshot().status).toBe("playing");
  });

  it("increments score and coins on collection", () => {
    const manager = new GameStateManager(10);
    manager.start();

    manager.collectCoin();
    manager.collectCoin();

    expect(manager.getSnapshot().score).toBe(2);
    expect(manager.getSnapshot().coinsCollected).toBe(2);
  });

  it("transitions to won when reaching goal", () => {
    const manager = new GameStateManager(5);
    manager.start();
    manager.collectCoin();
    manager.win();

    expect(manager.getSnapshot().status).toBe("won");
    expect(manager.getSnapshot().score).toBe(1);
  });

  it("transitions to lost when eliminated", () => {
    const manager = new GameStateManager(5);
    manager.start();
    manager.lose("Touched a spike");

    expect(manager.getSnapshot().status).toBe("lost");
    expect(manager.getSnapshot().causeOfDeath).toBe("Touched a spike");
  });

  it("resets score and state on restart", () => {
    const manager = new GameStateManager(5);
    manager.start();
    manager.collectCoin();
    manager.lose("Test death");

    manager.restart();

    const snapshot = manager.getSnapshot();
    expect(snapshot.status).toBe("playing");
    expect(snapshot.score).toBe(0);
    expect(snapshot.coinsCollected).toBe(0);
    expect(snapshot.causeOfDeath).toBeUndefined();
    expect(snapshot.totalCoins).toBe(5);
  });

  it("notifies subscribers of state updates", () => {
    const manager = new GameStateManager(5);
    const listener = vi.fn();

    const unsubscribe = manager.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);

    manager.start();
    expect(listener).toHaveBeenCalledTimes(2);

    manager.collectCoin();
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    manager.collectCoin();
    expect(listener).toHaveBeenCalledTimes(3); // no extra calls after unsubscribe
  });
});
