/**
 * DRAW2GAME — Phase 12: Multiple 2D Game Engines
 * Chess Game Definition & Data Models
 *
 * Implements the typed ChessGameDefinition based on the canonical
 * Phase 10 GenericGameDefinition architecture.
 */

import type {
  EngineConfig,
  GameAsset,
  GameMetadata,
  GameObject,
  GameRule,
  GameSettings,
  GameViewport,
  GenericGameDefinition,
} from "@/game/core/game-definition";

export type ChessColor = "white" | "black";
export type ChessPieceType =
  | "pawn"
  | "knight"
  | "bishop"
  | "rook"
  | "queen"
  | "king";

export const CHESS_FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export type ChessFile = (typeof CHESS_FILES)[number];

export const CHESS_RANKS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export type ChessRank = (typeof CHESS_RANKS)[number];

export type ChessSquare = `${ChessFile}${ChessRank}`;

export interface ChessPiece {
  color: ChessColor;
  hasMoved?: boolean | undefined;
  id: string;
  square: ChessSquare;
  type: ChessPieceType;
}

export interface ChessMove {
  capturedPiece?: ChessPiece | undefined;
  from: ChessSquare;
  isCastling?: ("kingside" | "queenside") | undefined;
  isCheck?: boolean | undefined;
  isCheckmate?: boolean | undefined;
  isEnPassant?: boolean | undefined;
  piece: ChessPiece;
  promotedTo?: ("queen" | "rook" | "bishop" | "knight") | undefined;
  san?: string | undefined;
  to: ChessSquare;
}

export type ChessGameStatus =
  | "in-progress"
  | "check"
  | "checkmate"
  | "stalemate"
  | "draw";

export interface ChessPayload {
  boardSize: number; // 8
  capturedBlack: ChessPiece[]; // Black pieces captured by white
  capturedWhite: ChessPiece[]; // White pieces captured by black
  currentTurn: ChessColor;
  enPassantTargetSquare?: ChessSquare | null | undefined;
  gameStatus: ChessGameStatus;
  legalMovesForSelected?: ChessSquare[] | undefined;
  moveHistory: ChessMove[];
  orientation: ChessColor; // Board view orientation
  pieces: ChessPiece[];
  selectedSquare?: ChessSquare | null | undefined;
  winner?: (ChessColor | "draw") | undefined;
}

export type ChessGameDefinition = GenericGameDefinition<"chess", ChessPayload>;

/**
 * Coordinate converters:
 * col 0-7 maps to files 'a' - 'h'
 * row 0-7 maps to ranks 8 - 1 (row 0 = rank 8, row 7 = rank 1)
 */
export function squareToCoord(square: ChessSquare): { col: number; row: number } {
  const fileChar = square[0]?.toLowerCase();
  const rankChar = square[1];
  const col = CHESS_FILES.indexOf(fileChar as ChessFile);
  const rankNum = Number(rankChar);
  const row = 8 - rankNum;
  return { col, row };
}

export function coordToSquare(col: number, row: number): ChessSquare | null {
  if (col < 0 || col > 7 || row < 0 || row > 7) return null;
  const file = CHESS_FILES[col];
  const rank = 8 - row;
  if (!file || rank < 1 || rank > 8) return null;
  return `${file}${rank as ChessRank}`;
}

/**
 * Generates the standard standard 32-piece initial chess board.
 */
export function createInitialChessBoard(): ChessPiece[] {
  const pieces: ChessPiece[] = [];

  // Helper to push piece
  const addPiece = (
    color: ChessColor,
    type: ChessPieceType,
    fileIdx: number,
    rankNum: ChessRank,
    index: number,
  ) => {
    const file = CHESS_FILES[fileIdx];
    if (!file) return;
    const square: ChessSquare = `${file}${rankNum}`;
    pieces.push({
      color,
      hasMoved: false,
      id: `${color}-${type}-${index}`,
      square,
      type,
    });
  };

  // Back-rank piece order: R, N, B, Q, K, B, N, R
  const backRankTypes: ChessPieceType[] = [
    "rook",
    "knight",
    "bishop",
    "queen",
    "king",
    "bishop",
    "knight",
    "rook",
  ];

  // 1. White Back Rank (Rank 1) & Pawns (Rank 2)
  backRankTypes.forEach((type, i) => {
    addPiece("white", type, i, 1, i);
  });
  for (let i = 0; i < 8; i++) {
    addPiece("white", "pawn", i, 2, i);
  }

  // 2. Black Back Rank (Rank 8) & Pawns (Rank 7)
  backRankTypes.forEach((type, i) => {
    addPiece("black", type, i, 8, i);
  });
  for (let i = 0; i < 8; i++) {
    addPiece("black", "pawn", i, 7, i);
  }

  return pieces;
}

export const DEFAULT_CHESS_RULES: GameRule[] = [
  {
    description: "White moves first, then turns alternate.",
    id: "chess-rule-turn",
    name: "Alternating Turns",
  },
  {
    description: "Pieces move according to standard FIDE chess movement patterns.",
    id: "chess-rule-movement",
    name: "Standard Piece Movement",
  },
  {
    description: "Moves that expose or leave the king in check are strictly illegal.",
    id: "chess-rule-king-safety",
    name: "King Safety",
  },
  {
    description: "A player wins when the opponent is in check with no legal escape moves.",
    id: "chess-rule-checkmate",
    name: "Checkmate Victory",
  },
];

/**
 * Creates a default, ready-to-play ChessPayload with standard starting board.
 */
export function createDefaultChessPayload(): ChessPayload {
  return {
    boardSize: 8,
    capturedBlack: [],
    capturedWhite: [],
    currentTurn: "white",
    enPassantTargetSquare: null,
    gameStatus: "in-progress",
    moveHistory: [],
    orientation: "white",
    pieces: createInitialChessBoard(),
  };
}

/**
 * Creates a standard ChessGameDefinition container.
 */
export function createDefaultChessGameDefinition(
  id: string,
  name: string = "Standard Chess",
): ChessGameDefinition & { typePayload: ChessPayload } {
  const pieces = createInitialChessBoard();

  // Project pieces to Generic GameObjects for canonical architecture compatibility
  const objects: GameObject[] = pieces.map((p) => {
    const { col, row } = squareToCoord(p.square);
    return {
      height: 64,
      id: p.id,
      name: `${p.color} ${p.type}`,
      properties: {
        color: p.color,
        hasMoved: false,
        square: p.square,
      },
      type: `chess-${p.type}`,
      width: 64,
      x: col * 64,
      y: row * 64,
    };
  });

  const viewport: GameViewport = {
    height: 800,
    width: 800,
  };

  const metadata: GameMetadata = {
    createdAt: new Date().toISOString(),
    description: "Classic 8x8 Chess game engine for DRAW2GAME",
    source: "manual",
  };

  const settings: GameSettings = {
    audioEnabled: true,
    debugPhysics: false,
    styleId: "classic",
    themeId: "wooden",
  };

  const engineConfig: EngineConfig = {
    backgroundColor: "#1e293b",
    engineId: "chess-engine",
    fps: 60,
    renderer: "auto",
  };

  const typePayload = createDefaultChessPayload();

  return {
    assets: [] as GameAsset[],
    engineConfig,
    gameType: "chess",
    id,
    metadata,
    name,
    objects,
    rules: DEFAULT_CHESS_RULES,
    settings,
    typePayload,
    version: 1,
    viewport,
  };
}
