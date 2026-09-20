/**
 * DRAW2GAME — Universal Game Engine Architecture
 * Score System
 *
 * Tracks score, lives, collectibles, and notifies subscribers.
 */

export interface ScoreSystemState {
  collectiblesCount: number;
  lives: number;
  multiplier: number;
  score: number;
  targetCollectibles: number;
}

export type ScoreChangeListener = (state: ScoreSystemState) => void;

export class ScoreSystem {
  private _score = 0;
  private _lives = 3;
  private _collectiblesCount = 0;
  private _targetCollectibles = 0;
  private _multiplier = 1;
  private listeners: Set<ScoreChangeListener> = new Set();

  constructor(targetCollectibles = 0, initialLives = 3) {
    this._targetCollectibles = targetCollectibles;
    this._lives = initialLives;
  }

  public get score(): number {
    return this._score;
  }

  public get lives(): number {
    return this._lives;
  }

  public get collectiblesCount(): number {
    return this._collectiblesCount;
  }

  public get targetCollectibles(): number {
    return this._targetCollectibles;
  }

  public addScore(points: number): void {
    this._score += Math.round(points * this._multiplier);
    this.notify();
  }

  public collectItem(points = 10): void {
    this._collectiblesCount += 1;
    this.addScore(points);
  }

  public loseLife(): number {
    this._lives = Math.max(0, this._lives - 1);
    this.notify();
    return this._lives;
  }

  public setMultiplier(val: number): void {
    this._multiplier = Math.max(1, val);
  }

  public reset(targetCollectibles = 0, initialLives = 3): void {
    this._score = 0;
    this._lives = initialLives;
    this._collectiblesCount = 0;
    this._targetCollectibles = targetCollectibles;
    this._multiplier = 1;
    this.notify();
  }

  public getState(): ScoreSystemState {
    return {
      collectiblesCount: this._collectiblesCount,
      lives: this._lives,
      multiplier: this._multiplier,
      score: this._score,
      targetCollectibles: this._targetCollectibles,
    };
  }

  public onScoreChange(listener: ScoreChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public destroy(): void {
    this.listeners.clear();
  }

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error("Error in ScoreSystem listener:", err);
      }
    }
  }
}
