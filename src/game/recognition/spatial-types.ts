/**
 * DRAW2GAME — Phase 16: Advanced Sketch Understanding & Generation
 * Spatial Relationship & Object Grouping Type Definitions
 */

import type { DetectionBoundingBox } from "@/types/detection";

export type SpatialRelationType =
  | "above"
  | "below"
  | "leftOf"
  | "rightOf"
  | "overlaps"
  | "contains"
  | "alignedWithHorizontal"
  | "alignedWithVertical"
  | "near"
  | "far"
  | "connectedTo";

export interface SpatialRelationship {
  confidence: number;
  distance?: number | undefined;
  id: string;
  overlapRatio?: number | undefined;
  relation: SpatialRelationType;
  subjectId: string;
  targetId: string;
}

export type ObjectGroupType =
  | "row"
  | "column"
  | "grid"
  | "cluster"
  | "repeated";

export interface ObjectGroup {
  bounds: DetectionBoundingBox;
  id: string;
  objectIds: string[];
  properties?: Record<string, unknown> | undefined;
  type: ObjectGroupType;
}

export type LayoutStructureType =
  | "side-scroller"
  | "grid-board"
  | "arena"
  | "freeform"
  | "unknown";

export interface LayoutStructure {
  bounds: DetectionBoundingBox;
  confidence: number;
  evidence: string[];
  groups: ObjectGroup[];
  type: LayoutStructureType;
}
