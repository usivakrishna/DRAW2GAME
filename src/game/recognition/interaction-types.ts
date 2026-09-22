/**
 * DRAW2GAME — Phase 16: Advanced Sketch Understanding & Generation
 * Interaction & Rule Inference Type Definitions
 */

export type InteractionVerb =
  | "moves"
  | "collidesWith"
  | "collects"
  | "reaches"
  | "attacks"
  | "captures"
  | "blocks"
  | "triggers"
  | "belongsTo"
  | "follows"
  | "controlledBy";

export interface InteractionInference {
  confidence: number;
  evidence: string;
  id: string;
  properties?: Record<string, unknown> | undefined;
  source: string;
  subjectId: string;
  targetId?: string | undefined;
  verb: InteractionVerb;
}

export type InferredRuleCategory =
  | "win"
  | "loss"
  | "movement"
  | "scoring"
  | "turn"
  | "collision";

export interface InferredRule {
  action: string;
  category: InferredRuleCategory;
  condition: string;
  confidence: number;
  description: string;
  id: string;
  name: string;
  source: string;
}
