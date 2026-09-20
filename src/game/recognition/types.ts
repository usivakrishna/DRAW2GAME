/**
 * DRAW2GAME — Phase 11: Game Recognition & Game-Type Detection
 * Core Type Definitions & Interfaces
 */

import type { GameType } from "@/game/core/game-definition";
import type { DetectionPrediction } from "@/types/detection";

export type RecognizedGameType = GameType | "unknown";

export type RecognitionSource =
  | "heuristic"
  | "structural"
  | "detection"
  | "manual";

export interface RecognitionCandidate {
  confidence: number;
  evidence: string[];
  gameType: GameType;
  warnings?: string[] | undefined;
}

export interface GameRecognitionResult {
  alternatives?: Array<{ confidence: number; gameType: GameType }> | undefined;
  confidence: number;
  evidence: string[];
  gameType: RecognizedGameType;
  source: RecognitionSource;
  suggestedAction?: string | undefined;
  supported: boolean;
  warnings: string[];
}

export interface GameRecognitionRecord {
  detectedGameType: RecognizedGameType;
  recognitionAlternatives?: Array<{ confidence: number; gameType: GameType }> | undefined;
  recognitionConfidence: number;
  recognitionEvidence: string[];
  recognitionSource: RecognitionSource;
  recognitionWarnings: string[];
  recognizedAt: string;
  suggestedAction?: string | undefined;
  userSelectedGameType?: GameType | undefined;
}

/**
 * Structural visual and geometric features extracted from the user's sketch,
 * preprocessed image, or detection predictions.
 */
export interface StructuralFeatures {
  // Dimensional characteristics
  aspectRatio: number; // width / height
  dimensions: {
    height: number;
    width: number;
  };

  // Detection object distributions (if detections are available)
  predictions: DetectionPrediction[];
  classCounts: {
    coin: number;
    enemy: number;
    goal: number;
    platform: number;
    player: number;
    spike: number;
    [key: string]: number;
  };

  // Geometric & topological signals
  horizontalSegmentsCount: number;
  verticalSegmentsCount: number;
  gridCellsCount: number;
  circularRegionsCount: number;
  cornerPocketsCount: number;
  continuousPathDetected: boolean;
  quadrantSymmetryDetected: boolean;
  opposingGoalZonesDetected: boolean;
  reticleDetected: boolean;
  discreteTilesDetected: boolean;

  // Spatial metrics
  hasBottomBaseline: boolean;
  hasVerticalSeparation: boolean;
  hasPlayerGoalPair: boolean;
  isNearSquare: boolean; // aspect ratio 0.85 - 1.15
  isNearDoubleSquare: boolean; // aspect ratio 1.7 - 2.3 (~2:1 table or 16:9 side scroller)
}

/**
 * Common contract for a modular game-type recognizer.
 */
export interface RecognizerModule {
  analyze(features: StructuralFeatures): RecognitionCandidate;
  description: string;
  id: GameType;
  name: string;
}
