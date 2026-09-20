/**
 * DRAW2GAME — Phase 11: Game Recognition
 * Carrom Genre Recognizer
 *
 * Evaluates structural signals characteristic of Carrom boards:
 * square layout (1:1), 4 corner pockets, central circular striking ring,
 * and carrom men tokens.
 */

import type { RecognitionCandidate, RecognizerModule, StructuralFeatures } from "../types";

export class CarromRecognizer implements RecognizerModule {
  public readonly id = "carrom";
  public readonly name = "Carrom";
  public readonly description =
    "Detects square board layouts with four corner pockets and central circular strike areas.";

  public analyze(features: StructuralFeatures): RecognitionCandidate {
    const evidence: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    const { circularRegionsCount, cornerPocketsCount, isNearSquare } = features;

    // 1. Square board ratio
    if (isNearSquare) {
      score += 0.25;
      evidence.push("Square board boundary detected (~1:1 ratio)");
    }

    // 2. Exactly or approximately 4 corner pockets
    if (cornerPocketsCount >= 4) {
      score += 0.40;
      evidence.push("Four corner pocket locations identified");
    }

    // 3. Central ring and carrom men tokens
    if (circularRegionsCount >= 4) {
      score += 0.30;
      evidence.push(`${circularRegionsCount} circular carrom men/striker shapes detected`);
    }

    // 4. Negative platformer signals
    if (features.hasPlayerGoalPair || features.hasVerticalSeparation) {
      score = Math.max(0, score - 0.30);
    }

    warnings.push(
      "Carrom gameplay engine is an architecture extension point coming in a future phase.",
    );

    const confidence = Number(Math.min(1, Math.max(0, score)).toFixed(2));

    return {
      confidence,
      evidence,
      gameType: "carrom",
      warnings,
    };
  }
}
