/**
 * DRAW2GAME — Phase 11: Game Recognition
 * Platformer Genre Recognizer
 *
 * Evaluates structural signals characteristic of 2D platformer games:
 * horizontal platforms, vertical tiering, player spawn, goal flags,
 * hazard placements (spikes), and collectibles (coins).
 */

import type { RecognitionCandidate, RecognizerModule, StructuralFeatures } from "../types";

export class PlatformerRecognizer implements RecognizerModule {
  public readonly id = "platformer";
  public readonly name = "Platformer";
  public readonly description =
    "Detects horizontal platforms, player spawns, goal markers, and vertically separated levels.";

  public analyze(features: StructuralFeatures): RecognitionCandidate {
    const evidence: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    const { classCounts, hasBottomBaseline, hasPlayerGoalPair, hasVerticalSeparation, horizontalSegmentsCount } =
      features;

    // 1. Horizontal platform structures
    if (horizontalSegmentsCount >= 2 || classCounts["platform"] >= 2) {
      score += 0.35;
      const count = Math.max(horizontalSegmentsCount, classCounts["platform"]);
      evidence.push(`${count} horizontal platform structures detected`);
    } else if (horizontalSegmentsCount === 1 || classCounts["platform"] === 1) {
      score += 0.15;
      evidence.push("1 horizontal platform structure detected");
      warnings.push("Only 1 platform detected; additional platforms increase platformer confidence");
    } else {
      warnings.push("No horizontal platform structures detected");
    }

    // 2. Player and Goal presence
    if (hasPlayerGoalPair) {
      score += 0.30;
      evidence.push("Player spawn and goal flag pair detected");
    } else {
      if (classCounts["player"] > 0) {
        score += 0.15;
        evidence.push("Player character spawn point detected");
        warnings.push("Missing goal marker — consider adding a flag or exit zone");
      }
      if (classCounts["goal"] > 0) {
        score += 0.15;
        evidence.push("Goal destination marker detected");
        warnings.push("Missing player spawn point");
      }
    }

    // 3. Vertical tiering / separation (crucial for jumping/traversal)
    if (hasVerticalSeparation) {
      score += 0.15;
      evidence.push("Multiple vertically separated elevation tiers detected");
    }

    // 4. Ground baseline
    if (hasBottomBaseline) {
      score += 0.10;
      evidence.push("Ground baseline platform detected at bottom of screen");
    }

    // 5. Secondary platformer entities (coins, spikes, enemies)
    const secondaryCount =
      (classCounts["coin"] ?? 0) +
      (classCounts["spike"] ?? 0) +
      (classCounts["enemy"] ?? 0);

    if (secondaryCount > 0) {
      score += 0.10;
      const details: string[] = [];
      if (classCounts["coin"] > 0) details.push(`${classCounts["coin"]} coins`);
      if (classCounts["spike"] > 0) details.push(`${classCounts["spike"]} spikes`);
      if (classCounts["enemy"] > 0) details.push(`${classCounts["enemy"]} enemies`);
      evidence.push(`Platformer game elements detected: ${details.join(", ")}`);
    }

    const confidence = Number(Math.min(1, Math.max(0, score)).toFixed(2));

    return {
      confidence,
      evidence,
      gameType: "platformer",
      warnings,
    };
  }
}
