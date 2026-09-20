/**
 * DRAW2GAME — Universal Game Engine Architecture
 * Rule System
 *
 * Evaluates declarative GameRules from GameDefinition.
 * Executes game actions (score increase, game over, victory, custom actions)
 * when matching events or conditions occur.
 */

import type { GameRule } from "@/game/core/game-definition";

export type RuleActionHandler = (rule: GameRule, context?: unknown) => void;

export interface RuleExecutionResult {
  actionExecuted?: string | undefined;
  matchedRules: GameRule[];
  ruleCount: number;
}

export class RuleSystem {
  private rules: Map<string, GameRule> = new Map();
  private actionHandlers: Map<string, RuleActionHandler> = new Map();

  constructor(initialRules: GameRule[] = []) {
    this.loadRules(initialRules);
  }

  public loadRules(rules: GameRule[]): void {
    this.rules.clear();
    for (const r of rules) {
      this.rules.set(r.id, r);
    }
  }

  public addRule(rule: GameRule): void {
    this.rules.set(rule.id, rule);
  }

  public removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  public getRules(): GameRule[] {
    return Array.from(this.rules.values());
  }

  public registerActionHandler(actionName: string, handler: RuleActionHandler): void {
    this.actionHandlers.set(actionName, handler);
  }

  public unregisterActionHandler(actionName: string): void {
    this.actionHandlers.delete(actionName);
  }

  /**
   * Evaluates rules against an event name and triggers registered action handlers.
   */
  public triggerEvent(eventName: string, context?: unknown): RuleExecutionResult {
    const matched: GameRule[] = [];

    for (const rule of this.rules.values()) {
      if (rule.event === eventName || rule.condition === eventName) {
        matched.push(rule);
        if (rule.action) {
          const handler = this.actionHandlers.get(rule.action);
          if (handler) {
            handler(rule, context);
          }
        }
      }
    }

    return {
      matchedRules: matched,
      ruleCount: matched.length,
    };
  }

  /**
   * Executes a specific rule by ID directly.
   */
  public executeRule(ruleId: string, context?: unknown): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.action) return false;

    const handler = this.actionHandlers.get(rule.action);
    if (handler) {
      handler(rule, context);
      return true;
    }
    return false;
  }

  public destroy(): void {
    this.rules.clear();
    this.actionHandlers.clear();
  }
}
