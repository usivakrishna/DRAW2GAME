/**
 * DRAW2GAME — Phase 13: Universal Game Generation Architecture
 * Extension Point Generator
 *
 * Handles recognized or selected future game genres (ludo, pool, carrom,
 * racing, puzzle, shooter, sports) as explicit architecture extension points.
 * Returns structured, typed failure results with informative messaging
 * rather than throwing exceptions or fabricating fake implementations.
 */

import {
  EXTENSION_GAME_TYPES,
  type ExtensionGameType,
  type GameDefinition,
  type GameType,
} from "@/game/core/game-definition";
import type { GameDefinitionGenerator } from "../generator-interface";
import type {
  GameGenerationInput,
  GameGenerationResult,
  GameUnderstanding,
} from "../types";

export class ExtensionPointGenerator implements GameDefinitionGenerator {
  public readonly gameType: GameType = "ludo"; // Default representative type
  public readonly generatorId = "extension-point-generator";

  public canHandle(gameType: string): boolean {
    return (EXTENSION_GAME_TYPES as readonly string[]).includes(
      gameType as ExtensionGameType,
    );
  }

  public generate(
    input: GameGenerationInput,
    understanding: GameUnderstanding,
  ): GameGenerationResult<GameDefinition> {
    const targetType = input.targetGameType || understanding.gameType;

    return {
      confidence: understanding.confidence,
      errors: [
        {
          blocking: true,
          code: "EXTENSION_POINT_UNIMPLEMENTED",
          message: `Generation and engine for '${targetType}' are architecture extension points scheduled for future phases.`,
        },
      ],
      gameDefinition: null,
      gameType: targetType,
      isExtensionPoint: true,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatorId: this.generatorId,
      },
      success: false,
      warnings: [
        {
          code: "FUTURE_PHASE_EXTENSION",
          message: `The game genre '${targetType}' was recognized by the architecture, but its engine is not yet available in Phase 13.`,
          recoverable: false,
        },
      ],
    };
  }
}
