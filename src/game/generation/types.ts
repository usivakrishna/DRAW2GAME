/**
 * DRAW2GAME — Phase 13: Universal Game Generation Architecture
 * Core Type Definitions for Universal Game Generation
 *
 * Defines the canonical input, intermediate understanding, candidates,
 * warnings, errors, and output results of the generation pipeline.
 */

import type { GameDefinition, GameType } from "@/game/core/game-definition";
import type { GameRecognitionResult, StructuralFeatures } from "@/game/recognition/types";
import type { DetectionPrediction } from "@/types/detection";

/**
 * Candidate object extracted during game understanding.
 * Normalizes detected entities, visual bounds, or recognized components
 * before genre-specific interpretation.
 */
export interface GameObjectCandidate {
  confidence?: number | undefined;
  height?: number | undefined;
  id: string;
  properties?: Record<string, unknown> | undefined;
  radius?: number | undefined;
  role: string;
  width?: number | undefined;
  x: number;
  y: number;
}

/**
 * Candidate rule inferred or selected during game understanding.
 */
export interface GameRuleCandidate {
  action?: string | undefined;
  category?: string | undefined;
  condition?: string | undefined;
  description: string;
  event?: string | undefined;
  id: string;
  name: string;
  parameters?: Record<string, unknown> | undefined;
}

/**
 * Intermediate semantic representation bridging raw detections/features
 * and genre-specific GameDefinition generators.
 */
export interface GameUnderstanding {
  confidence: number;
  gameType: GameType | "unknown";
  genreSpecificData?: Record<string, unknown> | undefined;
  objectCandidates: GameObjectCandidate[];
  ruleCandidates: GameRuleCandidate[];
  structuralFeatures?: StructuralFeatures | undefined;
}

/**
 * Input supplied to the Universal Game Generation pipeline.
 * Accepts drawings, uploaded sketches, detections, or manual configurations.
 */
export interface GameGenerationInput {
  canvas?: HTMLCanvasElement | null | undefined;
  genreSpecificData?: Record<string, unknown> | undefined;
  options?: Record<string, unknown> | undefined;
  predictions?: DetectionPrediction[] | undefined;
  projectId: string;
  projectName?: string | undefined;
  recognitionResult?: GameRecognitionResult | undefined;
  source: "drawing" | "upload" | "detection" | "manual";
  sourceDimensions?: { height: number; width: number } | undefined;
  targetGameType?: GameType | undefined;
}

/**
 * Non-blocking issue encountered during generation or validation.
 */
export interface GameGenerationWarning {
  code: string;
  entityId?: string | undefined;
  message: string;
  recoverable: boolean;
}

/**
 * Blocking issue preventing valid GameDefinition creation.
 */
export interface GameGenerationError {
  blocking: boolean;
  code: string;
  entityId?: string | undefined;
  message: string;
}

/**
 * Structured generation result returned by UniversalGameGenerator.
 */
export interface GameGenerationResult<TDef extends GameDefinition = GameDefinition> {
  confidence: number;
  errors: GameGenerationError[];
  gameDefinition: TDef | null;
  gameType: GameType | "unknown";
  isExtensionPoint: boolean;
  metadata: {
    generatedAt: string;
    generatorId: string;
    validationDurationMs?: number | undefined;
  };
  success: boolean;
  warnings: GameGenerationWarning[];
}
