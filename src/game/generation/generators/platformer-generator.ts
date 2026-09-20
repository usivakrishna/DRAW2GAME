/**
 * DRAW2GAME — Phase 13: Universal Game Generation Architecture
 * Platformer GameDefinition Generator
 *
 * Implements the GameDefinitionGenerator contract for 2D Platformer games.
 * Adapts and leverages existing Phase 5 Detection-to-Level and Phase 10
 * Level-to-GameDefinition converters to ensure 100% backward compatibility.
 */

import {
  levelDefinitionToGameDefinition,
  type PlatformerGameDefinition,
} from "@/game/core/platformer-definition";
import { convertDetectionsToLevel } from "@/json/detection-to-level";
import type { GameMode } from "@/json/level-schema";
import type { DetectionClass, DetectionPrediction } from "@/types/detection";
import type { GameDefinitionGenerator } from "../generator-interface";
import type {
  GameGenerationError,
  GameGenerationInput,
  GameGenerationResult,
  GameGenerationWarning,
  GameUnderstanding,
} from "../types";
import { GenericGameValidator } from "../validators/generic-validator";
import { PlatformerValidator } from "../validators/platformer-validator";

export class PlatformerGameGenerator
  implements GameDefinitionGenerator<PlatformerGameDefinition>
{
  public readonly gameType = "platformer" as const;
  public readonly generatorId = "platformer-standard-generator";

  public canHandle(gameType: string): boolean {
    return gameType === "platformer";
  }

  public generate(
    input: GameGenerationInput,
    understanding: GameUnderstanding,
  ): GameGenerationResult<PlatformerGameDefinition> {
    const startTime = Date.now();
    const warnings: GameGenerationWarning[] = [];
    const errors: GameGenerationError[] = [];

    // 1. Resolve predictions: direct predictions or synthesized from objectCandidates
    let predictions: DetectionPrediction[] = [];
    if (input.predictions && input.predictions.length > 0) {
      predictions = input.predictions;
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
    }

    // 2. Convert to LevelDefinition using adapted Phase 5 converter
    const levelConversion = convertDetectionsToLevel(predictions, {
      gameMode: (input.options?.gameMode as GameMode | undefined) ?? undefined,
      levelName: input.projectName || "Platformer Level",
      sourceDimensions: input.sourceDimensions,
    });

    // Capture issues from Phase 5 conversion
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
      // Deduplicate issues already caught
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
        generatorId: this.generatorId,
        validationDurationMs: duration,
      },
      success: isSuccess,
      warnings,
    };
  }
}
