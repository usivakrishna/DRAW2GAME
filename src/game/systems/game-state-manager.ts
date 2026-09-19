import type { GameStatus } from "@/types/game";

export interface GameStateSnapshot {
  causeOfDeath?: string | undefined;
  coinsCollected: number;
  score: number;
  status: GameStatus;
  totalCoins: number;
}

export type StateChangeListener = (snapshot: GameStateSnapshot) => void;

export class GameStateManager {
  private status: GameStatus = "idle";
  private score = 0;
  private coinsCollected = 0;
  private totalCoins = 0;
  private causeOfDeath?: string | undefined;
  private listeners = new Set<StateChangeListener>();

  constructor(totalCoins = 0) {
    this.totalCoins = totalCoins;
  }

  public getSnapshot(): GameStateSnapshot {
    return {
      causeOfDeath: this.causeOfDeath,
      coinsCollected: this.coinsCollected,
      score: this.score,
      status: this.status,
      totalCoins: this.totalCoins,
    };
  }

  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  public start(): void {
    if (this.status === "idle" || this.status === "loading") {
      this.status = "playing";
      this.notify();
    }
  }

  public pause(): void {
    if (this.status === "playing") {
      this.status = "paused";
      this.notify();
    }
  }

  public resume(): void {
    if (this.status === "paused") {
      this.status = "playing";
      this.notify();
    }
  }

  public togglePause(): void {
    if (this.status === "playing") {
      this.pause();
    } else if (this.status === "paused") {
      this.resume();
    }
  }

  public collectCoin(): void {
    if (this.status !== "playing") return;
    this.score += 1;
    this.coinsCollected += 1;
    this.notify();
  }

  public win(): void {
    if (this.status !== "playing") return;
    this.status = "won";
    this.notify();
  }

  public lose(reason = "You were eliminated"): void {
    if (this.status !== "playing") return;
    this.status = "lost";
    this.causeOfDeath = reason;
    this.notify();
  }

  public restart(newTotalCoins?: number): void {
    this.status = "playing";
    this.score = 0;
    this.coinsCollected = 0;
    this.causeOfDeath = undefined;
    if (newTotalCoins !== undefined) {
      this.totalCoins = newTotalCoins;
    }
    this.notify();
  }
}
