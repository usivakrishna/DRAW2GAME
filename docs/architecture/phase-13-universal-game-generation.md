# DRAW2GAME — Phase 13: Universal Game Generation Architecture

## Overview

Phase 13 establishes the foundational architecture required for **Universal Game Generation**.
It connects user input (drawing studio sketches, uploaded images, detections, or manual configurations) through an intermediate **Game Understanding** layer and modular **GameDefinition Generators** to produce valid, type-safe `GameDefinition` models for browser game engines.

> [!IMPORTANT]
> **Architecture Scope & Reality Boundary**:
> Phase 13 establishes the extensible architecture required for universal 2D game generation. It does **NOT** claim or imply that every arbitrary 2D game sketch is universally recognized or automatically inferred. Vision preprocessing and YOLO models currently detect platformer entities; structured chess generation accepts explicit board configurations or generates standard 32-piece tournament layouts; and future genres remain explicit architecture extension points.

---

## Universal Generation Pipeline

```
           Drawing Studio Canvas  OR  Uploaded Sketch Image
                                    │
                                    ▼
                         Computer Vision Analysis
                   (OpenCV Preprocessing + YOLO Detector)
                                    │
                                    ▼
                          Game Recognition
                  (GameRecognizer Genre Classifier)
                                    │
                                    ▼
                        Game Generation Input
                                    │
                                    ▼
                         Game Understanding
            (GameObjectCandidates, RuleCandidates, Topology)
                                    │
                                    ▼
                        UniversalGameGenerator
                          (Generator Registry)
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
   PlatformerGameGenerator   ChessGameGenerator   ExtensionPointGenerator
             │                      │                      │
             ▼                      ▼                      ▼
  PlatformerGameDefinition   ChessGameDefinition   ExtensionPointResult
             │                      │                  (Structured)
             └──────────────────────┼──────────────────────┘
                                    │
                                    ▼
                         Two-Tier Validation
               (Generic Validator + Genre Validator)
                                    │
                                    ▼
                          GameGenerationResult
                   (success, def, warnings, errors)
                                    │
                                    ▼
                           GameEngineFactory
             ┌──────────────────────┴──────────────────────┐
             ▼                                             ▼
      PlatformerEngine                                ChessEngine
    (Phaser 3 + Matter.js)                         (DOM/SVG Canvas)
```

---

## Core Generation Concepts

### 1. GameGenerationInput (`src/game/generation/types.ts`)
The universal input envelope supplied to the generator. It supports:
- `projectId` & `projectName`: Project isolation tracking.
- `source`: `"drawing" | "upload" | "detection" | "manual"`.
- `sourceDimensions`: Aspect ratio and resolution for coordinate mapping.
- `canvas`: Optional canvas element for pixel or CV analysis.
- `predictions`: Optional bounding-box detections.
- `recognitionResult`: Optional output from Phase 11 `GameRecognizer`.
- `targetGameType`: Explicit manual genre override when selected by the user.
- `genreSpecificData`: Structured piece, grid, or physics specifications.

### 2. GameUnderstanding (`src/game/generation/types.ts`)
An intermediate, genre-agnostic semantic model bridging raw signals to generator logic:
- `gameType`: Resolved game genre (`"platformer"`, `"chess"`, or extension point).
- `confidence`: Heuristic or structural confidence score.
- `objectCandidates`: Normalized candidates (`role`, `x`, `y`, `width`, `height`, `radius`, `properties`).
- `ruleCandidates`: Candidate gameplay rules and win/loss conditions.
- `structuralFeatures`: Geometric and topological metrics.

### 3. GameDefinitionGenerator (`src/game/generation/generator-interface.ts`)
The extensible generator abstraction:
```ts
export interface GameDefinitionGenerator<TDef extends GameDefinition = GameDefinition> {
  readonly generatorId: string;
  readonly gameType: GameType;
  canHandle(gameType: string): boolean;
  generate(input: GameGenerationInput, understanding: GameUnderstanding): GameGenerationResult<TDef>;
}
```

### 4. GameGenerationResult (`src/game/generation/types.ts`)
Structured, deterministic result returned by all generation workflows:
- `success`: Boolean indicating if a playable `GameDefinition` was generated.
- `gameDefinition`: The validated `GameDefinition` container (or `null` if blocked).
- `gameType`: Target or recognized game type.
- `confidence`: Confidence score.
- `warnings`: Array of recoverable `GameGenerationWarning` objects.
- `errors`: Array of blocking `GameGenerationError` objects.
- `isExtensionPoint`: Flag indicating a recognized future genre without an engine yet.
- `metadata`: Generation timestamp, generator ID, and validation duration.

---

## Game-Specific Generators

### 1. PlatformerGameGenerator (`src/game/generation/generators/platformer-generator.ts`)
- **Compatibility**: Adapts existing Phase 5 `convertDetectionsToLevel` and Phase 10 `levelDefinitionToGameDefinition`.
- **Integrity**: Preserves player spawn, platforms, coins, enemies, spikes, goal flags, physics constants, themes, and styles.
- **Validation**: Enforces player existence, positive dimensions, and world boundaries.

### 2. ChessGameGenerator (`src/game/generation/generators/chess-generator.ts`)
- **Capabilities**: Translates structured chess understanding (piece placements, board orientation, turn order) or constructs standard 32-piece tournament layouts.
- **Universal Projection**: Projects all chess pieces to generic `GameObject` entities (`type: "chess-piece"`).
- **Validation**: Enforces 8×8 board constraints, exactly 1 white king and 1 black king, 2–32 pieces, unique square occupancy (no collisions), and algebraic coordinate formats (`a1`–`h8`).

### 3. ExtensionPointGenerator (`src/game/generation/generators/extension-point-generator.ts`)
- **Scope**: Handles `ludo`, `pool`, `carrom`, `racing`, `puzzle`, `shooter`, `sports`.
- **Behavior**: Returns structured, non-fatal results (`isExtensionPoint: true`, `success: false`) with clear explanations for the user interface.

---

## Two-Tier Validation Layer

Before any generated `GameDefinition` reaches a runtime engine, it must pass a strict two-tier validation:

1. **Generic Validator (`GenericGameValidator`)**:
   - Validates canonical envelope structure (`id`, `name`, `gameType`, `version`, `viewport`, `engineConfig`, `objects`, `rules`, `settings`).
   - Prevents non-numeric coordinates or NaN dimensions.
2. **Genre-Specific Validator (`PlatformerValidator`, `ChessValidator`)**:
   - Validates genre domain rules (e.g. king safety in chess, player spawn in platformers).

---

## Recognition vs Generation vs Engine Separation

| Responsibility | Component | Question Answered |
| :--- | :--- | :--- |
| **Recognition** | `GameRecognizer` | *"What game type is this?"* |
| **Generation** | `UniversalGameGenerator` | *"How do I construct a valid GameDefinition for this game?"* |
| **Engine** | `GameEngineFactory` | *"How do I execute and run this GameDefinition in the browser?"* |

---

## Project Store Integration & Two-Way Sync

Generated definitions remain completely isolated by project in `src/store/project-store.ts`:
- `projectGameDefinitions: Record<string, GameDefinition>` stores universal definitions.
- Automatic two-way synchronization maintains 100% compatibility with existing `projectLevels` (Platformer) and `projectChessGames` (Chess).
- Full persistence across page reloads via `localStorage`.

---

## Future Editing Architecture Preparation

The generated `GameDefinition` acts as the canonical editable representation:
```
Generated GameDefinition → Universal Editor → Modified GameDefinition → Engine Reload
```
Because the generator outputs pure, serializable, and validated JSON data structures, future editing modules can safely mutate the definition and re-validate it through the same validation pipeline.
