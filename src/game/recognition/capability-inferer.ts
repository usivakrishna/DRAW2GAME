/**
 * DRAW2GAME — Phase 16: Advanced Sketch Understanding & Generation
 * Capability Inference Engine
 *
 * Infers required runtime capabilities from detected entities, interactions,
 * and layout geometry. Does NOT choose an engine; selects data-driven capabilities
 * for the UniversalGameEngine runtime systems.
 */

import {
  type GameCapability,
  inferCapabilities as coreInferCapabilities,
} from "@/game/core/game-capabilities";
import type { GameType } from "@/game/core/game-definition";
import type { DetectionPrediction } from "@/types/detection";
import type { InteractionInference } from "./interaction-types";
import type { LayoutStructure } from "./spatial-types";

export class CapabilityInferer {
  /**
   * Infers runtime capabilities from understanding signals.
   */
  public static inferCapabilities(
    gameType: GameType | "unknown",
    detections: DetectionPrediction[],
    interactions: InteractionInference[],
    layout: LayoutStructure,
  ): GameCapability[] {
    const caps = new Set<GameCapability>();

    // Baseline rule capability is always needed
    caps.add("rules");

    if (gameType === "chess" || layout.type === "grid-board") {
      caps.add("board");
      caps.add("grid");
      caps.add("turns");
      caps.add("scoring");
      return Array.from(caps);
    }

    if (gameType === "platformer" || layout.type === "side-scroller") {
      caps.add("physics");
      caps.add("gravity");
      caps.add("collision");
      caps.add("movement");
      caps.add("camera");
    }

    // Inspect interactions
    for (const inter of interactions) {
      if (inter.verb === "collidesWith") {
        caps.add("collision");
      }
      if (inter.verb === "moves" || inter.verb === "controlledBy") {
        caps.add("movement");
      }
      if (inter.verb === "collects") {
        caps.add("collectibles");
        caps.add("scoring");
      }
      if (inter.verb === "blocks" || inter.verb === "attacks") {
        caps.add("hazards");
      }
      if (inter.verb === "reaches") {
        caps.add("goals");
      }
    }

    // Inspect detected classes
    for (const d of detections) {
      const cls = d.category || d.className;
      if (cls === "coin") {
        caps.add("collectibles");
        caps.add("scoring");
      }
      if (cls === "spike" || cls === "enemy") {
        caps.add("hazards");
      }
      if (cls === "goal") {
        caps.add("goals");
      }
    }

    // Fallback to core helper if set is sparse
    if (caps.size <= 2 && gameType !== "unknown") {
      const fallback = coreInferCapabilities(gameType);
      fallback.forEach((c) => caps.add(c));
    }

    return Array.from(caps);
  }
}
