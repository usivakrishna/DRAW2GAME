import { useEffect, useRef } from "react";
import type { RuntimeLevelData } from "@/game/levels/level-loader";
import { PhaserGameBridge } from "@/game/PhaserGameBridge";
import type { GameStateManager } from "@/game/systems/game-state-manager";
import type { StyleId, ThemeId } from "@/game/themes/theme-types";

interface GameCanvasProps {
  gameStateManager: GameStateManager;
  levelData: RuntimeLevelData;
  onBridgeReady?: (bridge: PhaserGameBridge) => void;
  styleId: StyleId;
  themeId: ThemeId;
}

export function GameCanvas({
  gameStateManager,
  levelData,
  onBridgeReady,
  styleId,
  themeId,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bridgeRef = useRef<PhaserGameBridge | null>(null);

  const onBridgeReadyRef = useRef(onBridgeReady);
  onBridgeReadyRef.current = onBridgeReady;

  const styleIdRef = useRef(styleId);
  styleIdRef.current = styleId;

  const themeIdRef = useRef(themeId);
  themeIdRef.current = themeId;

  // Initialize Phaser Bridge on mount or levelData change
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous bridge if any
    if (bridgeRef.current) {
      bridgeRef.current.destroy();
      bridgeRef.current = null;
    }

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

    return () => {
      bridge.destroy();
      bridgeRef.current = null;
    };
  }, [gameStateManager, levelData]); // Re-create on level change

  // Dynamic Theme / Style change
  useEffect(() => {
    if (bridgeRef.current) {
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
