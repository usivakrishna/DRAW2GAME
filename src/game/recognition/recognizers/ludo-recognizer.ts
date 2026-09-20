/**
 * DRAW2GAME — Phase 11: Game Recognition
 * Ludo Genre Recognizer
 *
 * Evaluates structural signals characteristic of Ludo boards:
 * square board (~1:1), 4-quadrant symmetric corner home bases,
 * central triangular/square finish zone, and colored circular tokens.
 */

import type { RecognitionCandidate, RecognizerModule, StructuralFeatures } from "../types";

export class LudoRecognizer implements RecognizerModule {
  public readonly id = "ludo";
  public readonly name = "Ludo";
  public readonly description =
    "Detects square board layouts with four symmetric home quadrants and central home zones.";

  public analyze(features: StructuralFeatures): RecognitionCandidate {
    const evidence: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    const { circularRegionsCount, isNearSquare, quadrantSymmetryDetected } = features;

    // 1. Square board ratio
    if (isNearSquare) {
      score += 0.20;
      evidence.push("Square board boundary detected");
    }

    // 2. 4-quadrant symmetry (characteristic of Ludo home bases)
    if (quadrantSymmetryDetected) {
      score += 0.45;
      evidence.push("Four symmetric corner home quadrant structures detected");
    }

    // 3. Circular token pieces
    if (circularRegionsCount >= 4) {
      score += 0.25;
      evidence.push(`${circularRegionsCount} circular player token pieces detected`);
    }

    // 4. Negative platformer signals reduce Ludo confidence
    if (features.hasPlayerGoalPair || features.hasVerticalSeparation) {
      score = Math.max(0, score - 0.30);
    }

    warnings.push(
      "Ludo gameplay engine is an architecture extension point coming in a future phase.",
    );

    const confidence = Number(Math.min(1, Math.max(0, score)).toFixed(2));

    return {
      confidence,
      evidence,
      gameType: "ludo",
      warnings,
    };
  }
}
