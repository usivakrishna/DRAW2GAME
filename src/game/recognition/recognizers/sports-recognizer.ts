/**
 * DRAW2GAME — Phase 11: Game Recognition
 * Sports Genre Recognizer
 *
 * Evaluates structural signals characteristic of 2D sports (football, hockey, basketball, tennis):
 * rectangular pitch/court boundaries, two opposing goal/basket zones, and central ball token.
 */

import type { RecognitionCandidate, RecognizerModule, StructuralFeatures } from "../types";

export class SportsRecognizer implements RecognizerModule {
  public readonly id = "sports";
  public readonly name = "Sports";
  public readonly description =
    "Detects rectangular pitch/court markings with two opposing goal zones and ball tokens.";

  public analyze(features: StructuralFeatures): RecognitionCandidate {
    const evidence: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    const { circularRegionsCount, isNearDoubleSquare, opposingGoalZonesDetected } = features;

    // 1. Opposing goal zones (two opposite nets or end zones)
    if (opposingGoalZonesDetected) {
      score += 0.55;
      evidence.push("Two opposing goal/net zones detected at court boundaries");
    }

    // 2. Pitch / court aspect ratio
    if (isNearDoubleSquare || (features.aspectRatio >= 1.3 && features.aspectRatio <= 1.8)) {
      score += 0.20;
      evidence.push("Rectangular pitch or sports court boundary detected");
    }

    // 3. Central ball token
    if (circularRegionsCount === 1) {
      score += 0.20;
      evidence.push("Central ball object detected");
    }

    // 4. Negative platformer signals
    if (features.hasVerticalSeparation || features.horizontalSegmentsCount >= 3) {
      score = Math.max(0, score - 0.35);
    }

    warnings.push(
      "Sports gameplay engine is an architecture extension point coming in a future phase.",
    );

    const confidence = Number(Math.min(1, Math.max(0, score)).toFixed(2));

    return {
      confidence,
      evidence,
      gameType: "sports",
      warnings,
    };
  }
}
