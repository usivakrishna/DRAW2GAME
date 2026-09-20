/**
 * DRAW2GAME — Phase 13: Universal Game Generation Architecture
 * Generic GameDefinition Envelope Validator
 *
 * Validates the core structure common to all 2D games:
 * id, name, gameType, version, viewport, engineConfig, objects, rules, settings.
 */

import {
  type GameDefinition,
  isKnownGameType,
} from "@/game/core/game-definition";
import type { ValidationIssue, ValidationResult } from "./validation-types";

export class GenericGameValidator {
  /**
   * Validates the generic envelope of a GameDefinition.
   */
  public static validate(gameDef: unknown): ValidationResult {
    const issues: ValidationIssue[] = [];

    if (!gameDef || typeof gameDef !== "object") {
      return {
        errors: ["GameDefinition must be a valid non-null object."],
        isValid: false,
        issues: [
          {
            code: "INVALID_STRUCTURE",
            message: "GameDefinition must be a valid non-null object.",
            severity: "error",
          },
        ],
        warnings: [],
      };
    }

    const def = gameDef as Partial<GameDefinition>;

    // 1. ID & Name
    if (!def.id || typeof def.id !== "string" || def.id.trim().length === 0) {
      issues.push({
        code: "INVALID_ID",
        message: "GameDefinition must have a non-empty string 'id'.",
        path: "id",
        severity: "error",
      });
    }

    if (!def.name || typeof def.name !== "string" || def.name.trim().length === 0) {
      issues.push({
        code: "INVALID_NAME",
        message: "GameDefinition must have a non-empty string 'name'.",
        path: "name",
        severity: "error",
      });
    }

    // 2. GameType
    if (!def.gameType || typeof def.gameType !== "string") {
      issues.push({
        code: "MISSING_GAME_TYPE",
        message: "GameDefinition must specify a 'gameType'.",
        path: "gameType",
        severity: "error",
      });
    } else if (!isKnownGameType(def.gameType)) {
      issues.push({
        code: "UNKNOWN_GAME_TYPE",
        message: `GameDefinition has unrecognized gameType: "${def.gameType}".`,
        path: "gameType",
        severity: "error",
      });
    }

    // 3. Version
    if (typeof def.version !== "number" || def.version <= 0 || !Number.isInteger(def.version)) {
      issues.push({
        code: "INVALID_VERSION",
        message: "GameDefinition version must be a positive integer.",
        path: "version",
        severity: "error",
      });
    }

    // 4. Viewport
    if (!def.viewport || typeof def.viewport !== "object") {
      issues.push({
        code: "MISSING_VIEWPORT",
        message: "GameDefinition requires a 'viewport' object.",
        path: "viewport",
        severity: "error",
      });
    } else {
      if (typeof def.viewport.width !== "number" || def.viewport.width <= 0) {
        issues.push({
          code: "INVALID_VIEWPORT_WIDTH",
          message: "Viewport width must be a positive number.",
          path: "viewport.width",
          severity: "error",
        });
      }
      if (typeof def.viewport.height !== "number" || def.viewport.height <= 0) {
        issues.push({
          code: "INVALID_VIEWPORT_HEIGHT",
          message: "Viewport height must be a positive number.",
          path: "viewport.height",
          severity: "error",
        });
      }
    }

    // 5. EngineConfig
    if (!def.engineConfig || typeof def.engineConfig !== "object") {
      issues.push({
        code: "MISSING_ENGINE_CONFIG",
        message: "GameDefinition requires an 'engineConfig' object.",
        path: "engineConfig",
        severity: "error",
      });
    } else if (!def.engineConfig.engineId || typeof def.engineConfig.engineId !== "string") {
      issues.push({
        code: "MISSING_ENGINE_ID",
        message: "engineConfig requires a non-empty string 'engineId'.",
        path: "engineConfig.engineId",
        severity: "error",
      });
    }

    // 6. Objects Array
    if (!Array.isArray(def.objects)) {
      issues.push({
        code: "INVALID_OBJECTS",
        message: "GameDefinition 'objects' must be an array.",
        path: "objects",
        severity: "error",
      });
    } else {
      const seenIds = new Set<string>();
      for (let i = 0; i < def.objects.length; i++) {
        const obj = def.objects[i];
        if (!obj || typeof obj !== "object") {
          issues.push({
            code: "INVALID_OBJECT_ENTRY",
            message: `Object at index ${i} is not a valid object.`,
            path: `objects[${i}]`,
            severity: "error",
          });
          continue;
        }

        if (!obj.id || typeof obj.id !== "string") {
          issues.push({
            code: "OBJECT_MISSING_ID",
            message: `Object at index ${i} is missing an 'id'.`,
            path: `objects[${i}].id`,
            severity: "error",
          });
        } else {
          if (seenIds.has(obj.id)) {
            issues.push({
              code: "DUPLICATE_OBJECT_ID",
              entityId: obj.id,
              message: `Duplicate object id "${obj.id}" found in objects list.`,
              path: `objects[${i}].id`,
              severity: "warning",
            });
          }
          seenIds.add(obj.id);
        }

        if (typeof obj.x !== "number" || isNaN(obj.x) || typeof obj.y !== "number" || isNaN(obj.y)) {
          issues.push({
            code: "OBJECT_INVALID_COORDINATES",
            entityId: obj.id,
            message: `Object "${obj.id || i}" has non-numeric coordinates (x: ${obj.x}, y: ${obj.y}).`,
            path: `objects[${i}]`,
            severity: "error",
          });
        }
      }
    }

    // 7. Rules Array
    if (!Array.isArray(def.rules)) {
      issues.push({
        code: "INVALID_RULES",
        message: "GameDefinition 'rules' must be an array.",
        path: "rules",
        severity: "error",
      });
    }

    // 8. Settings Object
    if (!def.settings || typeof def.settings !== "object") {
      issues.push({
        code: "MISSING_SETTINGS",
        message: "GameDefinition requires a 'settings' object.",
        path: "settings",
        severity: "error",
      });
    }

    const errors = issues.filter((i) => i.severity === "error").map((i) => i.message);
    const warnings = issues.filter((i) => i.severity === "warning").map((i) => i.message);

    return {
      errors,
      isValid: errors.length === 0,
      issues,
      warnings,
    };
  }
}
