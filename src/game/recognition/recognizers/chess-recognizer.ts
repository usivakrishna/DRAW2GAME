/**
 * DRAW2GAME — Phase 11: Game Recognition
 * Chess Genre Recognizer
 *
 * Evaluates structural signals characteristic of Chess boards:
 * square layout (~1:1 ratio), 8x8 grid structure, repeating cell divisions,
 * alternating matrix patterns, and opposing piece ranks.
 */

import type { RecognitionCandidate, RecognizerModule, StructuralFeatures } from "../types";

export class ChessRecognizer implements RecognizerModule {
  public readonly id = "chess";
  public readonly name = "Chess";
  public readonly description =
    "Detects square 8x8 grid matrix structures, alternating cells, and board boundaries.";

  public analyze(features: StructuralFeatures): RecognitionCandidate {
    const evidence: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    const { circularRegionsCount, discreteTilesDetected, gridCellsCount, isNearSquare } = features;

    // 1. Square aspect ratio (~1:1)
    if (isNearSquare) {
      score += 0.25;
      evidence.push("Square board boundary detected (~1:1 aspect ratio)");
    } else {
      warnings.push("Board shape is not square (Chess boards are strictly 1:1)");
    }

    // 2. 8x8 grid pattern
    if (gridCellsCount >= 48) {
      score += 0.45;
      evidence.push(`Dense regular grid matrix detected (${gridCellsCount} cells ~ 8×8 board)`);
    } else if (gridCellsCount >= 16) {
      score += 0.25;
      evidence.push(`Regular grid partition detected (${gridCellsCount} cells)`);
      warnings.push("Fewer than 64 cells detected for a standard 8×8 chessboard");
    }

    // 3. Discrete alternating tiles
    if (discreteTilesDetected) {
      score += 0.15;
      evidence.push("Discrete alternating tile patterns detected");
    }

    // 4. Playing pieces / token elements
    if (circularRegionsCount >= 8) {
      score += 0.15;
      evidence.push(`${circularRegionsCount} chess piece/token-like shapes detected`);
    }

    // 5. Negative platformer signals (platforms, jump goal markers) reduce chess confidence
    if (features.horizontalSegmentsCount >= 3 || features.hasPlayerGoalPair) {
      score = Math.max(0, score - 0.25);
    }

    warnings.push(
      "Chess gameplay engine is an architecture extension point coming in a future phase.",
    );

    const confidence = Number(Math.min(1, Math.max(0, score)).toFixed(2));

    return {
      confidence,
      evidence,
      gameType: "chess",
      warnings,
    };
  }
}
