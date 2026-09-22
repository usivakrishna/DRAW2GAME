/**
 * DRAW2GAME — Phase 16: Advanced Sketch Understanding & Generation
 * GameUnderstanding Validator
 *
 * Validates the semantic GameUnderstanding model before passing it to
 * the UniversalGameGenerator.
 *
 * Detects:
 * - Missing required genre elements
 * - Invalid or orphaned object references in relationships & interactions
 * - Impossible geometry (non-positive dimensions, NaN coordinates)
 * - Invalid capability strings
 * - Malformed declarative rules
 */

import { isKnownCapability } from "@/game/core/game-capabilities";
import type { GameUnderstanding, GameUnderstandingDiagnostic } from "../types";

export interface UnderstandingValidationResult {
  diagnostics: GameUnderstandingDiagnostic[];
  errors: string[];
  isValid: boolean;
  warnings: string[];
}

export class UnderstandingValidator {
  public static validate(understanding: GameUnderstanding): UnderstandingValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const diagnostics: GameUnderstandingDiagnostic[] = [];

    const objectIds = new Set<string>();

    // 1. Validate Objects & Geometry
    for (const obj of understanding.objects) {
      if (!obj.id || obj.id.trim() === "") {
        errors.push("Detected candidate object has empty ID.");
        diagnostics.push({
          code: "INVALID_OBJECT_ID",
          message: "Candidate object must have a non-empty ID.",
          severity: "error",
        });
      } else if (objectIds.has(obj.id)) {
        errors.push(`Duplicate candidate object ID found: "${obj.id}".`);
        diagnostics.push({
          code: "DUPLICATE_OBJECT_ID",
          entityId: obj.id,
          message: `Object ID "${obj.id}" is duplicated.`,
          severity: "error",
        });
      } else {
        objectIds.add(obj.id);
      }

      if (isNaN(obj.x) || isNaN(obj.y)) {
        errors.push(`Candidate object "${obj.id}" has invalid coordinate (NaN).`);
        diagnostics.push({
          code: "INVALID_COORDINATES",
          entityId: obj.id,
          message: `Coordinates for "${obj.id}" are NaN.`,
          severity: "error",
        });
      }

      if ((obj.width !== undefined && obj.width <= 0) || (obj.height !== undefined && obj.height <= 0)) {
        errors.push(`Candidate object "${obj.id}" has impossible non-positive dimensions.`);
        diagnostics.push({
          code: "IMPOSSIBLE_GEOMETRY",
          entityId: obj.id,
          message: `Width and height must be strictly positive for "${obj.id}".`,
          severity: "error",
        });
      }
    }

    // 2. Validate Spatial Relationships
    for (const rel of understanding.relationships) {
      if (!objectIds.has(rel.subjectId)) {
        errors.push(`Relationship "${rel.id}" references non-existent subject ID "${rel.subjectId}".`);
        diagnostics.push({
          code: "ORPHANED_RELATIONSHIP_SUBJECT",
          entityId: rel.id,
          message: `Subject "${rel.subjectId}" is not present in objects list.`,
          severity: "error",
        });
      }
      if (!objectIds.has(rel.targetId)) {
        errors.push(`Relationship "${rel.id}" references non-existent target ID "${rel.targetId}".`);
        diagnostics.push({
          code: "ORPHANED_RELATIONSHIP_TARGET",
          entityId: rel.id,
          message: `Target "${rel.targetId}" is not present in objects list.`,
          severity: "error",
        });
      }
      if (rel.confidence < 0 || rel.confidence > 1) {
        warnings.push(`Relationship "${rel.id}" confidence ${rel.confidence} is outside [0, 1].`);
        diagnostics.push({
          code: "INVALID_CONFIDENCE_RANGE",
          entityId: rel.id,
          message: `Confidence ${rel.confidence} should be normalized between 0 and 1.`,
          severity: "warning",
        });
      }
    }

    // 3. Validate Interactions
    for (const inter of understanding.interactions) {
      if (!objectIds.has(inter.subjectId)) {
        errors.push(`Interaction "${inter.id}" references non-existent subject ID "${inter.subjectId}".`);
        diagnostics.push({
          code: "ORPHANED_INTERACTION_SUBJECT",
          entityId: inter.id,
          message: `Interaction subject "${inter.subjectId}" not found.`,
          severity: "error",
        });
      }
      if (inter.targetId && !objectIds.has(inter.targetId)) {
        errors.push(`Interaction "${inter.id}" references non-existent target ID "${inter.targetId}".`);
        diagnostics.push({
          code: "ORPHANED_INTERACTION_TARGET",
          entityId: inter.id,
          message: `Interaction target "${inter.targetId}" not found.`,
          severity: "error",
        });
      }
    }

    // 4. Validate Capabilities
    for (const cap of understanding.capabilities) {
      if (!isKnownCapability(cap)) {
        errors.push(`Unknown capability "${cap}" specified in GameUnderstanding.`);
        diagnostics.push({
          code: "UNKNOWN_CAPABILITY",
          message: `Capability "${cap}" is not supported by UniversalGameEngine.`,
          severity: "error",
        });
      }
    }

    // 5. Validate Declarative Rules
    for (const rule of understanding.rules) {
      if (!rule.id || !rule.name) {
        errors.push("Rule candidate is missing required id or name.");
        diagnostics.push({
          code: "MALFORMED_RULE",
          message: "Rules must have non-empty id and name.",
          severity: "error",
        });
      }
    }

    // 6. Playability Checks
    if (understanding.gameType === "platformer") {
      const hasPlayer = understanding.objects.some((o) => o.role === "player");
      const hasPlatform = understanding.objects.some((o) => o.role === "platform");
      const hasGoal = understanding.objects.some((o) => o.role === "goal");

      if (!hasPlayer) {
        warnings.push("No player spawn detected in platformer understanding (synthesis will be required).");
        diagnostics.push({
          code: "MISSING_PLAYER_SPAWN",
          message: "No player spawn candidate found in sketch.",
          severity: "warning",
        });
      }
      if (!hasPlatform) {
        warnings.push("No platform surfaces detected in platformer understanding (ground synthesis will be required).");
        diagnostics.push({
          code: "MISSING_PLATFORM",
          message: "No platforms found in sketch.",
          severity: "warning",
        });
      }
      if (!hasGoal) {
        warnings.push("No goal flag detected in platformer understanding (goal synthesis will be required).");
        diagnostics.push({
          code: "MISSING_GOAL",
          message: "No goal flag found in sketch.",
          severity: "warning",
        });
      }
    }

    return {
      diagnostics,
      errors,
      isValid: errors.length === 0,
      warnings,
    };
  }
}
