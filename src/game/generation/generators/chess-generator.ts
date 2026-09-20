/**
 * DRAW2GAME — Phase 13: Universal Game Generation Architecture
 * Chess GameDefinition Generator
 *
 * Implements the GameDefinitionGenerator contract for Chess.
 * Accepts structured chess understanding (board dimensions, pieces, turn)
 * or creates a standard 32-piece initial board. Validates all outputs
 * through ChessValidator and GenericGameValidator.
 */

import {
  type ChessColor,
  type ChessGameDefinition,
  type ChessPayload,
  type ChessPiece,
  type ChessPieceType,
  type ChessSquare,
  createDefaultChessPayload,
  createInitialChessBoard,
  DEFAULT_CHESS_RULES,
  squareToCoord,
} from "@/game/chess/chess-definition";
import type {
  EngineConfig,
  GameAsset,
  GameMetadata,
  GameObject,
  GameSettings,
  GameViewport,
} from "@/game/core/game-definition";
import type { GameDefinitionGenerator } from "../generator-interface";
import type {
  GameGenerationError,
  GameGenerationInput,
  GameGenerationResult,
  GameGenerationWarning,
  GameUnderstanding,
} from "../types";
import { ChessValidator } from "../validators/chess-validator";
import { GenericGameValidator } from "../validators/generic-validator";

export class ChessGameGenerator
  implements GameDefinitionGenerator<ChessGameDefinition>
{
  public readonly gameType = "chess" as const;
  public readonly generatorId = "chess-standard-generator";

  public canHandle(gameType: string): boolean {
    return gameType === "chess";
  }

  public generate(
    input: GameGenerationInput,
    understanding: GameUnderstanding,
  ): GameGenerationResult<ChessGameDefinition> {
    const startTime = Date.now();
    const warnings: GameGenerationWarning[] = [];
    const errors: GameGenerationError[] = [];

    // 1. Resolve ChessPayload pieces and configuration
    let pieces: ChessPiece[] = [];
    let currentTurn: ChessColor = "white";
    let orientation: ChessColor = "white";

    const genreData =
      input.genreSpecificData ?? understanding.genreSpecificData;

    if (genreData && Array.isArray(genreData.pieces)) {
      // Structured pieces provided in genreSpecificData
      pieces = genreData.pieces as ChessPiece[];
      if (genreData.currentTurn === "white" || genreData.currentTurn === "black") {
        currentTurn = genreData.currentTurn;
      }
      if (genreData.orientation === "white" || genreData.orientation === "black") {
        orientation = genreData.orientation;
      }
    } else if (
      understanding.objectCandidates.length > 0 &&
      understanding.objectCandidates.some((c) => c.role.startsWith("chess-") || c.properties?.square)
    ) {
      // Reconstruct pieces from structured object candidates
      for (const candidate of understanding.objectCandidates) {
        const square = candidate.properties?.square as ChessSquare | undefined;
        const color = (candidate.properties?.color as ChessColor) || "white";
        const rawType = candidate.role.replace(/^chess-/, "") as ChessPieceType;

        if (square) {
          pieces.push({
            color,
            hasMoved: Boolean(candidate.properties?.hasMoved),
            id: candidate.id,
            square,
            type: rawType,
          });
        }
      }
    } else {
      // Default standard starting board
      pieces = createInitialChessBoard();
      warnings.push({
        code: "CHESS_DEFAULT_BOARD_USED",
        message: "No custom chess piece layout detected or provided; standard 32-piece starting layout generated.",
        recoverable: true,
      });
    }

    // 2. Build ChessPayload
    const payload: ChessPayload = {
      ...createDefaultChessPayload(),
      currentTurn,
      orientation,
      pieces,
    };

    // 3. Project pieces to generic GameObjects for universal architecture compatibility
    const objects: GameObject[] = pieces.map((p) => {
      const coord = squareToCoord(p.square);
      return {
        height: 64,
        id: p.id,
        name: `${p.color} ${p.type}`,
        properties: {
          color: p.color,
          hasMoved: p.hasMoved ?? false,
          square: p.square,
        },
        type: `chess-${p.type}`,
        width: 64,
        x: coord ? coord.col * 64 : 0,
        y: coord ? coord.row * 64 : 0,
      };
    });

    const viewport: GameViewport = {
      height: 800,
      width: 800,
    };

    const metadata: GameMetadata = {
      createdAt: new Date().toISOString(),
      description: "Generated 8x8 Chess Game Definition",
      generatedAt: new Date().toISOString(),
      source: input.source,
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

    const gameDefinition: ChessGameDefinition = {
      assets: [] as GameAsset[],
      engineConfig,
      gameType: "chess",
      id: input.projectId || `game_chess_${Date.now()}`,
      metadata,
      name: input.projectName || "Chess Game",
      objects,
      rules: DEFAULT_CHESS_RULES,
      settings,
      typePayload: payload,
      version: 1,
      viewport,
    };

    // 4. Validate through GenericGameValidator
    const genericValidation = GenericGameValidator.validate(gameDefinition);
    for (const issue of genericValidation.issues) {
      if (issue.severity === "error") {
        errors.push({
          blocking: true,
          code: issue.code,
          entityId: issue.entityId,
          message: issue.message,
        });
      } else {
        warnings.push({
          code: issue.code,
          entityId: issue.entityId,
          message: issue.message,
          recoverable: true,
        });
      }
    }

    // 5. Validate through ChessValidator
    const chessValidation = ChessValidator.validate(gameDefinition);
    for (const issue of chessValidation.issues) {
      if (!errors.some((e) => e.code === issue.code) && !warnings.some((w) => w.code === issue.code)) {
        if (issue.severity === "error") {
          errors.push({
            blocking: true,
            code: issue.code,
            entityId: issue.entityId,
            message: issue.message,
          });
        } else {
          warnings.push({
            code: issue.code,
            entityId: issue.entityId,
            message: issue.message,
            recoverable: true,
          });
        }
      }
    }

    const duration = Date.now() - startTime;
    const isSuccess = errors.length === 0;

    return {
      confidence: understanding.confidence,
      errors,
      gameDefinition: isSuccess ? gameDefinition : null,
      gameType: "chess",
      isExtensionPoint: false,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatorId: this.generatorId,
        validationDurationMs: duration,
      },
      success: isSuccess,
      warnings,
    };
  }
}
