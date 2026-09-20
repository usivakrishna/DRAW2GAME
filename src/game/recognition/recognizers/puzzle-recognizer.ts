/**
 * DRAW2GAME — Phase 11: Game Recognition
 * Puzzle Genre Recognizer
 *
 * Evaluates structural signals characteristic of 2D puzzle games:
 * discrete tile matrices, matching blocks, or shape arrangements.
 */

import type { RecognitionCandidate, RecognizerModule, StructuralFeatures } from "../types";

export class PuzzleRecognizer implements RecognizerModule {
  public readonly id = "puzzle";
  public readonly name = "Puzzle";
  public readonly description =
    "Detects discrete block partitions, matching tile clusters, and grid arrangements.";

  public analyze(features: StructuralFeatures): RecognitionCandidate {
    const evidence: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    const { discreteTilesDetected, gridCellsCount } = features;

    // 1. Discrete tile patterns
    if (discreteTilesDetected) {
      score += 0.50;
      evidence.push("Discrete matching tile or puzzle block pattern detected");
    }

    // 2. Moderate grid partitions (non-standard chess size, e.g. 4x4 or 5x5)
    if (gridCellsCount >= 9 && gridCellsCount < 48) {
      score += 0.30;
      evidence.push(`Tile matrix layout detected (${gridCellsCount} cells)`);
    }

    // 3. Negative platformer signals
    if (features.hasPlayerGoalPair && features.hasVerticalSeparation) {
      score = Math.max(0, score - 0.35);
    }

    warnings.push(
      "Puzzle gameplay engine is an architecture extension point coming in a future phase.",
    );

    const confidence = Number(Math.min(1, Math.max(0, score)).toFixed(2));

    return {
      confidence,
      evidence,
      gameType: "puzzle",
      warnings,
    };
  }
}
