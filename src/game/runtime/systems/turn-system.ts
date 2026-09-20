/**
 * DRAW2GAME — Universal Game Engine Architecture
 * Turn System
 *
 * Generic turn management for turn-based games (chess, ludo, checkers, etc.).
 * Handles turn rotation, move history, and turn-based callbacks.
 */

export type TurnParticipant = string;

export interface TurnRecord<TMove = unknown> {
  move: TMove;
  participant: TurnParticipant;
  timestamp: number;
  turnNumber: number;
}

export type TurnChangeListener = (currentTurn: TurnParticipant, turnNumber: number) => void;

export class TurnSystem<TMove = unknown> {
  private participants: TurnParticipant[] = [];
  private activeIndex = 0;
  private turnCount = 1;
  private history: TurnRecord<TMove>[] = [];
  private listeners: Set<TurnChangeListener> = new Set();

  constructor(participants: TurnParticipant[] = ["white", "black"]) {
    this.participants = [...participants];
  }

  public setParticipants(participants: TurnParticipant[]): void {
    this.participants = [...participants];
    this.activeIndex = 0;
  }

  public get currentTurn(): TurnParticipant {
    return this.participants[this.activeIndex] ?? "player";
  }

  public get turnNumber(): number {
    return this.turnCount;
  }

  public setTurn(participant: TurnParticipant): void {
    const idx = this.participants.indexOf(participant);
    if (idx >= 0) {
      this.activeIndex = idx;
      this.notify();
    }
  }

  public nextTurn(): TurnParticipant {
    if (this.participants.length > 0) {
      this.activeIndex = (this.activeIndex + 1) % this.participants.length;
      if (this.activeIndex === 0) {
        this.turnCount += 1;
      }
    }
    this.notify();
    return this.currentTurn;
  }

  public recordMove(move: TMove): void {
    this.history.push({
      move,
      participant: this.currentTurn,
      timestamp: Date.now(),
      turnNumber: this.turnCount,
    });
  }

  public getMoveHistory(): readonly TurnRecord<TMove>[] {
    return [...this.history];
  }

  public reset(startingParticipant?: TurnParticipant): void {
    this.history = [];
    this.turnCount = 1;
    if (startingParticipant && this.participants.includes(startingParticipant)) {
      this.activeIndex = this.participants.indexOf(startingParticipant);
    } else {
      this.activeIndex = 0;
    }
    this.notify();
  }

  public onTurnChange(listener: TurnChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public destroy(): void {
    this.listeners.clear();
    this.history = [];
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentTurn, this.turnCount);
      } catch (err) {
        console.error("Error in TurnSystem listener:", err);
      }
    }
  }
}
