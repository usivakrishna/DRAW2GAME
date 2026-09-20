# DRAW2GAME — Universal Game Engine Architecture

## Core Architectural Principle

> **"Game types are data and rules. They are not separate engines."**

DRAW2GAME previously used a genre-specific engine architecture (`PlatformerEngine`, `ChessEngine`, and planned stubs for `LudoEngine`, `PoolEngine`, etc.). That architecture has been completely removed and replaced with a **single universal game engine / universal game runtime** (`UniversalGameEngine`).

Different types of 2D games are represented as **DATA + RULES + OBJECTS + CAPABILITIES + SETTINGS**, interpreted and executed by the same universal runtime.

---

## Universal Target Pipeline

```
                    Game Input (Sketch / Upload / Manual)
                                      ↓
                               Game Recognition
                                      ↓
                              Game Understanding
                                      ↓
                           Universal Game Generator
                                      ↓
                                GameDefinition
                                      ↓
                             UniversalGameEngine
                                      ↓
                            Runtime Capabilities
                                      ↓
                                 Browser Game
```

---

## Runtime Subsystems & Capabilities

Rather than creating separate engine implementations, `UniversalGameEngine` coordinates modular runtime systems. Not every game uses every system; the `GameDefinition` declares or infers which capabilities are active:

```
UniversalGameEngine
    │
    ├── Renderer (Phaser 3 / DOM / Canvas)
    ├── PhysicsSystem (Phaser 3 + Matter.js, activated ONLY when "physics" is required)
    ├── CollisionSystem (AABB boundary queries & collision dispatch)
    ├── MovementSystem (Velocity, position, patrol distances)
    ├── BoardSystem (Grid layout, coordinate conversion, square occupancy, selection)
    ├── TurnSystem (Alternating turn sequence, move history, turn clocks)
    ├── RuleSystem (Declarative GameRule condition & action dispatch)
    ├── CameraSystem (Viewport dimensions, scroll position, target following)
    ├── ScoreSystem (Points, lives, collectibles count, multipliers)
    ├── GameStateSystem (Idle, playing, paused, won, gameover)
    └── WinConditionSystem (Victory & defeat evaluators: checkmate, goal reached, hazards)
```

---

## Capability Matrix Examples

### 1. 2D Platformer
- **Active Capabilities**: `["physics", "gravity", "collision", "movement", "camera", "scoring", "hazards", "collectibles", "goals", "rules"]`
- **Subsystems Activated**:
  - `PhysicsSystem` (Phaser 3 + Matter.js rigid-body physics, gravity velocity, platform collisions)
  - `CollisionSystem` (Player-coin, player-enemy, player-spike, player-goal triggers)
  - `MovementSystem` & `CameraSystem` (Player camera follow)
  - `ScoreSystem` & `RuleSystem`
- **Matter.js**: Active.

### 2. Chess
- **Active Capabilities**: `["board", "grid", "turns", "rules", "scoring"]`
- **Subsystems Activated**:
  - `BoardSystem` (8x8 grid, files `a`-`h`, ranks `1`-`8`, piece coordinates, legal move calculation)
  - `TurnSystem` (Alternating White/Black turns, move history in SAN notation)
  - `RuleSystem` (King safety, checkmate evaluation, en passant, castling)
  - `GameStateSystem` & `WinConditionSystem`
- **Matter.js**: **Deactivated / Zero Overhead**. Chess does not require rigid-body physics.

### 3. Future Extension Games (Ludo, Carrom, Pool, Racing, Puzzle, Shooter, Sports)
- When added, they do **NOT** introduce new engine classes like `LudoEngine` or `PoolEngine`.
- They define new capability combinations (e.g. Pool = `physics` + `collision` + `turns` + `scoring`; Puzzle = `grid` + `rules` + `timer`).
- The same `UniversalGameEngine` runs them natively.

---

## Game Object Model

Game objects in DRAW2GAME remain strictly generic:
```typescript
interface GameObject {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  name?: string;
  properties?: Record<string, unknown>;
}
```
Game-specific behavior is expressed through properties, tags, and declarative rules—not through bespoke object subclasses.

---

## Elimination of Game-Specific Classes

| Old Deprecated Architecture | New Universal Architecture | Status |
|---|---|---|
| `PlatformerEngine` | `UniversalGameEngine` (with `physics` capability) | Removed |
| `ChessEngine` | `UniversalGameEngine` (with `board` & `turns` capabilities) | Removed |
| `GameEngineFactory` (branching per engine) | `createUniversalGameEngine(definition)` | Refactored to Universal Resolver |
| `PlatformerGameGenerator` | `UniversalGameGenerator` | Removed |
| `ChessGameGenerator` | `UniversalGameGenerator` | Removed |
| `ExtensionPointGenerator` | `UniversalGameGenerator` | Removed |

---

## Verification & Test Guarantee

All existing functionality is 100% preserved across:
- Drawing Studio & Upload
- OpenCV image preprocessing
- Multi-genre Game Recognition
- Level JSON conversion and bidirectional round-tripping
- Platformer physics, hazards, coins, enemies, goal victory
- Chess legal moves, castling, en passant, checkmate, stalemate, SAN notation
- Project isolation and local persistence
- AI Editor compatibility
- 214/214 passing unit & integration tests
