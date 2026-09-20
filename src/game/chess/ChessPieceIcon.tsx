/**
 * DRAW2GAME — Phase 12: Multiple 2D Game Engines
 * Vector SVG Chess Piece Component
 *
 * Renders high-fidelity, distinguishable vector chess pieces
 * for White and Black across King, Queen, Rook, Bishop, Knight, and Pawn.
 */

import type { ChessColor, ChessPieceType } from "./chess-definition";

interface ChessPieceIconProps {
  className?: string | undefined;
  color: ChessColor;
  type: ChessPieceType;
}

export function ChessPieceIcon({ className = "size-10", color, type }: ChessPieceIconProps) {
  const isWhite = color === "white";

  // Visual styling parameters
  const strokeColor = isWhite ? "#1e293b" : "#f8fafc";
  const fillColor = isWhite ? "#ffffff" : "#0f172a";
  const accentColor = isWhite ? "#cbd5e1" : "#334155";

  switch (type) {
    case "king":
      return (
        <svg
          aria-label={`${color} king`}
          className={className}
          fill="none"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 45 45"
        >
          {/* Base */}
          <path d="M9 36h27v4H9z" fill={fillColor} />
          {/* Body */}
          <path
            d="M12 36l3-15h15l3 15H12z"
            fill={fillColor}
          />
          {/* Crown */}
          <path
            d="M11 21l4-7 7.5 5 7.5-5 4 7H11z"
            fill={accentColor}
          />
          {/* Cross */}
          <path d="M22.5 6v7M19 9.5h7" stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="22.5" cy="9.5" fill={fillColor} r="2" />
        </svg>
      );

    case "queen":
      return (
        <svg
          aria-label={`${color} queen`}
          className={className}
          fill="none"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 45 45"
        >
          {/* Base */}
          <path d="M9 36h27v4H9z" fill={fillColor} />
          {/* Body */}
          <path
            d="M12 36l2-16 8.5 7 8.5-7 2 16H12z"
            fill={fillColor}
          />
          {/* Crown points with pearls */}
          <path
            d="M10 20l3-9 9.5 8 9.5-8 3 9H10z"
            fill={accentColor}
          />
          <circle cx="13" cy="11" fill={fillColor} r="2" />
          <circle cx="22.5" cy="8" fill={fillColor} r="2.5" />
          <circle cx="32" cy="11" fill={fillColor} r="2" />
        </svg>
      );

    case "rook":
      return (
        <svg
          aria-label={`${color} rook`}
          className={className}
          fill="none"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 45 45"
        >
          {/* Base */}
          <path d="M9 36h27v4H9z" fill={fillColor} />
          {/* Body */}
          <path d="M13 36l2-18h15l2 18H13z" fill={fillColor} />
          {/* Castle Battlements */}
          <path
            d="M11 18h23v-7h-5v3h-4v-3h-5v3h-4v-3h-5v7z"
            fill={accentColor}
          />
        </svg>
      );

    case "bishop":
      return (
        <svg
          aria-label={`${color} bishop`}
          className={className}
          fill="none"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 45 45"
        >
          {/* Base */}
          <path d="M12 36h21v4H12z" fill={fillColor} />
          {/* Body & Mitre */}
          <path
            d="M15 36l2-12c-2-3-2-7 0-10 3-4 8-4 11 0 2 3 2 7 0 10l2 12H15z"
            fill={fillColor}
          />
          {/* Slit */}
          <path d="M22.5 14v10M19 19h7" stroke={strokeColor} strokeWidth="1.5" />
          {/* Top cross pearl */}
          <circle cx="22.5" cy="9" fill={accentColor} r="2" />
        </svg>
      );

    case "knight":
      return (
        <svg
          aria-label={`${color} knight`}
          className={className}
          fill="none"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 45 45"
        >
          {/* Base */}
          <path d="M11 36h23v4H11z" fill={fillColor} />
          {/* Horse Head */}
          <path
            d="M13 36l1-12c0-3 2-6 5-8 1-2 1-4 0-6 4 1 7 4 8 8 3 1 6 3 6 7-2 3-5 5-8 5l-2 6H13z"
            fill={fillColor}
          />
          {/* Mane and eye */}
          <circle cx="21" cy="18" fill={strokeColor} r="1.5" />
          <path d="M17 24l4-2 3 4" stroke={accentColor} strokeWidth="2" />
        </svg>
      );

    case "pawn":
      return (
        <svg
          aria-label={`${color} pawn`}
          className={className}
          fill="none"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 45 45"
        >
          {/* Base */}
          <path d="M13 36h19v4H13z" fill={fillColor} />
          {/* Body */}
          <path d="M16 36l2-14h9l2 14H16z" fill={fillColor} />
          {/* Collar */}
          <path d="M16 22h13v-3H16z" fill={accentColor} />
          {/* Head sphere */}
          <circle cx="22.5" cy="13" fill={fillColor} r="5" />
        </svg>
      );
  }
}
