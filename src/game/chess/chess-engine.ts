/**
 * DRAW2GAME — Phase 12: Multiple 2D Game Engines
 * ChessEngine Implementation
 *
 * Implements GameEngine<ChessGameDefinition> contract for the universal 2D architecture.
 * Manages chess gameplay state, coordinates moves through ChessRules, and notifies listeners.
 */

import type {
  GameEngine,
  GameEngineInitOptions,
} from "@/game/core/game-engine";
import {
  createDefaultChessGameDefinition,
  createDefaultChessPayload,
  type ChessColor,
  type ChessGameDefinition,
  type ChessPayload,
  type ChessSquare,
} from "./chess-definition";
import { ChessRules, type MoveExecutionResult } from "./chess-rules";

export type ChessStateChangeListener = (payload: ChessPayload) => void;

export class ChessEngine implements GameEngine<ChessGameDefinition> {
  public readonly engineId = "chess-standard-board";
  public readonly gameType = "chess" as const;

  private container: HTMLElement | null = null;
  private currentDefinition: ChessGameDefinition | null = null;
  private currentPayload: ChessPayload | null = null;
  private initialized = false;
  private listeners: Set<ChessStateChangeListener> = new Set();
  private running = false;

  /**
   * Initializes the engine with container and options.
   */
  public initialize(options: GameEngineInitOptions): void {
    this.container = options.container;
    this.initialized = true;
    this.running = false;
  }

  /**
   * Loads a ChessGameDefinition and sets up initial payload.
   */
  public load(definition: ChessGameDefinition): void {
    this.currentDefinition = definition;
    if (definition.typePayload) {
      this.currentPayload = { ...definition.typePayload };
    } else {
      this.currentPayload = createDefaultChessPayload();
    }
    this.notifyStateChange();
  }

  /**
   * Starts or restarts gameplay.
   */
  public start(): void {
    if (!this.initialized) {
      throw new Error("Cannot start ChessEngine before initialize() is called");
    }
    this.running = true;
  }

  /**
   * Pauses gameplay.
   */
  public pause(): void {
    this.running = false;
  }

  /**
   * Resumes gameplay.
   */
  public resume(): void {
    this.running = true;
  }

  /**
   * Restarts the chess game back to initial state.
   */
  public restart(): void {
    const id = this.currentDefinition?.id ?? "chess-game";
    const fresh = createDefaultChessGameDefinition(id);
    this.currentDefinition = fresh;
    this.currentPayload = createDefaultChessPayload();
    this.running = true;
    this.notifyStateChange();
  }

  /**
   * Destroys engine and clears listeners and references.
   */
  public destroy(): void {
    this.running = false;
    this.initialized = false;
    this.container = null;
    this.listeners.clear();
    this.currentDefinition = null;
    this.currentPayload = null;
  }

  public get isInitialized(): boolean {
    return this.initialized;
  }

  public get isRunning(): boolean {
    return this.running;
  }

  // ==========================================
  // Chess-Specific Engine Methods
  // ==========================================

  public getPayload(): ChessPayload | null {
    return this.currentPayload;
  }

  public getDefinition(): ChessGameDefinition | null {
    return this.currentDefinition;
  }

  public getContainer(): HTMLElement | null {
    return this.container;
  }

  /**
   * Selects a square, calculating and highlighting legal moves if it contains a friendly piece.
   */
  public selectSquare(square: ChessSquare | null): void {
    if (!this.currentPayload) return;

    if (!square) {
      this.currentPayload = {
        ...this.currentPayload,
        legalMovesForSelected: undefined,
        selectedSquare: null,
      };
      this.notifyStateChange();
      return;
    }

    const piece = ChessRules.getPieceAt(this.currentPayload.pieces, square);
    if (piece && piece.color === this.currentPayload.currentTurn) {
      const legalMoves = ChessRules.getLegalMoves(
        piece,
        this.currentPayload.pieces,
        this.currentPayload.enPassantTargetSquare,
      );
      this.currentPayload = {
        ...this.currentPayload,
        legalMovesForSelected: legalMoves,
        selectedSquare: square,
      };
    } else {
      this.currentPayload = {
        ...this.currentPayload,
        legalMovesForSelected: undefined,
        selectedSquare: null,
      };
    }

    this.notifyStateChange();
  }

  /**
   * Attempts to execute a move from selected square to destination square.
   */
  public makeMove(
    from: ChessSquare,
    to: ChessSquare,
    promotionType: "queen" | "rook" | "bishop" | "knight" = "queen",
  ): MoveExecutionResult {
    if (!this.currentPayload) {
      throw new Error("No chess game currently loaded in ChessEngine");
    }

    const result = ChessRules.executeMove(
      this.currentPayload,
      from,
      to,
      promotionType,
    );

    if (result.success) {
      this.currentPayload = result.updatedPayload;
      if (this.currentDefinition) {
        this.currentDefinition = {
          ...this.currentDefinition,
          typePayload: this.currentPayload,
        };
      }
      this.notifyStateChange();
    }

    return result;
  }

  /**
   * Toggles board view orientation between White and Black.
   */
  public flipBoard(): void {
    if (!this.currentPayload) return;
    const nextOrient: ChessColor =
      this.currentPayload.orientation === "white" ? "black" : "white";

    this.currentPayload = {
      ...this.currentPayload,
      orientation: nextOrient,
    };
    this.notifyStateChange();
  }

  /**
   * Subscribes to chess state updates.
   */
  public onStateChange(listener: ChessStateChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyStateChange(): void {
    if (!this.currentPayload) return;
    const snap = { ...this.currentPayload };
    for (const listener of this.listeners) {
      try {
        listener(snap);
      } catch (err) {
        console.error("Error in ChessEngine state listener:", err);
      }
    }
  }
}
