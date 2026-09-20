# Phase 10: Universal 2D Game Architecture

## Overview

DRAW2GAME Phase 10 introduces a domain-agnostic, extensible 2D game architecture that decouples universal game metadata, rules, viewport configuration, and objects from genre-specific engines. This prepares the platform for future game types (chess, ludo, pool, carrom, racing, shooter, etc.) while preserving 100% backward compatibility with the Phaser 3 + Matter.js platformer engine.

```
                          GameDefinition (Generic)
                          ├── id, name, version, metadata
                          ├── viewport, settings, engineConfig
                          ├── rules[], objects[], assets[]
                          └── typePayload (GameType-specific)
                                    │
                                 GameType
                       ("platformer" | future types)
                                    │
                            GameEngineFactory
                                    │
                 ┌──────────────────┴──────────────────┐
                 ▼                                     ▼
          PlatformerEngine                      Future Engines
      (implements GameEngine)             (Extension Points Only)
                 │                        (chess, ludo, pool, carrom, etc.)
                 ▼
        Phaser 3 + Matter.js
```

---

## Key Components

### 1. `GameDefinition` & `GameType` (`src/game/core/game-definition.ts`)
- **`GameType`**: A type-safe union of currently supported types (`"platformer"`) and future extension types (`"chess" | "ludo" | "pool" | "carrom" | "racing" | "puzzle" | "shooter" | "sports"`).
- **`GenericGameDefinition<TType, TPayload>`**: A standardized container containing:
  - `id`, `name`, `gameType`, `version`
  - `metadata`: creation dates, sources, descriptions
  - `viewport`: width, height
  - `rules`: declarative rules array (`GameRule[]`)
  - `objects`: generic object representations (`GameObject[]`)
  - `assets`: asset declarations (`GameAsset[]`)
  - `settings`: theme, audio, style, physics toggles
  - `engineConfig`: target engine identifier and parameters
  - `typePayload`: genre-specific strongly typed data

### 2. Platformer Adapter (`src/game/core/platformer-definition.ts`)
- **`PlatformerGameDefinition`**: Typed specialization with `PlatformerPayload` (physics, platforms, enemies, coins, player, spikes, goal).
- **`levelDefinitionToGameDefinition(level)`**: Projects Phase 5 `LevelDefinition` entities into generic `GameObject[]` and declarative `GameRule[]`.
- **`gameDefinitionToLevelDefinition(gameDef)`**: Reconstructs or extracts canonical `LevelDefinition` with 100% schema fidelity.
- **`ensureGameDefinition(input)`**: Transparent conversion helper accepting either `LevelDefinition` or `PlatformerGameDefinition`.

### 3. `GameEngine` Interface (`src/game/core/game-engine.ts`)
Minimal, engine-independent lifecycle contract:
- `initialize(options)`: mounts container and initializes systems.
- `load(definition)`: loads game definition into runtime structures.
- `start()`, `pause()`, `resume()`, `restart()`: runtime loop control.
- `destroy()`: cleans up canvas, memory, and event listeners.

### 4. `PlatformerEngine` (`src/game/core/platformer-engine.ts`)
Implements `GameEngine<PlatformerGameDefinition>`, wrapping `PhaserGameBridge` and coordinating Phaser 3 + Matter.js execution, level loading, theme changes, and game state management.

### 5. `GameEngineFactory` (`src/game/core/game-engine-factory.ts`)
- Resolves engines by `gameType`:
  - `"platformer"` -> returns instantiated `PlatformerEngine`.
  - Extension point types -> returns `{ success: false, isExtensionPoint: true, error: "..." }`.
  - Unknown types -> returns `{ success: false, isExtensionPoint: false, error: "..." }`.
- Never silently falls back to a platformer when an invalid or future type is requested.

---

## Backward Compatibility & Integrity Guarantees

1. **Storage Compatibility**: Existing `projectLevels` in `useProjectStore` and localStorage key `"draw2game-projects"` remain intact.
2. **Phase 7 AI Editor**: Continues to operate with full fidelity on underlying level structures, themes, styles, and parameters.
3. **Phaser & Matter.js**: Zero gameplay changes or physics regressions.
