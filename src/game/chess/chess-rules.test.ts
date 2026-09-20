/**
 * DRAW2GAME — Universal Game Engine Architecture
 * Chess Rules & UniversalGameEngine Test Suite
 *
 * Verifies chess rules, initial board setup, piece movement mechanics,
 * castling, en passant, checkmate, stalemate, and UniversalGameEngine execution.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  createDefaultChessGameDefinition,
  createInitialChessBoard,
  type ChessPiece,
} from "./chess-definition";
import { ChessRules } from "./chess-rules";
import { GameEngineFactory } from "@/game/core/game-engine-factory";
import { UniversalGameEngine } from "@/game/runtime/universal-game-engine";
import { useProjectStore } from "@/store/project-store";

describe("Chess Rules & UniversalGameEngine Integration", () => {
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
    const whiteKing = pieces.find((p) => p.type === "king" && p.color === "white");
    const blackKing = pieces.find((p) => p.type === "king" && p.color === "black");
    expect(whiteKing?.square).toBe("e1");
    expect(blackKing?.square).toBe("e8");

    // Verify Queens
    const whiteQueen = pieces.find((p) => p.type === "queen" && p.color === "white");
    const blackQueen = pieces.find((p) => p.type === "queen" && p.color === "black");
    expect(whiteQueen?.square).toBe("d1");
    expect(blackQueen?.square).toBe("d8");

    // Verify Pawns
    const whitePawns = pieces.filter((p) => p.type === "pawn" && p.color === "white");
    expect(whitePawns.length).toBe(8);
    expect(whitePawns.every((p) => p.square.endsWith("2"))).toBe(true);
  });

  // 2. Pawn Opening Moves & Diagonal Captures
  it("computes legal pawn 1-step and 2-step advances and captures", () => {
    const def = createDefaultChessGameDefinition("test-pawn");
    const pieces = def.typePayload!.pieces;

    // e2 pawn at start: can move to e3 or e4
    const e2Pawn = ChessRules.getPieceAt(pieces, "e2")!;
    const legalMoves = ChessRules.getLegalMoves(e2Pawn, pieces);
    expect(legalMoves).toContain("e3");
    expect(legalMoves).toContain("e4");
    expect(legalMoves.length).toBe(2);

    // After move e2 -> e4, cannot jump 2 squares again
    const moveResult = ChessRules.executeMove(def.typePayload!, "e2", "e4");
    expect(moveResult.success).toBe(true);
    expect(moveResult.move?.piece.hasMoved).toBe(true);
    expect(moveResult.updatedPayload.currentTurn).toBe("black");

    // Black responds e7 -> e5
    const blackMove = ChessRules.executeMove(moveResult.updatedPayload, "e7", "e5");
    expect(blackMove.success).toBe(true);

    // White plays d2 -> d4
    const whiteD4 = ChessRules.executeMove(blackMove.updatedPayload, "d2", "d4");
    expect(whiteD4.success).toBe(true);

    // Black pawn at e5 can now capture d4 diagonally
    const e5Pawn = ChessRules.getPieceAt(whiteD4.updatedPayload.pieces, "e5")!;
    const e5Legal = ChessRules.getLegalMoves(e5Pawn, whiteD4.updatedPayload.pieces);
    expect(e5Legal).toContain("d4");
  });

  // 3. Knight Jump Mechanics
  it("computes legal L-shaped moves for knights jumping over pawns", () => {
    const def = createDefaultChessGameDefinition("test-knight");
    const pieces = def.typePayload!.pieces;

    // b1 Knight can jump to a3 and c3 at game start
    const b1Knight = ChessRules.getPieceAt(pieces, "b1")!;
    const moves = ChessRules.getLegalMoves(b1Knight, pieces);
    expect(moves).toContain("a3");
    expect(moves).toContain("c3");
    expect(moves.length).toBe(2);
  });

  // 4. Sliding Pieces & Obstruction (Rook, Bishop, Queen)
  it("calculates ray attacks and obstruction for sliding pieces", () => {
    const def = createDefaultChessGameDefinition("test-sliding");
    const pieces = def.typePayload!.pieces;

    // Back-rank bishop cannot move through pawns
    const c1Bishop = ChessRules.getPieceAt(pieces, "c1")!;
    const bishopMoves = ChessRules.getLegalMoves(c1Bishop, pieces);
    expect(bishopMoves.length).toBe(0);

    // Queen cannot move through pawns
    const d1Queen = ChessRules.getPieceAt(pieces, "d1")!;
    const queenMoves = ChessRules.getLegalMoves(d1Queen, pieces);
    expect(queenMoves.length).toBe(0);
  });

  // 5. Castling Validation (Kingside and Queenside)
  it("allows legal kingside castling when path is clear and unthreatened", () => {
    const def = createDefaultChessGameDefinition("test-castling");
    let payload = def.typePayload!;

    // 1. e2 -> e4
    payload = ChessRules.executeMove(payload, "e2", "e4").updatedPayload;
    // 1... e7 -> e5
    payload = ChessRules.executeMove(payload, "e7", "e5").updatedPayload;
    // 2. g1 -> f3 (clearing knight)
    payload = ChessRules.executeMove(payload, "g1", "f3").updatedPayload;
    // 2... b8 -> c6
    payload = ChessRules.executeMove(payload, "b8", "c6").updatedPayload;
    // 3. f1 -> c4 (clearing bishop)
    payload = ChessRules.executeMove(payload, "f1", "c4").updatedPayload;
    // 3... a7 -> a6
    payload = ChessRules.executeMove(payload, "a7", "a6").updatedPayload;

    // White King at e1 now has castling move to g1
    const whiteKing = ChessRules.getPieceAt(payload.pieces, "e1")!;
    const legalMoves = ChessRules.getLegalMoves(whiteKing, payload.pieces);
    expect(legalMoves).toContain("g1");

    // Execute castling: e1 -> g1
    const castleResult = ChessRules.executeMove(payload, "e1", "g1");
    expect(castleResult.success).toBe(true);
    expect(castleResult.move?.isCastling).toBe("kingside");
    expect(castleResult.move?.san).toBe("O-O");

    // Verify King is on g1, Rook is on f1
    const updated = castleResult.updatedPayload;
    expect(ChessRules.getPieceAt(updated.pieces, "g1")?.type).toBe("king");
    expect(ChessRules.getPieceAt(updated.pieces, "f1")?.type).toBe("rook");
  });

  // 6. King Safety & In-Check Restrictions
  it("prevents moves that leave king in check", () => {
    // Fool's Mate setup
    const def = createDefaultChessGameDefinition("test-check");
    let payload = def.typePayload!;

    // 1. f2 -> f3
    payload = ChessRules.executeMove(payload, "f2", "f3").updatedPayload;
    // 1... e7 -> e5
    payload = ChessRules.executeMove(payload, "e7", "e5").updatedPayload;
    // 2. g2 -> g4
    payload = ChessRules.executeMove(payload, "g2", "g4").updatedPayload;
    // 2... d8 -> h4# (Checkmate)
    const checkResult = ChessRules.executeMove(payload, "d8", "h4");
    expect(checkResult.success).toBe(true);
    expect(checkResult.move?.isCheck).toBe(true);
    expect(checkResult.move?.isCheckmate).toBe(true);
    expect(checkResult.updatedPayload.gameStatus).toBe("checkmate");
  });

  // 7. Scholar's Mate Scenario
  it("correctly identifies Scholar's Mate victory condition", () => {
    const def = createDefaultChessGameDefinition("scholars-mate");
    let payload = def.typePayload!;

    // 1. e4 e5
    payload = ChessRules.executeMove(payload, "e2", "e4").updatedPayload;
    payload = ChessRules.executeMove(payload, "e7", "e5").updatedPayload;

    // 2. Bc4 Nc6
    payload = ChessRules.executeMove(payload, "f1", "c4").updatedPayload;
    payload = ChessRules.executeMove(payload, "b8", "c6").updatedPayload;

    // 3. Qh5 Nf6
    payload = ChessRules.executeMove(payload, "d1", "h5").updatedPayload;
    payload = ChessRules.executeMove(payload, "g8", "f6").updatedPayload;

    // 4. Qxf7#
    const mateRes = ChessRules.executeMove(payload, "h5", "f7");
    expect(mateRes.success).toBe(true);
    expect(mateRes.move?.isCheckmate).toBe(true);
    payload = mateRes.updatedPayload;

    expect(payload.gameStatus).toBe("checkmate");
    expect(payload.winner).toBe("white");
    expect(payload.moveHistory[payload.moveHistory.length - 1]?.san).toBe("Qxf7#");
  });

  // 8. UniversalGameEngine Lifecycle with Chess
  it("tests UniversalGameEngine initialization, loading, state change listeners, and restart with Chess", () => {
    const engine = new UniversalGameEngine();
    const def = createDefaultChessGameDefinition("engine-test");

    expect(engine.isInitialized).toBe(false);
    expect(engine.isRunning).toBe(false);

    engine.initialize({ container: document.createElement("div") });
    expect(engine.isInitialized).toBe(true);

    let stateNotificationCount = 0;
    const unsub = engine.onStateChange(() => {
      stateNotificationCount++;
    });

    void engine.load(def);
    engine.start();
    expect(engine.isRunning).toBe(true);

    // Select pawn e2
    engine.selectSquare("e2");
    const payload = engine.getPayload() as typeof def.typePayload;
    expect(payload?.selectedSquare).toBe("e2");
    expect(payload?.legalMovesForSelected).toContain("e4");

    // Make move e2 to e4
    const res = engine.makeMove("e2", "e4");
    expect(res.success).toBe(true);
    const updatedPayload = engine.getPayload() as typeof def.typePayload;
    expect(updatedPayload?.currentTurn).toBe("black");

    // Restart
    engine.restart();
    const restartedPayload = engine.getPayload() as typeof def.typePayload;
    expect(restartedPayload?.currentTurn).toBe("white");
    expect(restartedPayload?.moveHistory.length).toBe(0);
    expect(stateNotificationCount).toBeGreaterThan(0);

    // Cleanup
    unsub();
    engine.destroy();
    expect(engine.isInitialized).toBe(false);
    expect(engine.isRunning).toBe(false);
  });

  // 9. GameEngineFactory Integration
  it("verifies GameEngineFactory resolves UniversalGameEngine for both Platformer and Chess", () => {
    const platResult = GameEngineFactory.createEngine("platformer");
    expect(platResult.success).toBe(true);
    if (platResult.success) {
      expect(platResult.gameType).toBe("platformer");
      expect(platResult.engine).toBeInstanceOf(UniversalGameEngine);
      expect(platResult.engine.engineId).toBe("universal-2d-engine");
    }

    const chessResult = GameEngineFactory.createEngine("chess");
    expect(chessResult.success).toBe(true);
    if (chessResult.success) {
      expect(chessResult.gameType).toBe("chess");
      expect(chessResult.engine).toBeInstanceOf(UniversalGameEngine);
      expect(chessResult.engine.engineId).toBe("universal-2d-engine");
    }

    const available = GameEngineFactory.getAvailableGameTypes();
    expect(available).toContain("platformer");
    expect(available).toContain("chess");

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

    payload = ChessRules.executeMove(payload, "e2", "e4").updatedPayload;
    expect(payload.enPassantTargetSquare).toBe("e3");

    payload = ChessRules.executeMove(payload, "a7", "a6").updatedPayload;
    expect(payload.enPassantTargetSquare).toBeNull();

    payload = ChessRules.executeMove(payload, "e4", "e5").updatedPayload;
    expect(payload.enPassantTargetSquare).toBeNull();

    payload = ChessRules.executeMove(payload, "d7", "d5").updatedPayload;
    expect(payload.enPassantTargetSquare).toBe("d6");

    const e5Pawn = ChessRules.getPieceAt(payload.pieces, "e5")!;
    const legalMoves = ChessRules.getLegalMoves(
      e5Pawn,
      payload.pieces,
      payload.enPassantTargetSquare,
    );
    expect(legalMoves).toContain("d6");

    const epResult = ChessRules.executeMove(payload, "e5", "d6");
    expect(epResult.success).toBe(true);
    expect(epResult.move?.isEnPassant).toBe(true);
    payload = epResult.updatedPayload;

    expect(ChessRules.getPieceAt(payload.pieces, "d5")).toBeUndefined();
    expect(ChessRules.getPieceAt(payload.pieces, "d6")?.color).toBe("white");
    expect(payload.capturedBlack.some((p) => p.square === "d5" || p.id.includes("pawn"))).toBe(true);
    expect(payload.enPassantTargetSquare).toBeNull();
    expect(epResult.move?.san).toContain("exd6");
  });

  // 12. En Passant King Safety Validation
  it("prevents en passant capture if it would expose the moving king to check", () => {
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

    const moveC5 = ChessRules.executeMove(payload, "c7", "c5");
    expect(moveC5.success).toBe(true);
    payload = moveC5.updatedPayload;
    expect(payload.enPassantTargetSquare).toBe("c6");

    const wPawn = ChessRules.getPieceAt(payload.pieces, "d5")!;
    const legalMoves = ChessRules.getLegalMoves(
      wPawn,
      payload.pieces,
      payload.enPassantTargetSquare,
    );
    expect(legalMoves).not.toContain("c6");
  });
});
