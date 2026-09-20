# DRAW2GAME — Phase 11: Game Recognition & Game-Type Detection Architecture

## Overview

Phase 11 introduces a modular, explainable, and extensible **Game Recognition** layer into DRAW2GAME.
The system analyzes user sketches, preprocessed images, and detection predictions to classify the input into the most likely 2D game type (e.g. Platformer, Chess, Ludo, Pool, Carrom, Racing, Puzzle, Shooter, Sports, or Unknown).

Crucially, Phase 11 strictly enforces the distinction between **Recognized** and **Playable**:
- **Playable**: Only `PlatformerEngine` is implemented and playable today.
- **Recognized (Extension Points)**: Chess, Ludo, Pool, Carrom, Racing, Puzzle, Shooter, and Sports are architectural extension points whose layouts are recognized, but whose engines are scheduled for future phases.

```
Sketch / Upload Image / Detections
              │
              ▼
   Feature Extraction Engine
  (Geometry, Topology, Bounds)
              │
              ▼
        GameRecognizer
  (Modular Genre Evaluators)
              │
              ▼
   GameRecognitionResult
(GameType + Confidence + Evidence)
              │
              ▼
       GameEngineFactory
              │
       ┌──────┴──────┐
       │             │
PlatformerEngine   Extension Point Notice
  (PLAYABLE)     (Chess, Ludo, Pool, etc.)
```

---

## Core Components

### 1. Structural Feature Extractor (`src/game/recognition/feature-extractor.ts`)

Instead of relying on fabricated black-box AI predictions, the feature extraction layer deterministically derives structural layout metrics from available visual and spatial signals:
- **Aspect Ratio & Boundary Dimensions**: Detects square boards (~1:1), billiard tables (~2:1), and wide platformer stages (16:9 or wider).
- **Geometric Segments**: Counts horizontal platform-like structures, vertical walls, and ground baselines.
- **Topological Tiers**: Identifies vertical separation across distinct elevations (indicative of jump/traversal gameplay).
- **Entity Distributions**: Checks for player spawn and goal destination pairings, hazard distributions, and collectible tokens.
- **Board & Matrix Topology**: Identifies dense grid matrices (8×8 chessboards), 4-quadrant symmetry (Ludo home bases), perimeter pockets (Pool/Carrom), and closed-loop circuits (Racing tracks).

### 2. Modular Genre Recognizers (`src/game/recognition/recognizers/`)

Each genre is implemented as a self-contained recognizer module implementing `RecognizerModule`:

| Module | Target Genre | Primary Structural Signals |
|---|---|---|
| `PlatformerRecognizer` | `platformer` | Horizontal platforms, vertical tiering, player spawn, goal marker, spikes/coins |
| `ChessRecognizer` | `chess` | Square boundary (~1:1), 8×8 grid structure (64 cells), alternating tile density |
| `LudoRecognizer` | `ludo` | Square board (~1:1), 4 symmetric corner home quadrants, central goal zone |
| `PoolRecognizer` | `pool` | Rectangular ~2:1 table layout, 4–6 perimeter pockets, billiard balls |
| `CarromRecognizer` | `carrom` | Square board (~1:1), 4 corner pockets, central circular striking ring |
| `RacingRecognizer` | `racing` | Closed-loop circuit road track, lane boundaries, start/finish line |
| `PuzzleRecognizer` | `puzzle` | Discrete matching tile patterns, non-8×8 block partitions |
| `ShooterRecognizer` | `shooter` | Aiming crosshairs/reticles, player facing clustered opposing targets |
| `SportsRecognizer` | `sports` | Rectangular pitch/court boundaries, two opposing goal/basket zones, ball token |

### 3. Master Game Recognizer (`src/game/recognition/game-recognizer.ts`)

Coordinates analysis across all registered recognizer modules:
1. **Confidence Calculation**: Evaluates cumulative structural evidence for each genre candidate (0.0 to 1.0).
2. **Ambiguity Resolution**:
   - If confidence is below 0.40, returns `gameType: "unknown"` with clear advice.
   - If the top two candidates have close scores (difference < 0.12 with moderate confidence), declares an ambiguous match and suggests manual selection.
3. **Manual Override**: If the user has manually selected a game type, overrides automatic detection with 100% confidence while noting manual selection in the metadata.

---

## User-Facing UI Integration

### 1. Detection Page (`src/components/detection/GameRecognitionPanel.tsx`)
Rendered on the Detection Page (`/projects/:projectId/detect`):
- **Recognition Status**: Displays detected genre, confidence meter, and status badge (`Playable`, `Coming in Future Phase`, or `Uncertain`).
- **Explainable Evidence**: Bulleted list of all detected visual features that contributed to the score.
- **Warnings & Guidance**: Highlights missing game elements or provides helpful next steps.
- **Manual Override Dropdown**: Allows instant selection of any supported or extension genre, or resetting back to Auto-Detect.

### 2. Game Page (`src/pages/GamePage.tsx`)
Queries `GameEngineFactory.createEngine(effectiveGameType)`:
- If `platformer`: Launches `PlatformerEngine` on Phaser 3 + Matter.js.
- If an extension point (e.g. `chess`): Displays a dedicated informative screen explaining that the layout was recognized, but the gameplay engine is scheduled for future phases, with a 1-click option to switch to Platformer.

---

## Project Store Persistence (`src/store/project-store.ts`)

Recognition results are persisted per project under `projectRecognitions`:
```typescript
interface GameRecognitionRecord {
  detectedGameType: RecognizedGameType;
  recognitionAlternatives?: Array<{ confidence: number; gameType: GameType }> | undefined;
  recognitionConfidence: number;
  recognitionEvidence: string[];
  recognitionSource: RecognitionSource;
  recognitionWarnings: string[];
  recognizedAt: string;
  suggestedAction?: string | undefined;
  userSelectedGameType?: GameType | undefined;
}
```
- Fully isolated: Project A's recognition data never leaks into Project B.
- Survives browser refreshes through localStorage key `"draw2game-projects"`.
