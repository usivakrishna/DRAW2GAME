/**
 * DRAW2GAME — Universal Game Engine Architecture
 * Universal Game Generator
 *
 * Master orchestrator responsible for:
 * 1. Receiving generation input (canvas, sketch, detections, manual).
 * 2. Extracting intermediate GameUnderstanding.
 * 3. Generating a generic GameDefinition configured with appropriate capabilities,
 *    objects, rules, and settings for the UniversalGameEngine.
 * 4. Validating through Generic and Schema validators.
 * 5. Returning structured GameGenerationResult.
 *
 * Adheres strictly to the Universal Engine Architecture:
 * - NO game-specific engine classes
 * - NO game-specific generator subclasses (ChessGameGenerator / PlatformerGameGenerator removed)
 * - Single universal pipeline: Input -> Understanding -> Generic GameDefinition -> UniversalGameEngine
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
import {
  EXTENSION_GAME_TYPES,
  type ExtensionGameType,
  type GameAsset,
  type GameDefinition,
  type GameMetadata,
  type GameObject,
  type GameSettings,
  type GameViewport,
} from "@/game/core/game-definition";
import {
  levelDefinitionToGameDefinition,
  type PlatformerGameDefinition,
} from "@/game/core/platformer-definition";
import { convertDetectionsToLevel } from "@/json/detection-to-level";
import type { GameMode } from "@/json/level-schema";
import type { DetectionClass, DetectionPrediction } from "@/types/detection";
import { GameUnderstandingExtractor } from "./game-understanding";
import type { GameDefinitionGenerator } from "./generator-interface";
import type {
  GameGenerationError,
  GameGenerationInput,
  GameGenerationResult,
  GameGenerationWarning,
  GameUnderstanding,
} from "./types";
import { ChessValidator } from "./validators/chess-validator";
import { GenericGameValidator } from "./validators/generic-validator";
import { PlatformerValidator } from "./validators/platformer-validator";
import { UnderstandingValidator } from "./validators/understanding-validator";

export class UniversalGameGenerator {
  private static customGenerators: GameDefinitionGenerator[] = [];

  public static registerGenerator(generator: GameDefinitionGenerator): void {
    this.customGenerators.unshift(generator);
  }

  public static unregisterGenerator(generatorId: string): void {
    this.customGenerators = this.customGenerators.filter((g) => g.generatorId !== generatorId);
  }

  public static resetGenerators(): void {
    this.customGenerators = [];
  }

  public static getRegisteredGenerators(): readonly GameDefinitionGenerator[] {
    return [...this.customGenerators];
  }

  public static findGenerator(gameType: string): GameDefinitionGenerator | undefined {
    return this.customGenerators.find((g) => g.canHandle(gameType));
  }

  /**
   * Main entry point: Generates a complete, validated GameDefinition
   * from any supported input representation.
   */
  public static generateGame<TDef extends GameDefinition = GameDefinition>(
    input: GameGenerationInput,
  ): GameGenerationResult<TDef> {
    const startTime = Date.now();

    // 1. Extract intermediate understanding
    const understanding: GameUnderstanding = GameUnderstandingExtractor.extract(input);
    const targetType = input.targetGameType ?? understanding.gameType;

    // Validate semantic understanding model
    const understandingVal = UnderstandingValidator.validate(understanding);
    if (!understandingVal.isValid) {
      return {
        confidence: understanding.confidence,
        errors: understandingVal.errors.map((err) => ({
          blocking: true,
          code: "UNDERSTANDING_VALIDATION_ERROR",
          message: err,
        })),
        gameDefinition: null,
        gameType: targetType,
        isExtensionPoint: false,
        metadata: {
          generatedAt: new Date().toISOString(),
          generatorId: "universal-generator",
          validationDurationMs: Date.now() - startTime,
        },
        success: false,
        warnings: understandingVal.warnings.map((w) => ({
          code: "UNDERSTANDING_WARNING",
          message: w,
          recoverable: true,
        })),
      };
    }

    // 2. Check for custom registered generator first
    const customGen = this.findGenerator(targetType);
    if (customGen) {
      return customGen.generate(input, understanding) as GameGenerationResult<TDef>;
    }

    // 3. Handle unknown / ambiguous genre
    if (targetType === "unknown") {
      return {
        confidence: understanding.confidence,
        errors: [
          {
            blocking: true,
            code: "GAME_TYPE_UNKNOWN",
            message:
              "Game type could not be determined confidently. Select a game type manually to proceed.",
          },
        ],
        gameDefinition: null,
        gameType: "unknown",
        isExtensionPoint: false,
        metadata: {
          generatedAt: new Date().toISOString(),
          generatorId: "universal-generator",
          validationDurationMs: Date.now() - startTime,
        },
        success: false,
        warnings: [
          {
            code: "LOW_CONFIDENCE_RECOGNITION",
            message: "Visual features did not match a known genre profile.",
            recoverable: false,
          },
        ],
      };
    }

    // 4. Handle future architecture extension point genres
    if (
      (EXTENSION_GAME_TYPES as readonly string[]).includes(
        targetType as ExtensionGameType,
      )
    ) {
      return {
        confidence: understanding.confidence,
        errors: [
          {
            blocking: true,
            code: "EXTENSION_POINT_UNIMPLEMENTED",
            message: `Generation and runtime profile for '${targetType}' are architecture extension points scheduled for future phases.`,
          },
        ],
        gameDefinition: null,
        gameType: targetType,
        isExtensionPoint: true,
        metadata: {
          generatedAt: new Date().toISOString(),
          generatorId: "universal-generator",
          validationDurationMs: Date.now() - startTime,
        },
        success: false,
        warnings: [
          {
            code: "FUTURE_PHASE_EXTENSION",
            message: `The game genre '${targetType}' was recognized by the architecture, but its full runtime profile is an extension point.`,
            recoverable: false,
          },
        ],
      };
    }

    // 5. Generate Platformer GameDefinition
    if (targetType === "platformer") {
      return this.generatePlatformer(input, understanding, startTime) as unknown as GameGenerationResult<TDef>;
    }

    // 6. Generate Chess GameDefinition
    if (targetType === "chess") {
      return this.generateChess(input, understanding, startTime) as unknown as GameGenerationResult<TDef>;
    }

    // Fallback for unrecognized game types
    return {
      confidence: understanding.confidence,
      errors: [
        {
          blocking: true,
          code: "UNSUPPORTED_GAME_TYPE",
          message: `Game type '${targetType}' is not supported by the universal generator.`,
        },
      ],
      gameDefinition: null,
      gameType: targetType,
      isExtensionPoint: false,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatorId: "universal-generator",
        validationDurationMs: Date.now() - startTime,
      },
      success: false,
      warnings: [],
    };
  }

  // ==========================================
  // Generic Platformer GameDefinition Builder
  // ==========================================

  private static generatePlatformer(
    input: GameGenerationInput,
    understanding: GameUnderstanding,
    startTime: number,
  ): GameGenerationResult<PlatformerGameDefinition> {
    const warnings: GameGenerationWarning[] = [];
    const errors: GameGenerationError[] = [];

    // 1. Resolve predictions: direct predictions, synthesized from objectCandidates, or default layout
    let predictions: DetectionPrediction[] = [];
    if (input.predictions && input.predictions.length > 0) {
      predictions = [...input.predictions];
    } else if (understanding.objectCandidates.length > 0) {
      predictions = understanding.objectCandidates.map((c, idx) => ({
        boundingBox: {
          height: c.height ?? 32,
          width: c.width ?? 32,
          x: c.x,
          y: c.y,
        },
        className: c.role as DetectionClass,
        confidence: c.confidence ?? 0.85,
        id: c.id || `pred_${idx + 1}`,
      }));
    } else {
      predictions = [
        {
          boundingBox: { height: 48, width: 32, x: 96, y: 384 },
          className: "player",
          confidence: 1.0,
          id: "player_start",
        },
        {
          boundingBox: { height: 32, width: 600, x: 50, y: 550 },
          className: "platform",
          confidence: 1.0,
          id: "ground_plat",
        },
        {
          boundingBox: { height: 64, width: 44, x: 600, y: 486 },
          className: "goal",
          confidence: 1.0,
          id: "goal_flag",
        },
      ];
    }

    // Ensure essential playable platformer elements exist when synthesis is explicitly requested
    const allowSynthesizedDefaults = Boolean(input.options?.synthesizeDefaults);
    if (allowSynthesizedDefaults) {
      const hasPlayer = predictions.some((p) => p.className === "player");
      const hasPlatform = predictions.some((p) => p.className === "platform");
      const hasGoal = predictions.some((p) => p.className === "goal");

      if (!hasPlayer) {
        predictions.unshift({
          boundingBox: { height: 48, width: 32, x: 96, y: 384 },
          className: "player",
          confidence: 0.8,
          id: "synthesized_player",
        });
        warnings.push({
          code: "PLAYER_SYNTHESIZED",
          message: "No player spawn detected in sketch: synthesized default player start location.",
          recoverable: true,
        });
      }

      if (!hasPlatform) {
        predictions.push({
          boundingBox: { height: 32, width: 800, x: 50, y: 550 },
          className: "platform",
          confidence: 0.8,
          id: "synthesized_ground",
        });
        warnings.push({
          code: "PLATFORM_SYNTHESIZED",
          message: "No platform detected in sketch: synthesized ground support platform.",
          recoverable: true,
        });
      }

      if (!hasGoal) {
        predictions.push({
          boundingBox: { height: 64, width: 44, x: 750, y: 486 },
          className: "goal",
          confidence: 0.8,
          id: "synthesized_goal",
        });
        warnings.push({
          code: "GOAL_SYNTHESIZED",
          message: "No goal flag detected in sketch: synthesized finish goal.",
          recoverable: true,
        });
      }
    }

    // 2. Convert to LevelDefinition using adapted Phase 5 converter
    const levelConversion = convertDetectionsToLevel(predictions, {
      gameMode: (input.options?.gameMode as GameMode | undefined) ?? undefined,
      levelName: input.projectName || "Platformer Level",
      sourceDimensions: input.sourceDimensions,
    });

    for (const issue of levelConversion.validation.issues) {
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

    // 3. Transform to PlatformerGameDefinition using Phase 10 adapter
    const gameDefinition = levelDefinitionToGameDefinition(
      levelConversion.level,
      input.projectId,
    );

    // Apply metadata
    if (gameDefinition.metadata) {
      gameDefinition.metadata.source = input.source;
    }

    // Merge inferred capabilities from GameUnderstanding
    if (understanding.capabilities && understanding.capabilities.length > 0) {
      const merged = Array.from(new Set([...(gameDefinition.capabilities ?? []), ...understanding.capabilities]));
      gameDefinition.capabilities = merged;
    }

    // Include non-blocking diagnostics from GameUnderstanding
    if (understanding.diagnostics) {
      for (const diag of understanding.diagnostics) {
        if (diag.severity === "warning" && !warnings.some((w) => w.code === diag.code)) {
          warnings.push({
            code: diag.code,
            entityId: diag.entityId,
            message: diag.message,
            recoverable: true,
          });
        }
      }
    }

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

    // 5. Validate through PlatformerValidator
    const platformerValidation = PlatformerValidator.validate(gameDefinition);
    for (const issue of platformerValidation.issues) {
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
      gameType: "platformer",
      isExtensionPoint: false,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatorId: "universal-generator",
        validationDurationMs: duration,
      },
      success: isSuccess,
      warnings,
    };
  }

  // ==========================================
  // Generic Chess GameDefinition Builder
  // ==========================================

  private static generateChess(
    input: GameGenerationInput,
    understanding: GameUnderstanding,
    startTime: number,
  ): GameGenerationResult<ChessGameDefinition> {
    const warnings: GameGenerationWarning[] = [];
    const errors: GameGenerationError[] = [];

    // 1. Resolve ChessPayload pieces and configuration
    let pieces: ChessPiece[] = [];
    let currentTurn: ChessColor = "white";
    let orientation: ChessColor = "white";

    const genreData =
      input.genreSpecificData ?? understanding.genreSpecificData;

    if (genreData && Array.isArray(genreData.pieces)) {
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

    const mergedCaps = Array.from(
      new Set(["board", "grid", "turns", "rules", "scoring", ...(understanding.capabilities ?? [])]),
    );

    const gameDefinition: ChessGameDefinition = {
      assets: [] as GameAsset[],
      capabilities: mergedCaps as ("board" | "grid" | "turns" | "rules" | "scoring")[],
      engineConfig: {
        backgroundColor: "#1e293b",
        engineId: "universal-2d-engine",
        fps: 60,
        renderer: "auto",
      },
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
        generatorId: "universal-generator",
        validationDurationMs: duration,
      },
      success: isSuccess,
      warnings,
    };
  }
}
