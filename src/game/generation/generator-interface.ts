/**
 * DRAW2GAME — Phase 13: Universal Game Generation Architecture
 * Generator Interface Contract
 *
 * Establishes the standard interface for all genre-specific GameDefinition generators.
 */

import type { GameDefinition, GameType } from "@/game/core/game-definition";
import type {
  GameGenerationInput,
  GameGenerationResult,
  GameUnderstanding,
} from "./types";

export interface GameDefinitionGenerator<TDef extends GameDefinition = GameDefinition> {
  /**
   * Checks whether this generator can process the requested game type.
   */
  canHandle(gameType: string): boolean;

  /**
   * Primary genre identifier.
   */
  readonly gameType: GameType;

  /**
   * Transforms the input and intermediate understanding into a validated GameDefinition.
   */
  generate(
    input: GameGenerationInput,
    understanding: GameUnderstanding,
  ): GameGenerationResult<TDef>;

  /**
   * Unique identifier for this generator implementation.
   */
  readonly generatorId: string;
}
