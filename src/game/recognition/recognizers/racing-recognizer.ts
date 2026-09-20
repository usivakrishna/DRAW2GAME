/**
 * DRAW2GAME — Phase 11: Game Recognition
 * Racing Genre Recognizer
 *
 * Evaluates structural signals characteristic of top-down or 2D racing games:
 * continuous closed-loop tracks, road boundaries, starting/finish line, and vehicles.
 */

import type { RecognitionCandidate, RecognizerModule, StructuralFeatures } from "../types";

export class RacingRecognizer implements RecognizerModule {
  public readonly id = "racing";
  public readonly name = "Racing";
  public readonly description =
    "Detects continuous looping circuits, road track paths, and start/finish line markers.";

  public analyze(features: StructuralFeatures): RecognitionCandidate {
    const evidence: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    const { continuousPathDetected } = features;

    // 1. Continuous road or circuit loop path
    if (continuousPathDetected) {
      score += 0.55;
      evidence.push("Continuous road track / circuit loop geometry detected");
    }

    // 2. Start/finish line marker or vehicle markers
    if (features.classCounts["goal"] > 0 && continuousPathDetected) {
      score += 0.25;
      evidence.push("Start/finish line checkpoint detected along track");
    }

    // 3. Negative platformer signals: vertical tiered platforms without track loop reduces racing score
    if (!continuousPathDetected && features.hasVerticalSeparation) {
      score = 0;
    }

    warnings.push(
      "Racing gameplay engine is an architecture extension point coming in a future phase.",
    );

    const confidence = Number(Math.min(1, Math.max(0, score)).toFixed(2));

    return {
      confidence,
      evidence,
      gameType: "racing",
      warnings,
    };
  }
}
