/**
 * DRAW2GAME — Phase 13: Universal Game Generation Architecture
 * Platformer GameDefinition Validator
 *
 * Validates the platformer-specific components of a PlatformerGameDefinition,
 * ensuring player spawn, physics, platforms, and win condition integrity.
 */

import type { PlatformerGameDefinition } from "@/game/core/platformer-definition";
import { validateLevel } from "@/json/detection-to-level";
import type { ValidationIssue, ValidationResult } from "./validation-types";

export class PlatformerValidator {
  /**
   * Validates a PlatformerGameDefinition.
   */
  public static validate(gameDef: PlatformerGameDefinition): ValidationResult {
    const issues: ValidationIssue[] = [];

    // 1. Verify gameType
    if (gameDef.gameType !== "platformer") {
      issues.push({
        code: "INVALID_GENRE",
        message: `Expected gameType 'platformer', received '${gameDef.gameType}'.`,
        path: "gameType",
        severity: "error",
      });
      return {
        errors: issues.map((i) => i.message),
        isValid: false,
        issues,
        warnings: [],
      };
    }

    const payload = gameDef.typePayload;
    if (!payload) {
      issues.push({
        code: "MISSING_PAYLOAD",
        message: "PlatformerGameDefinition requires a 'typePayload' containing platformer entities.",
        path: "typePayload",
        severity: "error",
      });
      return {
        errors: issues.map((i) => i.message),
        isValid: false,
        issues,
        warnings: [],
      };
    }

    // 2. Player validation
    if (!payload.player) {
      issues.push({
        code: "PLAYER_MISSING",
        message: "Platformer requires a player spawn entity.",
        path: "typePayload.player",
        severity: "error",
      });
    } else {
      if (typeof payload.player.x !== "number" || typeof payload.player.y !== "number") {
        issues.push({
          code: "PLAYER_INVALID_COORDINATES",
          entityId: payload.player.id,
          message: "Player spawn coordinates must be valid numbers.",
          path: "typePayload.player",
          severity: "error",
        });
      }
      if (payload.player.width <= 0 || payload.player.height <= 0) {
        issues.push({
          code: "PLAYER_INVALID_DIMENSIONS",
          entityId: payload.player.id,
          message: `Player spawn has invalid dimensions (${payload.player.width}×${payload.player.height}).`,
          path: "typePayload.player",
          severity: "error",
        });
      }

      const worldW = payload.world?.width ?? gameDef.viewport.width;
      const worldH = payload.world?.height ?? gameDef.viewport.height;
      if (payload.player.x < 0 || payload.player.x > worldW || payload.player.y < 0 || payload.player.y > worldH) {
        issues.push({
          code: "PLAYER_OUT_OF_BOUNDS",
          entityId: payload.player.id,
          message: `Player spawn (x: ${payload.player.x}, y: ${payload.player.y}) is outside world bounds (${worldW}×${worldH}).`,
          path: "typePayload.player",
          severity: "warning",
        });
      }
    }

    // 3. Platforms validation
    if (!Array.isArray(payload.platforms) || payload.platforms.length === 0) {
      issues.push({
        code: "PLATFORMS_EMPTY",
        message: "No platforms found in level. Player may fall into pit immediately.",
        path: "typePayload.platforms",
        severity: "warning",
      });
    } else {
      for (const plat of payload.platforms) {
        if (plat.width <= 0 || plat.height <= 0) {
          issues.push({
            code: "PLATFORM_INVALID_DIMENSIONS",
            entityId: plat.id,
            message: `Platform "${plat.id}" has invalid dimensions (${plat.width}×${plat.height}).`,
            path: `typePayload.platforms[${plat.id}]`,
            severity: "error",
          });
        }
      }
    }

    // 4. Goal validation
    if (!payload.goal) {
      issues.push({
        code: "GOAL_MISSING",
        message: "No goal flag found in level. Level has no victory condition.",
        path: "typePayload.goal",
        severity: "warning",
      });
    }

    // 5. Physics validation
    if (!payload.physics) {
      issues.push({
        code: "PHYSICS_MISSING",
        message: "Platformer requires physics settings in typePayload.",
        path: "typePayload.physics",
        severity: "error",
      });
    } else if (payload.physics.gravityY <= 0) {
      issues.push({
        code: "INVALID_GRAVITY",
        message: "Gravity must be a positive number.",
        path: "typePayload.physics.gravityY",
        severity: "warning",
      });
    }

    // 6. Cross-validate with Phase 5 LevelDefinition validator if complete payload is present
    if (payload.player) {
      const levelLevelResult = validateLevel({
        coins: payload.coins ?? [],
        enemies: payload.enemies ?? [],
        gameMode: payload.gameMode ?? "single-screen",
        goal: payload.goal ?? null,
        metadata: gameDef.metadata,
        name: gameDef.name,
        physics: payload.physics,
        platforms: payload.platforms ?? [],
        player: payload.player,
        spikes: payload.spikes ?? [],
        version: gameDef.version,
        viewport: gameDef.viewport,
        world: payload.world,
      });

      // Incorporate any extra issues not already caught
      for (const extraIssue of levelLevelResult.issues) {
        if (!issues.some((i) => i.code === extraIssue.code)) {
          issues.push({
            code: extraIssue.code,
            entityId: extraIssue.entityId,
            message: extraIssue.message,
            severity: extraIssue.severity,
          });
        }
      }
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
