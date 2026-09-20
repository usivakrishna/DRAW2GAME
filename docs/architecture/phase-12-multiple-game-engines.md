# DRAW2GAME — Phase 12: Multiple 2D Game Engines Architecture

## Overview

Phase 12 transforms DRAW2GAME from a single-engine architecture into a genuine **Multi-Engine 2D Game Architecture**.
Alongside the existing `PlatformerEngine`, **`ChessEngine`** is introduced as the first additional, fully playable game engine.

```
                         GameDefinition
                               │
                            GameType
                               │
                       GameEngineFactory
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
   PlatformerEngine       ChessEngine         Future Engines
     (Phaser 3 +       (ChessRules + DOM/   (Ludo, Pool, Carrom,
      Matter.js)         Canvas Renderer)     Racing, Puzzle...)
     [PLAYABLE]            [PLAYABLE]         [EXTENSION POINTS]
```

Both `PlatformerEngine` and `ChessEngine` implement the engine-independent `GameEngine<TDefinition>` lifecycle interface.
All remaining genres (`ludo`, `pool`, `carrom`, `racing`, `puzzle`, `shooter`, `sports`) remain explicit architecture extension points.

---

## 1. Chess Game Definition (`src/game/chess/chess-definition.ts`)

Conforms to the universal `GenericGameDefinition<"chess", ChessPayload>` standard established in Phase 10:

- **Pieces**: 32 standard FIDE pieces (16 White, 16 Black) across King, Queen, Rook, Bishop, Knight, and Pawn.
- **Coordinates**: Standard algebraic coordinates `a1` through `h8`.
- **Payload (`ChessPayload`)**:
  - `boardSize`: 8
  - `currentTurn`: `"white" | "black"`
  - `pieces`: Array of `ChessPiece` objects with positions and `hasMoved` state.
  - `gameStatus`: `"in-progress" | "check" | "checkmate" | "stalemate" | "draw"`
  - `capturedWhite` & `capturedBlack`: Captured piece registers.
  - `moveHistory`: Chronological move log with Standard Algebraic Notation (SAN), capture flags, check/checkmate flags.
  - `selectedSquare` & `legalMovesForSelected`: Active selection and calculated legal target destinations.

---

## 2. Complete Chess Rules Engine (`src/game/chess/chess-rules.ts`)

A pure TypeScript, zero-dependency, deterministic rule evaluation engine:

1. **Piece Movement**:
   - **Pawn**: 1-square forward, 2-squares forward from initial rank, diagonal forward captures, pawn promotion to Queen/Rook/Bishop/Knight upon reaching opposite back rank.
   - **Knight**: Standard "L"-shape jumps (2+1 or 1+2) with obstacle pass-through.
   - **Bishop**: Diagonal ray-tracing with path-clearance validation and endpoint capture.
   - **Rook**: Orthogonal ray-tracing with path-clearance validation and endpoint capture.
   - **Queen**: Omnidirectional ray-tracing (Bishop + Rook).
   - **King**: 1-step in any of 8 directions.
2. **Castling**:
   - Both Kingside (`O-O`) and Queenside (`O-O-O`) castling supported.
   - Validates that King and respective Rook have not moved, transit squares are empty, and transit squares are not under attack.
3. **King Safety & Check Detection**:
   - `isSquareAttacked(square, board, attackingColor)` validates attack vectors.
   - `isKingInCheck(board, color)` evaluates whether the friendly King is under direct threat.
   - Every candidate move is simulated before being declared legal: moves that expose or leave the friendly King in check are strictly filtered out.
3. **En Passant Pawn Capture**:
   - Complete en passant implementation with previous-move state tracking.
   - `enPassantTargetSquare` is recorded when any pawn executes an initial 2-square advance.
   - Any enemy pawn positioned on the adjacent file of the reached rank may capture diagonally to the target square on the immediately following half-move.
   - The captured pawn is accurately removed from its actual rank, and `isEnPassant` flag is recorded in `ChessMove`.
   - The en passant opportunity strictly expires if not seized immediately on the next turn.
   - King safety check applies: capturing en passant is prevented if it would open a discovered rank/diagonal check on the friendly King.
4. **Game Termination**:
   - **Checkmate**: King is in check and no legal moves exist.
   - **Stalemate**: King is not in check and no legal moves exist (draw).

---

## 3. Chess Engine (`src/game/chess/chess-engine.ts`)

Implements the standard `GameEngine<ChessGameDefinition>` contract:
- `initialize(options: GameEngineInitOptions)`
- `load(definition: ChessGameDefinition)`
- `start()`, `pause()`, `resume()`, `restart()`, `destroy()`
- Exposes `selectSquare`, `makeMove`, `flipBoard`, and `onStateChange` subscription for UI reactivity.

---

## 4. Game Engine Factory Integration (`src/game/core/game-engine-factory.ts`)

`GameEngineFactory.createEngine(gameType)`:
- `"platformer"`: Instantiates `PlatformerEngine` (Playable).
- `"chess"`: Instantiates `ChessEngine` (Playable).
- Extension types (`"ludo"`, `"pool"`, `"carrom"`, etc.): Returns `{ success: false, isExtensionPoint: true }`.
- Unknown types: Returns `{ success: false, isExtensionPoint: false }`.

---

## 5. UI & Persistence Integration

1. **Detection Panel (`GameRecognitionPanel.tsx`)**:
   - Both `platformer` and `chess` display as **Playable** with green checkmarks.
   - Manual override dropdown groups `platformer` and `chess` under **Playable Game Types**.
   - One-click "Play Chess Now" button directly routes to `/projects/:projectId/play`.
2. **Game Page (`GamePage.tsx`)**:
   - Automatically detects whether the active project is a Platformer or Chess game.
   - For Chess: renders `ChessGameStage` featuring responsive 8×8 board, file/rank labels, vector piece icons, turn indicator, captured pieces count, and SAN move history.
   - For Platformer: renders existing Phaser 3 + Matter.js stage with HUD, overlays, and AI Editor.
3. **Project Isolation (`src/store/project-store.ts`)**:
   - `projectChessGames` persisted in localStorage key `"draw2game-projects"`.
   - Project A's chess moves and board state are strictly isolated from Project B.

---

## 6. Explicit Limitations & Scope Boundaries (Phase 12)

The following advanced chess features are explicitly NOT implemented in Phase 12 and remain documented limitations:

1. **Threefold Repetition**: Automatic draw declaration after three identical board positions is not implemented.
2. **50-Move Rule**: Draw claim after 50 consecutive moves without a pawn move or capture is not implemented.
3. **Insufficient Material**: Automatic draw detection for King vs King, King+Bishop vs King, or King+Knight vs King is not implemented.
4. **Chess AI Opponent / Stockfish**: No external chess engine or AI search algorithm is included. Local 2-player human-vs-human play is supported.
5. **AI Editor for Chess**: Natural language editing commands for chess are not implemented in Phase 12. A clear informational badge is displayed in the UI indicating that chess editing commands will be added in a future phase.
6. **Universal Sketch-to-Chess Generation**: Universal computer vision sketch-to-chess board layout generation is deferred to future universal phases; Phase 12 focuses exclusively on establishing the multi-engine runtime architecture with ChessEngine as the second fully playable engine.
