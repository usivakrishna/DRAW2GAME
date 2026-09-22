/**
 * DRAW2GAME — Phase 16: Advanced Sketch Understanding & Generation
 * Interaction Inference Engine
 *
 * Infers declarative physical, collision, and gameplay interactions from
 * detected entity roles, spatial relationships, and layout context.
 *
 * Adheres strictly to honest, evidence-backed confidence scoring.
 */

import {
  type DetectionPrediction,
  normalizeDetectionPrediction,
} from "@/types/detection";
import type { InteractionInference } from "./interaction-types";
import type { SpatialRelationship } from "./spatial-types";

export class InteractionInferer {
  /**
   * Infers interaction relationships between detected objects.
   */
  public static inferInteractions(
    rawDetections: DetectionPrediction[],
    relationships: SpatialRelationship[],
  ): InteractionInference[] {
    const detections = rawDetections.map((d) => normalizeDetectionPrediction(d));
    const interactions: InteractionInference[] = [];

    const players = detections.filter((d) => d.className === "player" || d.category === "player");
    const platforms = detections.filter((d) => d.className === "platform" || d.category === "platform");
    const coins = detections.filter((d) => d.className === "coin" || d.category === "coin");
    const goals = detections.filter((d) => d.className === "goal" || d.category === "goal");
    const spikes = detections.filter((d) => d.className === "spike" || d.category === "spike");
    const enemies = detections.filter((d) => d.className === "enemy" || d.category === "enemy");
    const chessPieces = detections.filter(
      (d) => d.className.startsWith("chess-") || (d.category && d.category.startsWith("chess-")),
    );

    // 1. Player controls & movement
    for (const p of players) {
      interactions.push({
        confidence: p.confidence,
        evidence: "Player entity is bound to keyboard/touch controls",
        id: `int_${p.id}_controlledBy_user`,
        source: "interaction-inference",
        subjectId: p.id,
        verb: "controlledBy",
      });

      interactions.push({
        confidence: p.confidence,
        evidence: "Player traverses the level with velocity and jump kinematics",
        id: `int_${p.id}_moves`,
        source: "interaction-inference",
        subjectId: p.id,
        verb: "moves",
      });

      // Player collides with platforms
      for (const plat of platforms) {
        const isRelated = relationships.some(
          (r) =>
            (r.subjectId === p.id && r.targetId === plat.id && (r.relation === "above" || r.relation === "near" || r.relation === "alignedWithVertical")) ||
            (r.subjectId === plat.id && r.targetId === p.id && r.relation === "below"),
        );

        const confidence = isRelated ? 0.95 : 0.85;
        interactions.push({
          confidence,
          evidence: isRelated
            ? `Player is positioned directly above platform ${plat.id}`
            : "Platform surface provides solid ground collision",
          id: `int_${p.id}_collidesWith_${plat.id}`,
          source: "interaction-inference",
          subjectId: p.id,
          targetId: plat.id,
          verb: "collidesWith",
        });
      }

      // Player collects coins
      for (const c of coins) {
        const isNear = relationships.some(
          (r) => (r.subjectId === p.id && r.targetId === c.id) && (r.relation === "near" || r.relation === "overlaps"),
        );
        interactions.push({
          confidence: Math.min(0.95, c.confidence * (isNear ? 1.0 : 0.85)),
          evidence: "Player overlap with collectible coin increments score",
          id: `int_${p.id}_collects_${c.id}`,
          source: "interaction-inference",
          subjectId: p.id,
          targetId: c.id,
          verb: "collects",
        });
      }

      // Player reaches goal
      for (const g of goals) {
        interactions.push({
          confidence: Math.min(0.95, g.confidence * 0.9),
          evidence: "Player arrival at finish goal triggers level completion",
          id: `int_${p.id}_reaches_${g.id}`,
          source: "interaction-inference",
          subjectId: p.id,
          targetId: g.id,
          verb: "reaches",
        });
      }

      // Hazards blocking or attacking player
      for (const s of spikes) {
        interactions.push({
          confidence: Math.min(0.95, s.confidence * 0.9),
          evidence: "Hazard spikes inflict lethal collision on player contact",
          id: `int_${s.id}_blocks_${p.id}`,
          source: "interaction-inference",
          subjectId: s.id,
          targetId: p.id,
          verb: "blocks",
        });
      }

      for (const e of enemies) {
        interactions.push({
          confidence: Math.min(0.95, e.confidence * 0.85),
          evidence: "Mobile enemy damages player upon contact",
          id: `int_${e.id}_attacks_${p.id}`,
          source: "interaction-inference",
          subjectId: e.id,
          targetId: p.id,
          verb: "attacks",
        });
      }
    }

    // 2. Chess piece interactions
    for (const cp of chessPieces) {
      interactions.push({
        confidence: cp.confidence || 0.9,
        evidence: "Board piece moves according to standard piece kinematics",
        id: `int_${cp.id}_moves`,
        source: "interaction-inference",
        subjectId: cp.id,
        verb: "moves",
      });

      interactions.push({
        confidence: cp.confidence || 0.85,
        evidence: "Piece captures opposing pieces landing on target square",
        id: `int_${cp.id}_captures`,
        source: "interaction-inference",
        subjectId: cp.id,
        verb: "captures",
      });
    }

    return interactions;
  }
}
