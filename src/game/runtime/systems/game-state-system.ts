/**
 * DRAW2GAME — Universal Game Engine Architecture
 * Game State System
 *
 * Manages runtime game status (idle, playing, paused, won, lost),
 * lifecycle transitions, and notifies subscribers.
 */

import { GameStateManager, type GameStateSnapshot } from "@/game/systems/game-state-manager";

export type UniversalGameStatus =
  | "idle"
  | "playing"
  | "paused"
  | "won"
  | "gameover";

export type GameStatusListener = (status: UniversalGameStatus, previousStatus: UniversalGameStatus) => void;

export class GameStateSystem {
  private _status: UniversalGameStatus = "idle";
  private gameStateManager: GameStateManager | null = null;
  private unsubscribeManager?: (() => void) | undefined;
  private listeners: Set<GameStatusListener> = new Set();

  constructor(manager?: GameStateManager | null) {
    this.gameStateManager = manager ?? null;
    if (this.gameStateManager) {
      this.attachStateManagerListeners();
    }
  }

  public setManager(manager: GameStateManager): void {
    if (this.unsubscribeManager) {
      this.unsubscribeManager();
      this.unsubscribeManager = undefined;
    }
    this.gameStateManager = manager;
    this.attachStateManagerListeners();
  }

  public getManager(): GameStateManager | null {
    return this.gameStateManager;
  }

  public get status(): UniversalGameStatus {
    return this._status;
  }

  public setStatus(newStatus: UniversalGameStatus): void {
    if (this._status === newStatus) return;
    const oldStatus = this._status;
    this._status = newStatus;

    if (this.gameStateManager) {
      const currentManagerStatus = this.gameStateManager.getSnapshot().status;
      if (newStatus === "won" && currentManagerStatus !== "won") {
        this.gameStateManager.win();
      } else if (newStatus === "gameover" && currentManagerStatus !== "lost") {
        this.gameStateManager.lose();
      } else if (newStatus === "paused" && currentManagerStatus !== "paused") {
        this.gameStateManager.pause();
      } else if (newStatus === "playing" && currentManagerStatus === "paused") {
        this.gameStateManager.resume();
      } else if (newStatus === "playing" && (currentManagerStatus === "idle" || currentManagerStatus === "loading")) {
        this.gameStateManager.start();
      }
    }

    this.notifyListeners(newStatus, oldStatus);
  }

  public play(): void {
    this.setStatus("playing");
  }

  public pause(): void {
    this.setStatus("paused");
  }

  public resume(): void {
    this.setStatus("playing");
  }

  public win(): void {
    this.setStatus("won");
  }

  public lose(): void {
    this.setStatus("gameover");
  }

  public reset(): void {
    this._status = "idle";
    if (this.gameStateManager) {
      this.gameStateManager.restart();
    }
  }

  public onStatusChange(listener: GameStatusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public destroy(): void {
    if (this.unsubscribeManager) {
      this.unsubscribeManager();
      this.unsubscribeManager = undefined;
    }
    this.listeners.clear();
    this.gameStateManager = null;
    this._status = "idle";
  }

  private attachStateManagerListeners(): void {
    if (!this.gameStateManager) return;
    this.unsubscribeManager = this.gameStateManager.subscribe((snapshot: GameStateSnapshot) => {
      switch (snapshot.status) {
        case "playing":
          this._status = "playing";
          break;
        case "paused":
          this._status = "paused";
          break;
        case "won":
          this._status = "won";
          break;
        case "lost":
          this._status = "gameover";
          break;
        case "idle":
        case "loading":
          this._status = "idle";
          break;
      }
    });
  }

  private notifyListeners(current: UniversalGameStatus, previous: UniversalGameStatus): void {
    for (const listener of this.listeners) {
      try {
        listener(current, previous);
      } catch (err) {
        console.error("Error in GameStateSystem listener:", err);
      }
    }
  }
}
