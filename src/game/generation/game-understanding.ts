/**
 * DRAW2GAME — Phase 16: Advanced Sketch Understanding & Generation
 * Game Understanding Extractor
 *
 * Normalizes incoming detections, performs spatial relationship analysis,
 * object grouping, layout classification, interaction inference, rule inference,
 * and capability inference into a single canonical GameUnderstanding model.
 */

import { DEFAULT_CHESS_RULES } from "@/game/chess/chess-definition";
import type { GameType } from "@/game/core/game-definition";
import { DEFAULT_PLATFORMER_RULES } from "@/game/core/platformer-definition";
import { CapabilityInferer } from "@/game/recognition/capability-inferer";
import { GameRecognizer } from "@/game/recognition/game-recognizer";
import { InteractionInferer } from "@/game/recognition/interaction-inferer";
import { RuleInferer } from "@/game/recognition/rule-inferer";
import { SpatialAnalyzer } from "@/game/recognition/spatial-analyzer";
import {
  type DetectionPrediction,
  normalizeDetectionPrediction,
} from "@/types/detection";
import type {
  GameGenerationInput,
  GameObjectCandidate,
  GameRuleCandidate,
  GameUnderstanding,
  GameUnderstandingDiagnostic,
} from "./types";
import { UnderstandingValidator } from "./validators/understanding-validator";

export class GameUnderstandingExtractor {
  /**
   * Extracts an intermediate GameUnderstanding model from the generation input.
   */
  public static extract(input: GameGenerationInput): GameUnderstanding {
    const rawPredictions = input.predictions ?? [];
    const predictions: DetectionPrediction[] = rawPredictions.map((p) =>
      normalizeDetectionPrediction(p, input.source === "upload" ? "model" : "heuristic"),
    );

    // 1. Spatial Analysis: relationships, groups, and layout
    const relationships = SpatialAnalyzer.analyzeRelationships(predictions);
    const groups = SpatialAnalyzer.findGroups(predictions);
    const layout = SpatialAnalyzer.classifyLayout(
      predictions,
      relationships,
      groups,
      input.sourceDimensions,
    );

    // 2. Resolve GameType and confidence
    let gameType: GameType | "unknown" = "unknown";
    let confidence = 0.5;
    const sourceTracking: Record<string, string> = {};

    if (input.targetGameType) {
      gameType = input.targetGameType;
      confidence = 1.0;
      sourceTracking["gameType"] = "user";
    } else if (input.recognitionResult) {
      gameType = input.recognitionResult.gameType;
      confidence = input.recognitionResult.confidence;
      sourceTracking["gameType"] = input.recognitionResult.source;
    } else if (predictions.length > 0 || input.canvas || input.sourceDimensions) {
      const recResult = GameRecognizer.recognize({
        canvas: input.canvas,
        imageDimensions: input.sourceDimensions,
        predictions,
      });
      gameType = recResult.gameType;
      confidence = recResult.confidence;
      sourceTracking["gameType"] = recResult.source;
    }

    // 3. Extract GameObjectCandidates from normalized predictions or genre-specific data
    const objectCandidates: GameObjectCandidate[] = [];

    if (predictions.length > 0) {
      for (let i = 0; i < predictions.length; i++) {
        const pred = predictions[i]!;
        const role = pred.category || pred.className;
        sourceTracking[pred.id] = pred.source || "model";

        objectCandidates.push({
          confidence: pred.confidence,
          height: pred.boundingBox.height,
          id: pred.id || `${role}_${i + 1}`,
          properties: {
            category: pred.category,
            confidence: pred.confidence,
            source: pred.source,
          },
          role,
          width: pred.boundingBox.width,
          x: pred.boundingBox.x,
          y: pred.boundingBox.y,
        });
      }
    }

    // Include chess pieces from genreSpecificData if provided
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
        sourceTracking[p.id] = "genre-specific-data";
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

    // 4. Infer Interactions
    const interactions = InteractionInferer.inferInteractions(predictions, relationships);
    interactions.forEach((inter) => {
      sourceTracking[inter.id] = inter.source;
    });

    // 5. Infer Rules
    const inferredRules = RuleInferer.inferRules(gameType, interactions, layout);
    const ruleCandidates: GameRuleCandidate[] = inferredRules.map((r) => {
      sourceTracking[r.id] = r.source;
      return {
        action: r.action,
        category: r.category,
        condition: r.condition,
        description: r.description,
        id: r.id,
        name: r.name,
      };
    });

    // Add baseline genre rules if not already present
    if (gameType === "platformer") {
      for (const rule of DEFAULT_PLATFORMER_RULES) {
        if (!ruleCandidates.some((r) => r.id === rule.id)) {
          sourceTracking[rule.id] = "default-genre-rule";
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
      }
    } else if (gameType === "chess") {
      for (const rule of DEFAULT_CHESS_RULES) {
        if (!ruleCandidates.some((r) => r.id === rule.id)) {
          sourceTracking[rule.id] = "default-genre-rule";
          ruleCandidates.push({
            category: "rules",
            description: rule.description || rule.name,
            id: rule.id,
            name: rule.name,
          });
        }
      }
    }

    // 6. Infer Capabilities
    const capabilities = CapabilityInferer.inferCapabilities(
      gameType,
      predictions,
      interactions,
      layout,
    );

    const understandingDraft: GameUnderstanding = {
      capabilities,
      confidence,
      diagnostics: [],
      gameType,
      genreSpecificData: input.genreSpecificData,
      groups,
      interactions,
      layout,
      objectCandidates,
      objects: objectCandidates,
      relationships,
      ruleCandidates,
      rules: ruleCandidates,
      sourceTracking,
    };

    // 7. Validate understanding
    const validationResult = UnderstandingValidator.validate(understandingDraft);
    const diagnostics: GameUnderstandingDiagnostic[] = [...validationResult.diagnostics];

    understandingDraft.diagnostics = diagnostics;

    return understandingDraft;
  }
}
