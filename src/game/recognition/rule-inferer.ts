/**
 * DRAW2GAME — Phase 16: Advanced Sketch Understanding & Generation
 * Declarative Rule Inference Engine
 *
 * Infers declarative gameplay rules (win, loss, scoring, movement, turns)
 * from inferred interactions and structural layout.
 *
 * Does NOT execute rules during inference; outputs structured data for runtime systems.
 */

import type { GameType } from "@/game/core/game-definition";
import type { InferredRule } from "./interaction-types";
import type { InteractionInference } from "./interaction-types";
import type { LayoutStructure } from "./spatial-types";

export class RuleInferer {
  /**
   * Infers declarative rules from interactions and layout.
   */
  public static inferRules(
    gameType: GameType | "unknown",
    interactions: InteractionInference[],
    layout: LayoutStructure,
  ): InferredRule[] {
    const rules: InferredRule[] = [];

    // 1. Win Conditions
    const hasReachGoal = interactions.some((i) => i.verb === "reaches");
    if (hasReachGoal || gameType === "platformer") {
      rules.push({
        action: "COMPLETE_LEVEL",
        category: "win",
        condition: "player REACH_GOAL",
        confidence: hasReachGoal ? 0.95 : 0.8,
        description: "Reaching the goal flag completes the level.",
        id: "rule_win_goal",
        name: "Goal Arrival Victory",
        source: "rule-inference",
      });
    }

    if (gameType === "chess") {
      rules.push({
        action: "END_GAME_VICTORY",
        category: "win",
        condition: "king IN_CHECKMATE",
        confidence: 1.0,
        description: "Checkmating the opponent's king wins the match.",
        id: "rule_win_checkmate",
        name: "Checkmate Victory",
        source: "rule-inference",
      });
    }

    // 2. Loss Conditions
    const hasHazards = interactions.some(
      (i) => i.verb === "blocks" || i.verb === "attacks",
    );
    if (hasHazards || gameType === "platformer") {
      rules.push({
        action: "RESTART_OR_RESPAWN",
        category: "loss",
        condition: "player TOUCH_HAZARD",
        confidence: hasHazards ? 0.95 : 0.8,
        description: "Touching spikes or falling into hazards loses a life.",
        id: "rule_loss_hazard",
        name: "Hazard Lethal Touch",
        source: "rule-inference",
      });

      rules.push({
        action: "RESPAWN_AT_START",
        category: "loss",
        condition: "player FALL_OUT_OF_BOUNDS",
        confidence: 0.9,
        description: "Falling below the level bottom boundary respawns the player.",
        id: "rule_loss_pit",
        name: "Out of Bounds Respawn",
        source: "rule-inference",
      });
    }

    // 3. Scoring Rules
    const hasCollectibles = interactions.some((i) => i.verb === "collects");
    if (hasCollectibles) {
      rules.push({
        action: "ADD_SCORE 10",
        category: "scoring",
        condition: "player COLLECT_COIN",
        confidence: 0.9,
        description: "Collecting coins awards bonus points.",
        id: "rule_score_coins",
        name: "Coin Collection Bonus",
        source: "rule-inference",
      });
    }

    // 4. Movement & Turn Rules
    if (gameType === "platformer" || layout.type === "side-scroller") {
      rules.push({
        action: "APPLY_VELOCITY_AND_GRAVITY",
        category: "movement",
        condition: "player INPUT_AXIS",
        confidence: 0.95,
        description: "Arrow keys or WASD control lateral motion and jumping under gravity.",
        id: "rule_move_platformer",
        name: "Platformer Kinematics",
        source: "rule-inference",
      });
    }

    if (gameType === "chess" || layout.type === "grid-board") {
      rules.push({
        action: "SWITCH_TURN",
        category: "turn",
        condition: "player EXECUTE_LEGAL_MOVE",
        confidence: 0.95,
        description: "White and Black alternate turns executing legal piece moves on the board.",
        id: "rule_turn_alternating",
        name: "Turn-Based Progression",
        source: "rule-inference",
      });
    }

    return rules;
  }
}
