/**
 * DRAW2GAME — Universal Game Engine Architecture
 * Win Condition System
 *
 * Evaluates win/loss outcomes based on game rules, goals, hazards,
 * or board state evaluation.
 */

export type GameOutcome = "continue" | "win" | "lose" | "draw";

export interface WinConditionEvaluation {
  details?: string | undefined;
  outcome: GameOutcome;
  winner?: string | undefined;
}

export type WinConditionEvaluator = () => WinConditionEvaluation;

export class WinConditionSystem {
  private evaluators: WinConditionEvaluator[] = [];

  public registerEvaluator(evaluator: WinConditionEvaluator): void {
    this.evaluators.push(evaluator);
  }

  public evaluate(): WinConditionEvaluation {
    for (const evaluator of this.evaluators) {
      const result = evaluator();
      if (result.outcome !== "continue") {
        return result;
      }
    }
    return { outcome: "continue" };
  }

  public clear(): void {
    this.evaluators = [];
  }

  public destroy(): void {
    this.clear();
  }
}
