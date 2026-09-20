/**
 * DRAW2GAME — Phase 11: Game Recognition
 * Shooter Genre Recognizer
 *
 * Evaluates structural signals characteristic of 2D shooters:
 * crosshairs / targeting reticles, directional fire paths, and clustered targets.
 */

import type { RecognitionCandidate, RecognizerModule, StructuralFeatures } from "../types";

export class ShooterRecognizer implements RecognizerModule {
  public readonly id = "shooter";
  public readonly name = "Shooter";
  public readonly description =
    "Detects aiming crosshairs, targeting reticles, and distributed target clusters.";

  public analyze(features: StructuralFeatures): RecognitionCandidate {
    const evidence: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    const { classCounts, reticleDetected } = features;

    // 1. Aiming reticle / crosshair structure
    if (reticleDetected) {
      score += 0.55;
      evidence.push("Targeting reticle / aiming crosshair detected");
    }

    // 2. High density of enemies/targets with a single player
    if (classCounts["enemy"] >= 3 && classCounts["player"] === 1 && !features.hasVerticalSeparation) {
      score += 0.35;
      evidence.push("Player avatar facing clustered opposing targets");
    }

    // 3. Negative platformer signals
    if (features.horizontalSegmentsCount >= 2 && features.hasVerticalSeparation) {
      score = Math.max(0, score - 0.30);
    }

    warnings.push(
      "Shooter gameplay engine is an architecture extension point coming in a future phase.",
    );

    const confidence = Number(Math.min(1, Math.max(0, score)).toFixed(2));

    return {
      confidence,
      evidence,
      gameType: "shooter",
      warnings,
    };
  }
}
