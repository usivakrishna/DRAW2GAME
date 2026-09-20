/**
 * DRAW2GAME — Phase 13: Universal Game Generation Architecture
 * Chess GameDefinition Validator
 *
 * Validates the chess-specific components of a ChessGameDefinition,
 * ensuring board integrity, king presence, unique square occupancy,
 * and valid piece representations.
 */

import {
  CHESS_FILES,
  CHESS_RANKS,
  type ChessGameDefinition,
  type ChessSquare,
} from "@/game/chess/chess-definition";
import type { ValidationIssue, ValidationResult } from "./validation-types";

const VALID_PIECE_TYPES = new Set([
  "pawn",
  "knight",
  "bishop",
  "rook",
  "queen",
  "king",
]);

const VALID_PIECE_COLORS = new Set(["white", "black"]);

export class ChessValidator {
  /**
   * Validates a ChessGameDefinition.
   */
  public static validate(gameDef: ChessGameDefinition): ValidationResult {
    const issues: ValidationIssue[] = [];

    // 1. Verify gameType
    if (gameDef.gameType !== "chess") {
      issues.push({
        code: "INVALID_GENRE",
        message: `Expected gameType 'chess', received '${gameDef.gameType}'.`,
        path: "gameType",
        severity: "error",
      });
      return {
        errors: issues.map((i) => i.message),
        isValid: false,
        issues,
        warnings: [],
      };
    }

    const payload = gameDef.typePayload;
    if (!payload) {
      issues.push({
        code: "MISSING_PAYLOAD",
        message: "ChessGameDefinition requires a 'typePayload' containing chess state.",
        path: "typePayload",
        severity: "error",
      });
      return {
        errors: issues.map((i) => i.message),
        isValid: false,
        issues,
        warnings: [],
      };
    }

    // 2. Board size check
    if (payload.boardSize !== 8) {
      issues.push({
        code: "INVALID_BOARD_SIZE",
        message: `Standard chess requires boardSize of 8, received ${payload.boardSize}.`,
        path: "typePayload.boardSize",
        severity: "error",
      });
    }

    // 3. Pieces array check
    if (!Array.isArray(payload.pieces)) {
      issues.push({
        code: "INVALID_PIECES_ARRAY",
        message: "Chess payload 'pieces' must be an array.",
        path: "typePayload.pieces",
        severity: "error",
      });
      return {
        errors: issues.map((i) => i.message),
        isValid: false,
        issues,
        warnings: [],
      };
    }

    // 4. Piece count sanity check
    if (payload.pieces.length < 2) {
      issues.push({
        code: "INSUFFICIENT_PIECES",
        message: `Chess game requires at least 2 pieces (kings), found ${payload.pieces.length}.`,
        path: "typePayload.pieces",
        severity: "error",
      });
    } else if (payload.pieces.length > 32) {
      issues.push({
        code: "EXCESSIVE_PIECES",
        message: `Standard chess cannot exceed 32 pieces, found ${payload.pieces.length}.`,
        path: "typePayload.pieces",
        severity: "warning",
      });
    }

    // 5. Piece validation & King counting
    let whiteKings = 0;
    let blackKings = 0;
    const occupiedSquares = new Map<ChessSquare, string>();

    for (let i = 0; i < payload.pieces.length; i++) {
      const p = payload.pieces[i];
      if (!p || typeof p !== "object") {
        issues.push({
          code: "INVALID_PIECE_OBJECT",
          message: `Piece at index ${i} is invalid.`,
          path: `typePayload.pieces[${i}]`,
          severity: "error",
        });
        continue;
      }

      // Type check
      if (!VALID_PIECE_TYPES.has(p.type)) {
        issues.push({
          code: "INVALID_PIECE_TYPE",
          entityId: p.id,
          message: `Piece "${p.id || i}" has invalid type '${p.type}'.`,
          path: `typePayload.pieces[${i}].type`,
          severity: "error",
        });
      }

      // Color check
      if (!VALID_PIECE_COLORS.has(p.color)) {
        issues.push({
          code: "INVALID_PIECE_COLOR",
          entityId: p.id,
          message: `Piece "${p.id || i}" has invalid color '${p.color}'.`,
          path: `typePayload.pieces[${i}].color`,
          severity: "error",
        });
      }

      // Square format check
      const square = p.square;
      const isValidSquareFormat =
        typeof square === "string" &&
        square.length === 2 &&
        (CHESS_FILES as readonly string[]).includes(square[0]!.toLowerCase()) &&
        (CHESS_RANKS as readonly number[]).includes(Number(square[1]));

      if (!isValidSquareFormat) {
        issues.push({
          code: "INVALID_SQUARE",
          entityId: p.id,
          message: `Piece "${p.id}" occupies invalid square '${square}'. Expected algebraic square (a1-h8).`,
          path: `typePayload.pieces[${i}].square`,
          severity: "error",
        });
      } else {
        // Square collision check
        if (occupiedSquares.has(square)) {
          issues.push({
            code: "DUPLICATE_SQUARE_OCCUPANCY",
            entityId: p.id,
            message: `Square '${square}' is occupied by multiple pieces: "${occupiedSquares.get(square)}" and "${p.id}".`,
            path: `typePayload.pieces[${i}].square`,
            severity: "error",
          });
        } else {
          occupiedSquares.set(square, p.id);
        }
      }

      // King presence tracker
      if (p.type === "king") {
        if (p.color === "white") whiteKings++;
        if (p.color === "black") blackKings++;
      }
    }

    // 6. King presence requirements
    if (whiteKings === 0) {
      issues.push({
        code: "MISSING_WHITE_KING",
        message: "Chess board must have exactly one white king.",
        path: "typePayload.pieces",
        severity: "error",
      });
    } else if (whiteKings > 1) {
      issues.push({
        code: "MULTIPLE_WHITE_KINGS",
        message: `Chess board has ${whiteKings} white kings. Exactly 1 is required.`,
        path: "typePayload.pieces",
        severity: "error",
      });
    }

    if (blackKings === 0) {
      issues.push({
        code: "MISSING_BLACK_KING",
        message: "Chess board must have exactly one black king.",
        path: "typePayload.pieces",
        severity: "error",
      });
    } else if (blackKings > 1) {
      issues.push({
        code: "MULTIPLE_BLACK_KINGS",
        message: `Chess board has ${blackKings} black kings. Exactly 1 is required.`,
        path: "typePayload.pieces",
        severity: "error",
      });
    }

    // 7. Turn validation
    if (payload.currentTurn !== "white" && payload.currentTurn !== "black") {
      issues.push({
        code: "INVALID_TURN",
        message: `currentTurn must be 'white' or 'black', received '${payload.currentTurn}'.`,
        path: "typePayload.currentTurn",
        severity: "error",
      });
    }

    const errors = issues.filter((i) => i.severity === "error").map((i) => i.message);
    const warnings = issues.filter((i) => i.severity === "warning").map((i) => i.message);

    return {
      errors,
      isValid: errors.length === 0,
      issues,
      warnings,
    };
  }
}
