/**
 * DRAW2GAME — Phase 12: Multiple 2D Game Engines
 * Chess Rules & ChessEngine Test Suite
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  createDefaultChessGameDefinition,
  createInitialChessBoard,
  type ChessPiece,
} from "./chess-definition";
import { ChessEngine } from "./chess-engine";
import { ChessRules } from "./chess-rules";
import { GameEngineFactory } from "@/game/core/game-engine-factory";
import { useProjectStore } from "@/store/project-store";

describe("Phase 12: ChessEngine & Chess Rules", () => {
  beforeEach(() => {
    useProjectStore.setState({
      activeProjectId: null,
      projectChessGames: {},
      projectDetections: {},
      projectLevels: {},
      projectRecognitions: {},
      projects: [],
      projectUploads: {},
    });
  });

  // 1. Initial Board Setup & Piece Count
  it("initializes a standard 32-piece chess board with correct placements", () => {
    const pieces = createInitialChessBoard();
    expect(pieces.length).toBe(32);

    const whitePieces = pieces.filter((p) => p.color === "white");
    const blackPieces = pieces.filter((p) => p.color === "black");
    expect(whitePieces.length).toBe(16);
    expect(blackPieces.length).toBe(16);

    // Verify Kings
    const whiteKing = ChessRules.findKing(pieces, "white");
    const blackKing = ChessRules.findKing(pieces, "black");
    expect(whiteKing?.square).toBe("e1");
    expect(blackKing?.square).toBe("e8");

    // Verify Rooks on corners
    expect(ChessRules.getPieceAt(pieces, "a1")?.type).toBe("rook");
    expect(ChessRules.getPieceAt(pieces, "h1")?.type).toBe("rook");
    expect(ChessRules.getPieceAt(pieces, "a8")?.type).toBe("rook");
    expect(ChessRules.getPieceAt(pieces, "h8")?.type).toBe("rook");
  });

  // 2. Pawn Movement & Captures
  it("validates pawn 1-step, 2-step, and diagonal capture logic", () => {
    const def = createDefaultChessGameDefinition("test-chess");
    let payload = def.typePayload!;

    // Pawn at e2 can move to e3 or e4
    const e2Pawn = ChessRules.getPieceAt(payload.pieces, "e2")!;
    const legalMoves = ChessRules.getLegalMoves(e2Pawn, payload.pieces);
    expect(legalMoves).toContain("e3");
    expect(legalMoves).toContain("e4");
    expect(legalMoves).not.toContain("e5");

    // Move e2 to e4
    const moveRes = ChessRules.executeMove(payload, "e2", "e4");
    expect(moveRes.success).toBe(true);
    payload = moveRes.updatedPayload;
    expect(payload.currentTurn).toBe("black");
    expect(payload.moveHistory.length).toBe(1);
    expect(payload.moveHistory[0]?.san).toBe("e4");

    // Black responds with d7 to d5
    const blackMove = ChessRules.executeMove(payload, "d7", "d5");
    expect(blackMove.success).toBe(true);
    payload = blackMove.updatedPayload;

    // White pawn at e4 can now capture d5 diagonally
    const e4Pawn = ChessRules.getPieceAt(payload.pieces, "e4")!;
    const captureMoves = ChessRules.getLegalMoves(e4Pawn, payload.pieces);
    expect(captureMoves).toContain("d5");

    // Execute capture exd5
    const captureRes = ChessRules.executeMove(payload, "e4", "d5");
    expect(captureRes.success).toBe(true);
    payload = captureRes.updatedPayload;
    expect(payload.capturedBlack.length).toBe(1);
    expect(payload.capturedBlack[0]?.type).toBe("pawn");
    expect(payload.moveHistory[2]?.san).toBe("exd5");
  });

  // 3. Knight Movement (L-shapes & jumping over pieces)
  it("allows knights to jump over pieces in L-shapes", () => {
    const def = createDefaultChessGameDefinition("test-chess");
    const payload = def.typePayload!;

    // Knight at b1 can jump to a3 or c3 over pawns
    const b1Knight = ChessRules.getPieceAt(payload.pieces, "b1")!;
    const moves = ChessRules.getLegalMoves(b1Knight, payload.pieces);
    expect(moves).toContain("a3");
    expect(moves).toContain("c3");
    expect(moves).not.toContain("b3");

    const moveRes = ChessRules.executeMove(payload, "b1", "c3");
    expect(moveRes.success).toBe(true);
    expect(moveRes.updatedPayload.moveHistory[0]?.san).toBe("Nc3");
  });

  // 4. Bishop, Rook & Queen Ray-Tracing with Obstacle Blocking
  it("validates ray movement and obstacle blocking for bishops, rooks, and queens", () => {
    const def = createDefaultChessGameDefinition("test-chess");
    let payload = def.typePayload!;

    // Initially, Bishop at c1 is blocked by pawns at b2 and d2
    const c1Bishop = ChessRules.getPieceAt(payload.pieces, "c1")!;
    expect(ChessRules.getLegalMoves(c1Bishop, payload.pieces).length).toBe(0);

    // Move d2 to d4 to open the diagonal
    payload = ChessRules.executeMove(payload, "d2", "d4").updatedPayload;
    payload = ChessRules.executeMove(payload, "e7", "e5").updatedPayload; // Black move

    // Bishop at c1 can now move along the open diagonal
    const unblockedBishop = ChessRules.getPieceAt(payload.pieces, "c1")!;
    const bishopMoves = ChessRules.getLegalMoves(unblockedBishop, payload.pieces);
    expect(bishopMoves).toContain("e3");
    expect(bishopMoves).toContain("f4");
    expect(bishopMoves).toContain("g5");
    expect(bishopMoves).toContain("h6");
  });

  // 5. King Movement & Castling
  it("validates king single-step movement and kingside castling", () => {
    // Custom board setup to test castling
    const pieces: ChessPiece[] = [
      { color: "white", hasMoved: false, id: "w-king", square: "e1", type: "king" },
      { color: "white", hasMoved: false, id: "w-rook-h", square: "h1", type: "rook" },
      { color: "black", hasMoved: false, id: "b-king", square: "e8", type: "king" },
    ];

    const legalKingMoves = ChessRules.getLegalMoves(pieces[0]!, pieces);
    expect(legalKingMoves).toContain("g1"); // Kingside castling target

    const payload = {
      boardSize: 8,
      capturedBlack: [],
      capturedWhite: [],
      currentTurn: "white" as const,
      gameStatus: "in-progress" as const,
      moveHistory: [],
      orientation: "white" as const,
      pieces,
    };

    const castleRes = ChessRules.executeMove(payload, "e1", "g1");
    expect(castleRes.success).toBe(true);
    expect(castleRes.updatedPayload.moveHistory[0]?.san).toBe("O-O");

    // Verify King is at g1 and Rook has moved to f1
    const updatedPieces = castleRes.updatedPayload.pieces;
    expect(ChessRules.getPieceAt(updatedPieces, "g1")?.type).toBe("king");
    expect(ChessRules.getPieceAt(updatedPieces, "f1")?.type).toBe("rook");
  });

  // 6. Check Detection & Illegal King Exposure
  it("detects check and prevents moves that expose the friendly king", () => {
    const pieces: ChessPiece[] = [
      { color: "white", hasMoved: true, id: "w-k", square: "e1", type: "king" },
      { color: "white", hasMoved: true, id: "w-r", square: "e2", type: "rook" }, // Pinned rook
      { color: "black", hasMoved: true, id: "b-r", square: "e8", type: "rook" }, // Attacking rook
      { color: "black", hasMoved: true, id: "b-k", square: "a8", type: "king" },
    ];

    // The white rook at e2 is pinned to the king at e1 by the black rook at e8
    const pinnedRook = ChessRules.getPieceAt(pieces, "e2")!;
    const legalRookMoves = ChessRules.getLegalMoves(pinnedRook, pieces);

    // Moving e2 to a2, b2, c2, d2, f2 would expose the king to check from e8, so illegal!
    expect(legalRookMoves).not.toContain("a2");
    expect(legalRookMoves).not.toContain("d2");
    // But it CAN move along the pin line: e3, e4, e5, e6, e7, e8
    expect(legalRookMoves).toContain("e3");
    expect(legalRookMoves).toContain("e8"); // Can capture pinning piece
  });

  // 7. Checkmate Detection (Scholar's Mate)
  it("detects checkmate accurately using the 4-move Scholar's Mate fixture", () => {
    const def = createDefaultChessGameDefinition("scholars-mate");
    let payload = def.typePayload!;

    // 1. e4 e5
    payload = ChessRules.executeMove(payload, "e2", "e4").updatedPayload;
    payload = ChessRules.executeMove(payload, "e7", "e5").updatedPayload;

    // 2. Bc4 Nc6
    payload = ChessRules.executeMove(payload, "f1", "c4").updatedPayload;
    payload = ChessRules.executeMove(payload, "b8", "c6").updatedPayload;

    // 3. Qh5 Nf6??
    payload = ChessRules.executeMove(payload, "d1", "h5").updatedPayload;
    payload = ChessRules.executeMove(payload, "g8", "f6").updatedPayload;

    // 4. Qxf7# Checkmate!
    const mateRes = ChessRules.executeMove(payload, "h5", "f7");
    expect(mateRes.success).toBe(true);
    payload = mateRes.updatedPayload;

    expect(payload.gameStatus).toBe("checkmate");
    expect(payload.winner).toBe("white");
    expect(payload.moveHistory[payload.moveHistory.length - 1]?.san).toBe("Qxf7#");
  });

  // 8. ChessEngine Lifecycle
  it("tests ChessEngine initialization, loading, state change listeners, and restart", () => {
    const engine = new ChessEngine();
    const def = createDefaultChessGameDefinition("engine-test");

    expect(engine.isInitialized).toBe(false);
    expect(engine.isRunning).toBe(false);

    engine.initialize({ container: document.createElement("div") });
    expect(engine.isInitialized).toBe(true);

    let stateNotificationCount = 0;
    const unsub = engine.onStateChange(() => {
      stateNotificationCount++;
    });

    engine.load(def);
    engine.start();
    expect(engine.isRunning).toBe(true);

    // Select pawn e2
    engine.selectSquare("e2");
    expect(engine.getPayload()?.selectedSquare).toBe("e2");
    expect(engine.getPayload()?.legalMovesForSelected).toContain("e4");

    // Make move e2 to e4
    const res = engine.makeMove("e2", "e4");
    expect(res.success).toBe(true);
    expect(engine.getPayload()?.currentTurn).toBe("black");

    // Restart
    engine.restart();
    expect(engine.getPayload()?.currentTurn).toBe("white");
    expect(engine.getPayload()?.moveHistory.length).toBe(0);
    // Notifications were fired
    expect(stateNotificationCount).toBeGreaterThan(0);

    // Cleanup
    unsub();
    engine.destroy();
    expect(engine.isInitialized).toBe(false);
    expect(engine.isRunning).toBe(false);
  });

  // 9. GameEngineFactory Integration
  it("verifies GameEngineFactory resolves both PlatformerEngine and ChessEngine", () => {
    // Platformer
    const platResult = GameEngineFactory.createEngine("platformer");
    expect(platResult.success).toBe(true);
    if (platResult.success) {
      expect(platResult.gameType).toBe("platformer");
    }

    // Chess (Phase 12)
    const chessResult = GameEngineFactory.createEngine("chess");
    expect(chessResult.success).toBe(true);
    if (chessResult.success) {
      expect(chessResult.gameType).toBe("chess");
      expect(chessResult.engine instanceof ChessEngine).toBe(true);
    }

    // Available engines list
    const available = GameEngineFactory.getAvailableGameTypes();
    expect(available).toContain("platformer");
    expect(available).toContain("chess");

    // Extension points remain unsupported
    const ludoResult = GameEngineFactory.createEngine("ludo");
    expect(ludoResult.success).toBe(false);
    if (!ludoResult.success) {
      expect(ludoResult.isExtensionPoint).toBe(true);
    }
  });

  // 10. Project Store Isolation
  it("ensures Project A chess state is completely isolated from Project B", () => {
    const store = useProjectStore.getState();

    const projA = store.createProject("Project A");
    const projB = store.createProject("Project B");

    const chessA = createDefaultChessGameDefinition(projA.id);
    const chessB = createDefaultChessGameDefinition(projB.id);

    // Make a move in Project A: e2 to e4
    const movedA = ChessRules.executeMove(chessA.typePayload!, "e2", "e4").updatedPayload;
    chessA.typePayload = movedA;

    store.setProjectChessGame(projA.id, chessA);
    store.setProjectChessGame(projB.id, chessB);

    const state = useProjectStore.getState();
    expect(state.projectChessGames[projA.id]?.typePayload?.currentTurn).toBe("black");
    expect(state.projectChessGames[projB.id]?.typePayload?.currentTurn).toBe("white");
    expect(state.projectChessGames[projA.id]?.typePayload?.moveHistory.length).toBe(1);
    expect(state.projectChessGames[projB.id]?.typePayload?.moveHistory.length).toBe(0);
  });

  // 11. En Passant Pawn Capture & State Tracking
  it("validates en passant target tracking, pawn capture, and immediate expiration", () => {
    const def = createDefaultChessGameDefinition("en-passant-test");
    let payload = def.typePayload!;

    // 1. e2 -> e4
    payload = ChessRules.executeMove(payload, "e2", "e4").updatedPayload;
    expect(payload.enPassantTargetSquare).toBe("e3");

    // 1... a7 -> a6 (Black non-adjacent move)
    payload = ChessRules.executeMove(payload, "a7", "a6").updatedPayload;
    expect(payload.enPassantTargetSquare).toBeNull(); // e3 target expired

    // 2. e4 -> e5 (White pawn reaches 5th rank)
    payload = ChessRules.executeMove(payload, "e4", "e5").updatedPayload;
    expect(payload.enPassantTargetSquare).toBeNull();

    // 2... d7 -> d5 (Black 2-step advance adjacent to White e5 pawn)
    payload = ChessRules.executeMove(payload, "d7", "d5").updatedPayload;
    expect(payload.enPassantTargetSquare).toBe("d6");

    // White pawn at e5 should have d6 as a legal capture move
    const e5Pawn = ChessRules.getPieceAt(payload.pieces, "e5")!;
    const legalMoves = ChessRules.getLegalMoves(
      e5Pawn,
      payload.pieces,
      payload.enPassantTargetSquare,
    );
    expect(legalMoves).toContain("d6");

    // Execute en passant capture: e5 -> d6
    const epResult = ChessRules.executeMove(payload, "e5", "d6");
    expect(epResult.success).toBe(true);
    expect(epResult.move?.isEnPassant).toBe(true);
    payload = epResult.updatedPayload;

    // The captured black pawn at d5 must be removed from the board
    expect(ChessRules.getPieceAt(payload.pieces, "d5")).toBeUndefined();
    // The capturing white pawn is now at d6
    expect(ChessRules.getPieceAt(payload.pieces, "d6")?.color).toBe("white");
    // Black captured list should contain the captured pawn
    expect(payload.capturedBlack.some((p) => p.square === "d5" || p.id.includes("pawn"))).toBe(true);
    // En passant target is now cleared
    expect(payload.enPassantTargetSquare).toBeNull();
    // Move notation should include 'e.p.'
    expect(epResult.move?.san).toContain("exd6");
  });

  // 12. En Passant King Safety Validation
  it("prevents en passant capture if it would expose the moving king to check", () => {
    // Custom board setup:
    // White King at e1, Black Rook at a5, Black Pawn at d5, White Pawn at e5
    // If White plays exd6 e.p., both pawns on rank 5 are removed from the rank,
    // which would expose White King if the King were along the rank!
    // Setup King at e5? No, King at h5, Black Rook at a5, Black Pawn at c5, White Pawn at d5
    // White King on h5, Black Rook on a5. Black plays c7->c5.
    // If White captures dxc6 e.p., rank 5 opens completely from a5 to h5!
    const customPieces: ChessPiece[] = [
      { color: "white", hasMoved: true, id: "w-king", square: "h5", type: "king" },
      { color: "black", hasMoved: true, id: "b-rook", square: "a5", type: "rook" },
      { color: "black", hasMoved: false, id: "b-pawn", square: "c7", type: "pawn" },
      { color: "white", hasMoved: true, id: "w-pawn", square: "d5", type: "pawn" },
      { color: "black", hasMoved: true, id: "b-king", square: "h8", type: "king" },
    ];

    const def = createDefaultChessGameDefinition("ep-pin-test");
    let payload = def.typePayload!;
    payload = {
      ...payload,
      currentTurn: "black",
      enPassantTargetSquare: null,
      pieces: customPieces,
    };

    // Black plays c7 -> c5 (2-square advance)
    const moveC5 = ChessRules.executeMove(payload, "c7", "c5");
    expect(moveC5.success).toBe(true);
    payload = moveC5.updatedPayload;
    expect(payload.enPassantTargetSquare).toBe("c6");

    // White pawn at d5 would expose the King at h5 to Rook at a5 if it captures dxc6!
    const wPawn = ChessRules.getPieceAt(payload.pieces, "d5")!;
    const legalMoves = ChessRules.getLegalMoves(
      wPawn,
      payload.pieces,
      payload.enPassantTargetSquare,
    );
    expect(legalMoves).not.toContain("c6"); // Must NOT be allowed due to king exposure!
  });
});
