/**
 * DRAW2GAME — Phase 11: Game Recognition
 * Pool / Billiards Genre Recognizer
 *
 * Evaluates structural signals characteristic of Pool tables:
 * ~2:1 rectangular table ratio, perimeter pocket regions (4 to 6),
 * cue/billiard balls, and solid playing surface cushion.
 */

import type { RecognitionCandidate, RecognizerModule, StructuralFeatures } from "../types";

export class PoolRecognizer implements RecognizerModule {
  public readonly id = "pool";
  public readonly name = "Pool / Billiards";
  public readonly description =
    "Detects rectangular ~2:1 table layouts with perimeter pockets and circular ball tokens.";

  public analyze(features: StructuralFeatures): RecognitionCandidate {
    const evidence: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    const { circularRegionsCount, cornerPocketsCount, isNearDoubleSquare } = features;

    // 1. Rectangular 2:1 table aspect ratio
    if (isNearDoubleSquare) {
      score += 0.35;
      evidence.push("Rectangular table layout detected (~2:1 aspect ratio)");
    } else {
      warnings.push("Layout does not match standard 2:1 billiard table dimensions");
    }

    // 2. Corner and side pockets (4 to 6 pockets)
    if (cornerPocketsCount >= 4) {
      score += 0.35;
      evidence.push(`${cornerPocketsCount} table pocket regions detected`);
    }

    // 3. Billiard balls (circular pieces)
    if (circularRegionsCount >= 3) {
      score += 0.25;
      evidence.push(`${circularRegionsCount} circular billiard ball shapes detected`);
    }

    // 4. Negative platformer signals reduce pool confidence
    if (features.hasPlayerGoalPair || features.hasVerticalSeparation) {
      score = Math.max(0, score - 0.30);
    }

    warnings.push(
      "Pool gameplay engine is an architecture extension point coming in a future phase.",
    );

    const confidence = Number(Math.min(1, Math.max(0, score)).toFixed(2));

    return {
      confidence,
      evidence,
      gameType: "pool",
      warnings,
    };
  }
}
