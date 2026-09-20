import { useEffect, useRef } from "react";
import type { PlatformerGameDefinition } from "@/game/core/platformer-definition";
import { PlatformerEngine } from "@/game/core/platformer-engine";
import type { RuntimeLevelData } from "@/game/levels/level-loader";
import { PhaserGameBridge } from "@/game/PhaserGameBridge";
import type { GameStateManager } from "@/game/systems/game-state-manager";
import type { StyleId, ThemeId } from "@/game/themes/theme-types";

interface GameCanvasProps {
  gameDefinition?: PlatformerGameDefinition | undefined;
  gameStateManager: GameStateManager;
  levelData: RuntimeLevelData;
  onBridgeReady?: ((bridge: PhaserGameBridge) => void) | undefined;
  onEngineReady?: ((engine: PlatformerEngine) => void) | undefined;
  styleId: StyleId;
  themeId: ThemeId;
}

export function GameCanvas({
  gameDefinition,
  gameStateManager,
  levelData,
  onBridgeReady,
  onEngineReady,
  styleId,
  themeId,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bridgeRef = useRef<PhaserGameBridge | null>(null);
  const engineRef = useRef<PlatformerEngine | null>(null);

  const onBridgeReadyRef = useRef(onBridgeReady);
  onBridgeReadyRef.current = onBridgeReady;

  const onEngineReadyRef = useRef(onEngineReady);
  onEngineReadyRef.current = onEngineReady;

  const styleIdRef = useRef(styleId);
  styleIdRef.current = styleId;

  const themeIdRef = useRef(themeId);
  themeIdRef.current = themeId;

  // Initialize Engine / Phaser Bridge on mount or data change
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous engine & bridge if any
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    if (bridgeRef.current) {
      bridgeRef.current.destroy();
      bridgeRef.current = null;
    }

    if (gameDefinition) {
      // Use Phase 10 PlatformerEngine adapter
      const engine = new PlatformerEngine();
      engine.initialize({
        container: containerRef.current,
        gameStateManager,
        settings: {
          styleId: styleIdRef.current,
          themeId: themeIdRef.current,
        },
      });
      engine.load(gameDefinition);

      engineRef.current = engine;
      const bridge = engine.getBridge();
      bridgeRef.current = bridge;

      if (onEngineReadyRef.current) {
        onEngineReadyRef.current(engine);
      }
      if (bridge && onBridgeReadyRef.current) {
        onBridgeReadyRef.current(bridge);
      }
    } else {
      // Direct bridge fallback
      const bridge = new PhaserGameBridge({
        container: containerRef.current,
        gameStateManager,
        levelData,
        styleId: styleIdRef.current,
        themeId: themeIdRef.current,
      });

      bridgeRef.current = bridge;
      if (onBridgeReadyRef.current) {
        onBridgeReadyRef.current(bridge);
      }
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      if (bridgeRef.current) {
        bridgeRef.current.destroy();
        bridgeRef.current = null;
      }
    };
  }, [gameDefinition, gameStateManager, levelData]);

  // Dynamic Theme / Style change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTheme(themeId, styleId);
    } else if (bridgeRef.current) {
      bridgeRef.current.setTheme(themeId, styleId);
    }
  }, [themeId, styleId]);

  return (
    <div
      aria-label="Phaser Game Canvas Container"
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-slate-950 select-none"
      ref={containerRef}
    />
  );
}
