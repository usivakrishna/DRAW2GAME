/**
 * DRAW2GAME — Phase 12: Multiple 2D Game Engines
 * Interactive 8x8 Chess Board View Component
 *
 * Renders an alternating board, coordinate margins, pieces, selection rings,
 * legal move target dots, and in-check warning highlights.
 */

import { useCallback, useMemo } from "react";
import {
  CHESS_FILES,
  CHESS_RANKS,
  squareToCoord,
  type ChessPayload,
  type ChessSquare,
} from "./chess-definition";
import type { UniversalGameEngine } from "@/game/runtime/universal-game-engine";
import { ChessPieceIcon } from "./ChessPieceIcon";
import { ChessRules } from "./chess-rules";

interface ChessBoardViewProps {
  engine: UniversalGameEngine;
  payload: ChessPayload;
}

export function ChessBoardView({ engine, payload }: ChessBoardViewProps) {
  const { currentTurn, gameStatus, legalMovesForSelected = [], orientation, pieces, selectedSquare } =
    payload;

  // Determine which King is in check (if check or checkmate)
  const kingInCheckSquare = useMemo(() => {
    if (gameStatus === "check" || gameStatus === "checkmate") {
      const king = ChessRules.findKing(pieces, currentTurn);
      return king ? king.square : null;
    }
    return null;
  }, [currentTurn, gameStatus, pieces]);

  // Coordinate display arrays depending on orientation
  const displayedFiles = useMemo(() => {
    return orientation === "white" ? [...CHESS_FILES] : [...CHESS_FILES].reverse();
  }, [orientation]);

  const displayedRanks = useMemo(() => {
    return orientation === "white" ? [...CHESS_RANKS].reverse() : [...CHESS_RANKS];
  }, [orientation]);

  // Handler: Click square
  const handleSquareClick = useCallback(
    (square: ChessSquare) => {
      // If game is concluded, do not allow further selection
      if (gameStatus === "checkmate" || gameStatus === "stalemate" || gameStatus === "draw") {
        return;
      }

      // 1. If a square is already selected and clicked square is a legal move:
      if (selectedSquare && legalMovesForSelected.includes(square)) {
        engine.makeMove(selectedSquare, square);
        return;
      }

      // 2. If clicking a piece of the current player's turn:
      const clickedPiece = ChessRules.getPieceAt(pieces, square);
      if (clickedPiece && clickedPiece.color === currentTurn) {
        if (selectedSquare === square) {
          // Deselect if clicking the same square
          engine.selectSquare(null);
        } else {
          engine.selectSquare(square);
        }
        return;
      }

      // 3. Otherwise deselect
      if (selectedSquare) {
        engine.selectSquare(null);
      }
    },
    [currentTurn, engine, gameStatus, legalMovesForSelected, pieces, selectedSquare],
  );

  return (
    <div className="relative mx-auto flex w-full max-w-[620px] select-none flex-col items-center justify-center p-2 sm:p-4">
      {/* 8x8 Board Container with Sleek Outer Border */}
      <div
        aria-label="8x8 Chess Board"
        className="relative grid aspect-square w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-xl border-4 border-slate-700 bg-slate-900 shadow-2xl"
      >
        {displayedRanks.map((rank) =>
          displayedFiles.map((file) => {
            const square = `${file}${rank}` as ChessSquare;
            const { col, row } = squareToCoord(square);
            const isLight = (col + row) % 2 === 0;

            const piece = ChessRules.getPieceAt(pieces, square);
            const isSelected = selectedSquare === square;
            const isLegalTarget = legalMovesForSelected.includes(square);
            const isKingInCheck = kingInCheckSquare === square;

            // Square background colors
            const bgColor = isLight ? "bg-slate-100" : "bg-slate-700";

            return (
              <button
                aria-label={`Square ${square}${piece ? `, ${piece.color} ${piece.type}` : ""}`}
                className={`relative flex items-center justify-center transition-colors focus:outline-none ${bgColor} ${
                  isSelected ? "ring-4 ring-inset ring-emerald-400 bg-emerald-100/50" : ""
                } ${
                  isKingInCheck ? "ring-4 ring-inset ring-rose-500 bg-rose-500/40 animate-pulse" : ""
                }`}
                key={square}
                onClick={() => handleSquareClick(square)}
                type="button"
              >
                {/* File / Rank Coordinate Labels on edges */}
                {file === displayedFiles[0] && (
                  <span
                    className={`absolute left-1 top-0.5 text-[10px] font-bold select-none ${
                      isLight ? "text-slate-400" : "text-slate-400"
                    }`}
                  >
                    {rank}
                  </span>
                )}
                {rank === displayedRanks[displayedRanks.length - 1] && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[10px] font-bold select-none ${
                      isLight ? "text-slate-400" : "text-slate-400"
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Chess Piece Icon */}
                {piece && (
                  <div className="relative z-10 grid size-full place-items-center p-1 transition-transform hover:scale-105">
                    <ChessPieceIcon
                      className="size-4/5 drop-shadow-md"
                      color={piece.color}
                      type={piece.type}
                    />
                  </div>
                )}

                {/* Legal Move Indicators */}
                {isLegalTarget && (
                  <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                    {piece ? (
                      // Capture target: outer pulsing ring
                      <div className="size-full rounded-sm border-4 border-rose-500/80 bg-rose-500/20 animate-pulse" />
                    ) : (
                      // Empty square target: center dot
                      <div className="size-3.5 sm:size-4.5 rounded-full bg-emerald-500/75 shadow-sm" />
                    )}
                  </div>
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
