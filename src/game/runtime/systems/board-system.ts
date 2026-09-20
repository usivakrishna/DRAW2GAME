/**
 * DRAW2GAME — Universal Game Engine Architecture
 * Board & Grid System
 *
 * Generic board/grid management for board games, grid puzzles, and tile games.
 * Manages grid layout, square coordinates, piece occupancy, selection,
 * and delegates move calculations to game rules.
 */

export interface BoardDimensions {
  cols: number;
  rows: number;
  squareSize: number;
}

export interface BoardSquareCoord {
  col: number;
  row: number;
}

export interface BoardPiece<TProps = Record<string, unknown>> {
  color?: string | undefined;
  id: string;
  properties?: TProps | undefined;
  square: string;
  type: string;
}

export type BoardSelectionListener = (selectedSquare: string | null, legalMoves: string[]) => void;

export class BoardSystem<TPiece extends BoardPiece = BoardPiece> {
  private dimensions: BoardDimensions = { cols: 8, rows: 8, squareSize: 64 };
  private pieces: Map<string, TPiece> = new Map(); // id -> piece
  private occupancy: Map<string, TPiece> = new Map(); // square -> piece
  private _selectedSquare: string | null = null;
  private _legalMoves: string[] = [];
  private selectionListeners: Set<BoardSelectionListener> = new Set();
  private _orientation: "white" | "black" = "white";

  constructor(dimensions?: Partial<BoardDimensions>) {
    if (dimensions) {
      this.dimensions = { ...this.dimensions, ...dimensions };
    }
  }

  public get cols(): number {
    return this.dimensions.cols;
  }

  public get rows(): number {
    return this.dimensions.rows;
  }

  public get squareSize(): number {
    return this.dimensions.squareSize;
  }

  public get orientation(): "white" | "black" {
    return this._orientation;
  }

  public setOrientation(orientation: "white" | "black"): void {
    this._orientation = orientation;
  }

  public toggleOrientation(): "white" | "black" {
    this._orientation = this._orientation === "white" ? "black" : "white";
    return this._orientation;
  }

  public loadPieces(pieces: TPiece[]): void {
    this.pieces.clear();
    this.occupancy.clear();
    for (const p of pieces) {
      this.pieces.set(p.id, p);
      this.occupancy.set(p.square, p);
    }
    this._selectedSquare = null;
    this._legalMoves = [];
  }

  public getPieces(): TPiece[] {
    return Array.from(this.pieces.values());
  }

  public getPieceAt(square: string): TPiece | undefined {
    return this.occupancy.get(square);
  }

  public setPiece(piece: TPiece): void {
    // If piece was on another square, remove from occupancy
    const existing = this.pieces.get(piece.id);
    if (existing && existing.square !== piece.square) {
      this.occupancy.delete(existing.square);
    }
    this.pieces.set(piece.id, piece);
    this.occupancy.set(piece.square, piece);
  }

  public removePiece(pieceId: string): TPiece | undefined {
    const piece = this.pieces.get(pieceId);
    if (piece) {
      this.pieces.delete(pieceId);
      this.occupancy.delete(piece.square);
    }
    return piece;
  }

  public movePiece(pieceId: string, toSquare: string): boolean {
    const piece = this.pieces.get(pieceId);
    if (!piece) return false;

    // Remove any captured piece at destination
    const existingAtDest = this.occupancy.get(toSquare);
    if (existingAtDest && existingAtDest.id !== pieceId) {
      this.pieces.delete(existingAtDest.id);
    }

    this.occupancy.delete(piece.square);
    piece.square = toSquare;
    this.occupancy.set(toSquare, piece);
    return true;
  }

  public selectSquare(square: string | null, legalMoves: string[] = []): void {
    this._selectedSquare = square;
    this._legalMoves = legalMoves;
    this.notifySelection();
  }

  public get selectedSquare(): string | null {
    return this._selectedSquare;
  }

  public get legalMoves(): readonly string[] {
    return this._legalMoves;
  }

  public clearSelection(): void {
    this.selectSquare(null, []);
  }

  public onSelectionChange(listener: BoardSelectionListener): () => void {
    this.selectionListeners.add(listener);
    return () => {
      this.selectionListeners.delete(listener);
    };
  }

  public clear(): void {
    this.pieces.clear();
    this.occupancy.clear();
    this._selectedSquare = null;
    this._legalMoves = [];
    this.notifySelection();
  }

  public destroy(): void {
    this.clear();
    this.selectionListeners.clear();
  }

  private notifySelection(): void {
    for (const listener of this.selectionListeners) {
      try {
        listener(this._selectedSquare, [...this._legalMoves]);
      } catch (err) {
        console.error("Error in BoardSystem selection listener:", err);
      }
    }
  }
}
