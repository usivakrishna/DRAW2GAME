/**
 * DRAW2GAME — Phase 12: Multiple 2D Game Engines
 * Complete Chess Rules & Move Validation Engine
 *
 * Implements standard FIDE movement rules, path blocking, capture logic,
 * king safety verification, check detection, checkmate, stalemate, castling,
 * and pawn promotion.
 */

import {
  CHESS_FILES,
  coordToSquare,
  squareToCoord,
  type ChessColor,
  type ChessMove,
  type ChessPayload,
  type ChessPiece,
  type ChessPieceType,
  type ChessSquare,
} from "./chess-definition";

export interface MoveExecutionResult {
  error?: string | undefined;
  move?: ChessMove | undefined;
  success: boolean;
  updatedPayload: ChessPayload;
}

export class ChessRules {
  /**
   * Finds the piece at a given square.
   */
  public static getPieceAt(
    board: readonly ChessPiece[],
    square: ChessSquare,
  ): ChessPiece | undefined {
    return board.find((p) => p.square === square);
  }

  /**
   * Finds the King of a specific color.
   */
  public static findKing(
    board: readonly ChessPiece[],
    color: ChessColor,
  ): ChessPiece | undefined {
    return board.find((p) => p.color === color && p.type === "king");
  }

  /**
   * Checks if a target square is under attack by any piece of the attacking color.
   */
  public static isSquareAttacked(
    square: ChessSquare,
    board: readonly ChessPiece[],
    attackingColor: ChessColor,
  ): boolean {
    const { col: targetCol, row: targetRow } = squareToCoord(square);

    for (const piece of board) {
      if (piece.color !== attackingColor) continue;

      const { col: pCol, row: pRow } = squareToCoord(piece.square);
      const dCol = targetCol - pCol;
      const dRow = targetRow - pRow;

      switch (piece.type) {
        case "pawn": {
          // Pawns attack diagonally forward 1 step
          const forwardDir = piece.color === "white" ? -1 : 1;
          if (dRow === forwardDir && (dCol === 1 || dCol === -1)) {
            return true;
          }
          break;
        }

        case "knight": {
          // Knight L-shapes
          if (
            (Math.abs(dCol) === 1 && Math.abs(dRow) === 2) ||
            (Math.abs(dCol) === 2 && Math.abs(dRow) === 1)
          ) {
            return true;
          }
          break;
        }

        case "king": {
          // King 1 step
          if (Math.abs(dCol) <= 1 && Math.abs(dRow) <= 1) {
            return true;
          }
          break;
        }

        case "bishop":
        case "rook":
        case "queen": {
          // Ray tracing
          const isDiagonal = Math.abs(dCol) === Math.abs(dRow) && dCol !== 0;
          const isOrthogonal = (dCol === 0 && dRow !== 0) || (dRow === 0 && dCol !== 0);

          const canAttackDiagonal = piece.type === "bishop" || piece.type === "queen";
          const canAttackOrthogonal = piece.type === "rook" || piece.type === "queen";

          if (isDiagonal && canAttackDiagonal) {
            if (this.isPathClear(pCol, pRow, targetCol, targetRow, board)) {
              return true;
            }
          }

          if (isOrthogonal && canAttackOrthogonal) {
            if (this.isPathClear(pCol, pRow, targetCol, targetRow, board)) {
              return true;
            }
          }
          break;
        }
      }
    }

    return false;
  }

  /**
   * Checks whether the path between (c1, r1) and (c2, r2) is clear of pieces.
   * Exclusive of start and end squares.
   */
  public static isPathClear(
    c1: number,
    r1: number,
    c2: number,
    r2: number,
    board: readonly ChessPiece[],
  ): boolean {
    const stepCol = Math.sign(c2 - c1);
    const stepRow = Math.sign(r2 - r1);

    let currCol = c1 + stepCol;
    let currRow = r1 + stepRow;

    while (currCol !== c2 || currRow !== r2) {
      const sq = coordToSquare(currCol, currRow);
      if (sq && this.getPieceAt(board, sq)) {
        return false;
      }
      currCol += stepCol;
      currRow += stepRow;
    }

    return true;
  }

  /**
   * Checks if a player's King is currently in check.
   */
  public static isKingInCheck(
    board: readonly ChessPiece[],
    color: ChessColor,
  ): boolean {
    const king = this.findKing(board, color);
    if (!king) return false;
    const opponentColor: ChessColor = color === "white" ? "black" : "white";
    return this.isSquareAttacked(king.square, board, opponentColor);
  }

  /**
   * Calculates all pseudo-legal target squares for a piece without checking king safety.
   */
  public static getPseudoLegalMoves(
    piece: ChessPiece,
    board: readonly ChessPiece[],
    enPassantTargetSquare?: ChessSquare | null,
  ): ChessSquare[] {
    const moves: ChessSquare[] = [];
    const { col, row } = squareToCoord(piece.square);

    const tryAdd = (c: number, r: number): boolean => {
      const targetSq = coordToSquare(c, r);
      if (!targetSq) return false;

      const destPiece = this.getPieceAt(board, targetSq);
      if (!destPiece) {
        moves.push(targetSq);
        return true; // Path continues
      }
      if (destPiece.color !== piece.color) {
        moves.push(targetSq); // Can capture
      }
      return false; // Obstacle hit, ray stops
    };

    switch (piece.type) {
      case "pawn": {
        const forward = piece.color === "white" ? -1 : 1;
        const startRow = piece.color === "white" ? 6 : 1;

        // 1 square forward
        const oneForwardSq = coordToSquare(col, row + forward);
        if (oneForwardSq && !this.getPieceAt(board, oneForwardSq)) {
          moves.push(oneForwardSq);

          // 2 squares forward from starting rank
          if (row === startRow) {
            const twoForwardSq = coordToSquare(col, row + forward * 2);
            if (twoForwardSq && !this.getPieceAt(board, twoForwardSq)) {
              moves.push(twoForwardSq);
            }
          }
        }

        // Diagonal captures (including en passant)
        for (const dCol of [-1, 1]) {
          const diagSq = coordToSquare(col + dCol, row + forward);
          if (diagSq) {
            const enemy = this.getPieceAt(board, diagSq);
            if (enemy && enemy.color !== piece.color) {
              moves.push(diagSq);
            } else if (enPassantTargetSquare && diagSq === enPassantTargetSquare) {
              moves.push(diagSq);
            }
          }
        }
        break;
      }

      case "knight": {
        const deltas = [
          [-2, -1],
          [-2, 1],
          [-1, -2],
          [-1, 2],
          [1, -2],
          [1, 2],
          [2, -1],
          [2, 1],
        ];
        for (const [dc, dr] of deltas) {
          if (dc !== undefined && dr !== undefined) {
            tryAdd(col + dc, row + dr);
          }
        }
        break;
      }

      case "bishop": {
        const dirs = [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ];
        for (const [dc, dr] of dirs) {
          if (dc !== undefined && dr !== undefined) {
            let step = 1;
            while (tryAdd(col + dc * step, row + dr * step)) {
              step++;
            }
          }
        }
        break;
      }

      case "rook": {
        const dirs = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        for (const [dc, dr] of dirs) {
          if (dc !== undefined && dr !== undefined) {
            let step = 1;
            while (tryAdd(col + dc * step, row + dr * step)) {
              step++;
            }
          }
        }
        break;
      }

      case "queen": {
        const dirs = [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        for (const [dc, dr] of dirs) {
          if (dc !== undefined && dr !== undefined) {
            let step = 1;
            while (tryAdd(col + dc * step, row + dr * step)) {
              step++;
            }
          }
        }
        break;
      }

      case "king": {
        // Normal 1-step moves
        for (let dc = -1; dc <= 1; dc++) {
          for (let dr = -1; dr <= 1; dr++) {
            if (dc !== 0 || dr !== 0) {
              tryAdd(col + dc, row + dr);
            }
          }
        }

        // Castling
        if (!piece.hasMoved) {
          const opponent: ChessColor = piece.color === "white" ? "black" : "white";
          const inCheck = this.isSquareAttacked(piece.square, board, opponent);

          if (!inCheck) {
            // Kingside castling (col 4 -> col 6, rook at col 7)
            const kRook = this.getPieceAt(board, coordToSquare(7, row)!);
            if (kRook && kRook.type === "rook" && !kRook.hasMoved) {
              const c5Sq = coordToSquare(5, row)!;
              const c6Sq = coordToSquare(6, row)!;
              if (
                !this.getPieceAt(board, c5Sq) &&
                !this.getPieceAt(board, c6Sq) &&
                !this.isSquareAttacked(c5Sq, board, opponent) &&
                !this.isSquareAttacked(c6Sq, board, opponent)
              ) {
                moves.push(c6Sq);
              }
            }

            // Queenside castling (col 4 -> col 2, rook at col 0)
            const qRook = this.getPieceAt(board, coordToSquare(0, row)!);
            if (qRook && qRook.type === "rook" && !qRook.hasMoved) {
              const c1Sq = coordToSquare(1, row)!;
              const c2Sq = coordToSquare(2, row)!;
              const c3Sq = coordToSquare(3, row)!;
              if (
                !this.getPieceAt(board, c1Sq) &&
                !this.getPieceAt(board, c2Sq) &&
                !this.getPieceAt(board, c3Sq) &&
                !this.isSquareAttacked(c2Sq, board, opponent) &&
                !this.isSquareAttacked(c3Sq, board, opponent)
              ) {
                moves.push(c2Sq);
              }
            }
          }
        }
        break;
      }
    }

    return moves;
  }

  /**
   * Simulates a move on a shallow copy of the board.
   */
  public static simulateMove(
    board: readonly ChessPiece[],
    from: ChessSquare,
    to: ChessSquare,
    enPassantTargetSquare?: ChessSquare | null,
  ): ChessPiece[] {
    const movedPiece = this.getPieceAt(board, from);
    if (!movedPiece) return [...board];

    const isEnPassant =
      movedPiece.type === "pawn" &&
      to === enPassantTargetSquare &&
      !this.getPieceAt(board, to);

    const capturedSquare = isEnPassant
      ? coordToSquare(squareToCoord(to).col, squareToCoord(from).row)!
      : to;

    // Exclude captured piece (at 'to' or en passant square) and the moved piece at 'from'
    const newBoard = board.filter(
      (p) => p.square !== capturedSquare && p.square !== from,
    );

    newBoard.push({
      ...movedPiece,
      hasMoved: true,
      square: to,
    });

    return newBoard;
  }

  /**
   * Returns all strictly legal moves for a piece, ensuring the king is not in check.
   */
  public static getLegalMoves(
    piece: ChessPiece,
    board: readonly ChessPiece[],
    enPassantTargetSquare?: ChessSquare | null,
  ): ChessSquare[] {
    const pseudoMoves = this.getPseudoLegalMoves(piece, board, enPassantTargetSquare);

    return pseudoMoves.filter((targetSq) => {
      // For castling, path safety is already verified in getPseudoLegalMoves
      const isCastling =
        piece.type === "king" &&
        Math.abs(squareToCoord(targetSq).col - squareToCoord(piece.square).col) === 2;

      if (isCastling) return true;

      const simBoard = this.simulateMove(
        board,
        piece.square,
        targetSq,
        enPassantTargetSquare,
      );
      return !this.isKingInCheck(simBoard, piece.color);
    });
  }

  /**
   * Collects all legal moves for all pieces belonging to a color.
   */
  public static getAllLegalMoves(
    board: readonly ChessPiece[],
    color: ChessColor,
    enPassantTargetSquare?: ChessSquare | null,
  ): Array<{ from: ChessSquare; piece: ChessPiece; to: ChessSquare }> {
    const allMoves: Array<{ from: ChessSquare; piece: ChessPiece; to: ChessSquare }> =
      [];

    for (const piece of board) {
      if (piece.color !== color) continue;
      const legalSquares = this.getLegalMoves(piece, board, enPassantTargetSquare);
      for (const to of legalSquares) {
        allMoves.push({ from: piece.square, piece, to });
      }
    }

    return allMoves;
  }

  /**
   * Executes a move on the given ChessPayload and returns an updated payload.
   */
  public static executeMove(
    payload: ChessPayload,
    from: ChessSquare,
    to: ChessSquare,
    promotedTo: "queen" | "rook" | "bishop" | "knight" = "queen",
  ): MoveExecutionResult {
    // 1. Check if game is already concluded
    if (
      payload.gameStatus === "checkmate" ||
      payload.gameStatus === "stalemate" ||
      payload.gameStatus === "draw"
    ) {
      return {
        error: `Game is already over (${payload.gameStatus})`,
        success: false,
        updatedPayload: payload,
      };
    }

    // 2. Validate piece presence & turn
    const piece = this.getPieceAt(payload.pieces, from);
    if (!piece) {
      return {
        error: `No piece found at ${from}`,
        success: false,
        updatedPayload: payload,
      };
    }

    if (piece.color !== payload.currentTurn) {
      return {
        error: `It is ${payload.currentTurn}'s turn, cannot move ${piece.color} piece`,
        success: false,
        updatedPayload: payload,
      };
    }

    // 3. Validate move legality
    const legalTargets = this.getLegalMoves(
      piece,
      payload.pieces,
      payload.enPassantTargetSquare,
    );
    if (!legalTargets.includes(to)) {
      return {
        error: `Illegal move: ${piece.type} cannot move from ${from} to ${to}`,
        success: false,
        updatedPayload: payload,
      };
    }

    const { col: fCol, row: fRow } = squareToCoord(from);
    const { col: tCol, row: tRow } = squareToCoord(to);

    // 4. Handle captures (including en passant)
    const isEnPassant =
      piece.type === "pawn" &&
      to === payload.enPassantTargetSquare &&
      !this.getPieceAt(payload.pieces, to);

    const capturedSquare = isEnPassant
      ? coordToSquare(tCol, fRow)!
      : to;

    const targetPiece = this.getPieceAt(payload.pieces, capturedSquare);
    const capturedWhite = [...payload.capturedWhite];
    const capturedBlack = [...payload.capturedBlack];

    if (targetPiece) {
      if (targetPiece.color === "white") {
        capturedWhite.push(targetPiece);
      } else {
        capturedBlack.push(targetPiece);
      }
    }

    // 5. Handle special move: Castling
    let isCastling: ("kingside" | "queenside") | undefined = undefined;

    let updatedPieces = payload.pieces.filter(
      (p) => p.square !== capturedSquare && p.square !== from,
    );

    if (piece.type === "king" && Math.abs(tCol - fCol) === 2) {
      if (tCol === 6) {
        // Kingside castling
        isCastling = "kingside";
        const oldRookSq = coordToSquare(7, fRow)!;
        const newRookSq = coordToSquare(5, fRow)!;
        const rook = this.getPieceAt(payload.pieces, oldRookSq);
        if (rook) {
          updatedPieces = updatedPieces.filter((p) => p.square !== oldRookSq);
          updatedPieces.push({ ...rook, hasMoved: true, square: newRookSq });
        }
      } else if (tCol === 2) {
        // Queenside castling
        isCastling = "queenside";
        const oldRookSq = coordToSquare(0, fRow)!;
        const newRookSq = coordToSquare(3, fRow)!;
        const rook = this.getPieceAt(payload.pieces, oldRookSq);
        if (rook) {
          updatedPieces = updatedPieces.filter((p) => p.square !== oldRookSq);
          updatedPieces.push({ ...rook, hasMoved: true, square: newRookSq });
        }
      }
    }

    // 6. Handle special move: Pawn Promotion
    let finalType: ChessPieceType = piece.type;
    let actualPromotedTo: ("queen" | "rook" | "bishop" | "knight") | undefined =
      undefined;

    if (piece.type === "pawn" && (tRow === 0 || tRow === 7)) {
      finalType = promotedTo;
      actualPromotedTo = promotedTo;
    }

    // 7. Add moved piece to updated board
    updatedPieces.push({
      ...piece,
      hasMoved: true,
      square: to,
      type: finalType,
    });

    // 8. Calculate next enPassantTargetSquare (valid only for the immediate next move)
    let nextEnPassantTarget: ChessSquare | null = null;
    if (piece.type === "pawn" && Math.abs(tRow - fRow) === 2) {
      const midRow = (fRow + tRow) / 2;
      nextEnPassantTarget = coordToSquare(fCol, midRow);
    }

    // 9. Opponent turn switch & check/checkmate evaluation
    const nextTurn: ChessColor = payload.currentTurn === "white" ? "black" : "white";
    const opponentInCheck = this.isKingInCheck(updatedPieces, nextTurn);
    const opponentLegalMoves = this.getAllLegalMoves(
      updatedPieces,
      nextTurn,
      nextEnPassantTarget,
    );

    let nextStatus: ChessPayload["gameStatus"] = "in-progress";
    let winner: ChessPayload["winner"] = undefined;

    if (opponentLegalMoves.length === 0) {
      if (opponentInCheck) {
        nextStatus = "checkmate";
        winner = payload.currentTurn;
      } else {
        nextStatus = "stalemate";
        winner = "draw";
      }
    } else if (opponentInCheck) {
      nextStatus = "check";
    }

    // 10. Standard Algebraic Notation (SAN) generation
    let san = "";
    if (isCastling === "kingside") {
      san = "O-O";
    } else if (isCastling === "queenside") {
      san = "O-O-O";
    } else {
      const pieceLetter =
        piece.type === "knight"
          ? "N"
          : piece.type.charAt(0).toUpperCase();

      const piecePrefix =
        piece.type === "pawn"
          ? targetPiece
            ? CHESS_FILES[fCol] ?? ""
            : ""
          : pieceLetter;

      const captureMark = targetPiece ? "x" : "";
      san = `${piecePrefix}${captureMark}${to}`;

      if (isEnPassant) {
        san += " e.p.";
      }

      if (actualPromotedTo) {
        const promoLetter =
          actualPromotedTo === "knight"
            ? "N"
            : actualPromotedTo.charAt(0).toUpperCase();
        san += `=${promoLetter}`;
      }
    }

    if (nextStatus === "checkmate") {
      san += "#";
    } else if (nextStatus === "check") {
      san += "+";
    }

    const recordedMove: ChessMove = {
      capturedPiece: targetPiece,
      from,
      isCastling,
      isCheck: opponentInCheck,
      isCheckmate: nextStatus === "checkmate",
      isEnPassant,
      piece,
      promotedTo: actualPromotedTo,
      san,
      to,
    };

    const updatedPayload: ChessPayload = {
      ...payload,
      capturedBlack,
      capturedWhite,
      currentTurn: nextTurn,
      enPassantTargetSquare: nextEnPassantTarget,
      gameStatus: nextStatus,
      legalMovesForSelected: undefined,
      moveHistory: [...payload.moveHistory, recordedMove],
      pieces: updatedPieces,
      selectedSquare: null,
      winner,
    };

    return {
      move: recordedMove,
      success: true,
      updatedPayload,
    };
  }
}
