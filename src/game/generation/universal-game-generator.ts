/**
 * DRAW2GAME — Phase 13: Universal Game Generation Architecture
 * Universal Game Generator Service
 *
 * Master orchestrator responsible for:
 * 1. Receiving generation input (canvas, sketch, detections, manual).
 * 2. Extracting intermediate GameUnderstanding.
 * 3. Selecting the appropriate GameDefinitionGenerator from registry.
 * 4. Executing generation and validation.
 * 5. Returning structured GameGenerationResult.
 *
 * Adheres strictly to separation of concerns:
 * - NO Phaser code
 * - NO Chess UI code
 * - NO React DOM code
 * - NO fake AI or simulated detections
 */

import type { GameDefinition } from "@/game/core/game-definition";
import { GameUnderstandingExtractor } from "./game-understanding";
import type { GameDefinitionGenerator } from "./generator-interface";
import { ChessGameGenerator } from "./generators/chess-generator";
import { ExtensionPointGenerator } from "./generators/extension-point-generator";
import { PlatformerGameGenerator } from "./generators/platformer-generator";
import type {
  GameGenerationInput,
  GameGenerationResult,
  GameUnderstanding,
} from "./types";

export class UniversalGameGenerator {
  private static generators: GameDefinitionGenerator[] = [
    new PlatformerGameGenerator(),
    new ChessGameGenerator(),
    new ExtensionPointGenerator(),
  ];

  /**
   * Registers a custom generator (e.g. For future plugin or engine extensions).
   */
  public static registerGenerator(generator: GameDefinitionGenerator): void {
    this.generators.unshift(generator); // Prepend to allow overriding defaults
  }

  /**
   * Removes a registered generator by its ID.
   */
  public static unregisterGenerator(generatorId: string): void {
    this.generators = this.generators.filter((g) => g.generatorId !== generatorId);
  }

  /**
   * Resets generator registry back to built-in defaults.
   */
  public static resetGenerators(): void {
    this.generators = [
      new PlatformerGameGenerator(),
      new ChessGameGenerator(),
      new ExtensionPointGenerator(),
    ];
  }

  /**
   * Returns list of currently registered generators.
   */
  public static getRegisteredGenerators(): readonly GameDefinitionGenerator[] {
    return [...this.generators];
  }

  /**
   * Resolves the matching generator for a game type.
   */
  public static findGenerator(gameType: string): GameDefinitionGenerator | undefined {
    return this.generators.find((g) => g.canHandle(gameType));
  }

  /**
   * Main entry point: Generates a complete, validated GameDefinition
   * from any supported input representation.
   */
  public static generateGame<TDef extends GameDefinition = GameDefinition>(
    input: GameGenerationInput,
  ): GameGenerationResult<TDef> {
    const startTime = Date.now();

    // 1. Extract intermediate understanding
    const understanding: GameUnderstanding = GameUnderstandingExtractor.extract(input);

    const targetType = input.targetGameType ?? understanding.gameType;

    // 2. Handle unknown / ambiguous genre
    if (targetType === "unknown") {
      return {
        confidence: understanding.confidence,
        errors: [
          {
            blocking: true,
            code: "GAME_TYPE_UNKNOWN",
            message:
              "Game type could not be determined confidently. Select a game type manually to proceed.",
          },
        ],
        gameDefinition: null,
        gameType: "unknown",
        isExtensionPoint: false,
        metadata: {
          generatedAt: new Date().toISOString(),
          generatorId: "none",
          validationDurationMs: Date.now() - startTime,
        },
        success: false,
        warnings: [
          {
            code: "LOW_CONFIDENCE_RECOGNITION",
            message: "Visual features did not match a known genre profile.",
            recoverable: false,
          },
        ],
      };
    }

    // 3. Find matching generator
    const generator = this.findGenerator(targetType);
    if (!generator) {
      return {
        confidence: understanding.confidence,
        errors: [
          {
            blocking: true,
            code: "NO_GENERATOR_AVAILABLE",
            message: `No generator is registered that can handle game type '${targetType}'.`,
          },
        ],
        gameDefinition: null,
        gameType: targetType,
        isExtensionPoint: false,
        metadata: {
          generatedAt: new Date().toISOString(),
          generatorId: "none",
          validationDurationMs: Date.now() - startTime,
        },
        success: false,
        warnings: [],
      };
    }

    // 4. Delegate to genre-specific generator
    return generator.generate(input, understanding) as GameGenerationResult<TDef>;
  }
}
