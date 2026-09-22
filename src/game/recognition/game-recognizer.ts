/**
 * DRAW2GAME — Phase 11: Game Recognition & Game-Type Detection
 * Master Game Recognizer Engine
 *
 * Coordinates modular genre recognizers, aggregates structural evidence,
 * calculates confidence scores, and determines the most likely 2D game type.
 *
 * Adheres strictly to the principle of explainable, deterministic scoring
 * without fabricating fake AI predictions or cloud dependencies.
 */

import { inferCapabilities } from "@/game/core/game-capabilities";
import {
  type GameType,
  isSupportedGameType,
} from "@/game/core/game-definition";
import {
  extractStructuralFeatures,
  type FeatureExtractionInput,
} from "./feature-extractor";
import { CarromRecognizer } from "./recognizers/carrom-recognizer";
import { ChessRecognizer } from "./recognizers/chess-recognizer";
import { LudoRecognizer } from "./recognizers/ludo-recognizer";
import { PlatformerRecognizer } from "./recognizers/platformer-recognizer";
import { PoolRecognizer } from "./recognizers/pool-recognizer";
import { PuzzleRecognizer } from "./recognizers/puzzle-recognizer";
import { RacingRecognizer } from "./recognizers/racing-recognizer";
import { ShooterRecognizer } from "./recognizers/shooter-recognizer";
import { SportsRecognizer } from "./recognizers/sports-recognizer";
import type {
  GameRecognitionResult,
  RecognitionCandidate,
  RecognizerModule,
  StructuralFeatures,
} from "./types";

export interface RecognitionOptions {
  confidenceThreshold?: number | undefined; // Minimum confidence to accept a candidate (default: 0.40)
  manualOverride?: GameType | undefined; // User manual selection
  tieBreakerDelta?: number | undefined; // Minimum score gap to avoid ambiguity (default: 0.12)
}

export class GameRecognizer {
  private static recognizers: RecognizerModule[] = [
    new PlatformerRecognizer(),
    new ChessRecognizer(),
    new LudoRecognizer(),
    new PoolRecognizer(),
    new CarromRecognizer(),
    new RacingRecognizer(),
    new PuzzleRecognizer(),
    new ShooterRecognizer(),
    new SportsRecognizer(),
  ];

  /**
   * Registers a custom recognizer module (for future extensibility).
   */
  public static registerRecognizer(recognizer: RecognizerModule): void {
    this.recognizers.push(recognizer);
  }

  /**
   * Clears custom recognizers and restores default set.
   */
  public static resetRecognizers(): void {
    this.recognizers = [
      new PlatformerRecognizer(),
      new ChessRecognizer(),
      new LudoRecognizer(),
      new PoolRecognizer(),
      new CarromRecognizer(),
      new RacingRecognizer(),
      new PuzzleRecognizer(),
      new ShooterRecognizer(),
      new SportsRecognizer(),
    ];
  }

  /**
   * Executes game recognition on the given input features or raw inputs.
   */
  public static recognize(
    input: FeatureExtractionInput | StructuralFeatures,
    options: RecognitionOptions = {},
  ): GameRecognitionResult {
    const {
      confidenceThreshold = 0.40,
      manualOverride,
      tieBreakerDelta = 0.12,
    } = options;

    // 1. Handle explicit manual override
    if (manualOverride) {
      const isPlayable = isSupportedGameType(manualOverride);
      return {
        alternatives: [],
        capabilities: inferCapabilities(manualOverride),
        confidence: 1.0,
        evidence: [`User explicitly selected ${manualOverride} game type`],
        gameType: manualOverride,
        source: "manual",
        suggestedAction: isPlayable
          ? manualOverride === "chess"
            ? "Universal Game Engine is ready. Play chess now!"
            : "Universal Game Engine is ready. Proceed to Level JSON generation and play platformer now!"
          : `${manualOverride.toUpperCase()} rules and data are an extension point coming in a future phase.`,
        supported: isPlayable,
        warnings: isPlayable
          ? []
          : [
              `Gameplay capabilities and rules for "${manualOverride}" are an architecture extension point coming in a future phase.`,
            ],
      };
    }

    // 2. Extract normalized structural features
    const features: StructuralFeatures =
      "horizontalSegmentsCount" in input
        ? (input as StructuralFeatures)
        : extractStructuralFeatures(input as FeatureExtractionInput);

    // 3. Execute all recognizers
    const candidates: RecognitionCandidate[] = this.recognizers.map(
      (recognizer) => recognizer.analyze(features),
    );

    // Sort descending by confidence
    candidates.sort((a, b) => b.confidence - a.confidence);

    const topCandidate = candidates[0];
    const secondCandidate = candidates[1];

    // 4. Case: No candidates or very low confidence (< threshold)
    if (!topCandidate || topCandidate.confidence < confidenceThreshold) {
      return {
        alternatives: candidates
          .filter((c) => c.confidence > 0.15)
          .map((c) => ({ confidence: c.confidence, gameType: c.gameType })),
        confidence: topCandidate ? topCandidate.confidence : 0,
        evidence:
          topCandidate && topCandidate.evidence.length > 0
            ? topCandidate.evidence
            : ["Insufficient structural game features detected"],
        gameType: "unknown",
        source: "heuristic",
        suggestedAction:
          "Game type could not be determined confidently. Add more recognizable game elements or choose a game type manually.",
        supported: false,
        warnings: [
          "Low confidence: Visual layout lacks distinct genre patterns.",
          "Add recognizable game elements (platforms, grids, goals) or manually select your game type.",
        ],
      };
    }

    // 5. Case: Ambiguous tie between top candidates
    if (
      secondCandidate &&
      topCandidate.confidence < 0.70 &&
      topCandidate.confidence - secondCandidate.confidence < tieBreakerDelta
    ) {
      return {
        alternatives: [
          { confidence: topCandidate.confidence, gameType: topCandidate.gameType },
          { confidence: secondCandidate.confidence, gameType: secondCandidate.gameType },
        ],
        confidence: topCandidate.confidence,
        evidence: [
          `Ambiguous layout: features share characteristics of both ${topCandidate.gameType} and ${secondCandidate.gameType}.`,
          ...topCandidate.evidence,
        ],
        gameType: "unknown",
        source: "structural",
        suggestedAction: `Ambiguous match between ${topCandidate.gameType} (${Math.round(topCandidate.confidence * 100)}%) and ${secondCandidate.gameType} (${Math.round(secondCandidate.confidence * 100)}%). Select your intended game type using manual override.`,
        supported: false,
        warnings: [
          `Visual evidence is divided between ${topCandidate.gameType} and ${secondCandidate.gameType}.`,
          "Please select your intended game type manually.",
        ],
      };
    }

    // 6. Case: Confident match
    const isSupported = isSupportedGameType(topCandidate.gameType);
    const alternatives = candidates
      .slice(1)
      .filter((c) => c.confidence >= 0.20)
      .map((c) => ({ confidence: c.confidence, gameType: c.gameType }));

    const mergedEvidence = [...topCandidate.evidence];
    if (features.layout && features.layout.evidence.length > 0) {
      for (const ev of features.layout.evidence) {
        if (!mergedEvidence.includes(ev)) {
          mergedEvidence.push(ev);
        }
      }
    }

    return {
      alternatives,
      capabilities: inferCapabilities(topCandidate.gameType),
      confidence: topCandidate.confidence,
      evidence: mergedEvidence,
      gameType: topCandidate.gameType,
      source: "structural",
      suggestedAction: isSupported
        ? topCandidate.gameType === "chess"
          ? "Universal Game Engine is ready! Click to play chess now."
          : "Universal Game Engine is ready. Convert to Level JSON and play!"
        : `${topCandidate.gameType.toUpperCase()} recognized! Note: gameplay capabilities and rules are an extension point scheduled for future phases.`,
      supported: isSupported,
      warnings: topCandidate.warnings ?? [],
    };
  }
}
