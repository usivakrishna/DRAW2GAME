/**
 * DRAW2GAME — Phase 13: Universal Game Generation Architecture
 * Game Understanding Extractor
 *
 * Normalizes incoming detections, visual features, and recognition results
 * into an intermediate, genre-agnostic GameUnderstanding structure.
 */

import { DEFAULT_CHESS_RULES } from "@/game/chess/chess-definition";
import type { GameType } from "@/game/core/game-definition";
import { DEFAULT_PLATFORMER_RULES } from "@/game/core/platformer-definition";
import { GameRecognizer } from "@/game/recognition/game-recognizer";
import type {
  GameGenerationInput,
  GameObjectCandidate,
  GameRuleCandidate,
  GameUnderstanding,
} from "./types";

export class GameUnderstandingExtractor {
  /**
   * Extracts an intermediate GameUnderstanding model from the generation input.
   */
  public static extract(input: GameGenerationInput): GameUnderstanding {
    // 1. Resolve GameType and confidence
    let gameType: GameType | "unknown" = "unknown";
    let confidence = 0.5;

    if (input.targetGameType) {
      gameType = input.targetGameType;
      confidence = 1.0;
    } else if (input.recognitionResult) {
      gameType = input.recognitionResult.gameType;
      confidence = input.recognitionResult.confidence;
    } else if (input.predictions || input.canvas || input.sourceDimensions) {
      const recResult = GameRecognizer.recognize({
        canvas: input.canvas,
        imageDimensions: input.sourceDimensions,
        predictions: input.predictions ?? [],
      });
      gameType = recResult.gameType;
      confidence = recResult.confidence;
    }

    // 2. Extract GameObjectCandidates from predictions or genre-specific data
    const objectCandidates: GameObjectCandidate[] = [];

    if (input.predictions && input.predictions.length > 0) {
      for (let i = 0; i < input.predictions.length; i++) {
        const pred = input.predictions[i]!;
        objectCandidates.push({
          confidence: pred.confidence,
          height: pred.boundingBox.height,
          id: `${pred.className}_${i + 1}`,
          properties: {
            confidence: pred.confidence,
          },
          role: pred.className,
          width: pred.boundingBox.width,
          x: pred.boundingBox.x,
          y: pred.boundingBox.y,
        });
      }
    }

    // If chess pieces are present in genreSpecificData, include them
    if (
      input.genreSpecificData &&
      Array.isArray(input.genreSpecificData.pieces)
    ) {
      const chessPieces = input.genreSpecificData.pieces as Array<{
        color: string;
        hasMoved?: boolean;
        id: string;
        square: string;
        type: string;
      }>;
      for (const p of chessPieces) {
        objectCandidates.push({
          id: p.id,
          properties: {
            color: p.color,
            hasMoved: p.hasMoved ?? false,
            square: p.square,
          },
          role: `chess-${p.type}`,
          x: 0,
          y: 0,
        });
      }
    }

    // 3. Extract default candidate rules based on resolved gameType
    const ruleCandidates: GameRuleCandidate[] = [];
    if (gameType === "platformer") {
      for (const rule of DEFAULT_PLATFORMER_RULES) {
        ruleCandidates.push({
          action: rule.action,
          category: "gameplay",
          condition: rule.condition,
          description: rule.description || rule.name,
          event: rule.event,
          id: rule.id,
          name: rule.name,
          parameters: rule.parameters,
        });
      }
    } else if (gameType === "chess") {
      for (const rule of DEFAULT_CHESS_RULES) {
        ruleCandidates.push({
          category: "rules",
          description: rule.description || rule.name,
          id: rule.id,
          name: rule.name,
        });
      }
    }

    return {
      confidence,
      gameType,
      genreSpecificData: input.genreSpecificData,
      objectCandidates,
      ruleCandidates,
    };
  }
}
