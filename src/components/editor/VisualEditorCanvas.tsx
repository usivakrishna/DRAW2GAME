/**
 * DRAW2GAME — Phase 15: Universal Game Editor & Regeneration
 * Visual 2D Object Editing Canvas
 *
 * Provides direct interactive visual manipulation of GameDefinition objects:
 * - Click to select
 * - Drag to move with grid/boundary constraints
 * - Resize handles to scale objects
 * - Quick-add toolbar for game entities
 * - Keyboard shortcuts (arrow nudge, delete)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Coins,
  Flag,
  ShieldAlert,
  Square,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameDefinition, GameObject } from "@/game/core/game-definition";

interface VisualEditorCanvasProps {
  gameDefinition: GameDefinition;
  onAddObject: (obj: GameObject) => void;
  onMoveObject: (id: string, x: number, y: number) => void;
  onRemoveObject: (id: string) => void;
  onResizeObject: (id: string, width: number, height: number, radius?: number) => void;
  onSelectObject: (id: string | null) => void;
  selectedObjectId: string | null;
}

export function VisualEditorCanvas({
  gameDefinition,
  onAddObject,
  onMoveObject,
  onRemoveObject,
  onResizeObject,
  onSelectObject,
  selectedObjectId,
}: VisualEditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState<{
    id: string;
    initialMouseX: number;
    initialMouseY: number;
    initialObjX: number;
    initialObjY: number;
  } | null>(null);

  const [resizing, setResizing] = useState<{
    handle: "e" | "s" | "se";
    id: string;
    initialH: number;
    initialMouseX: number;
    initialMouseY: number;
    initialW: number;
  } | null>(null);

  const worldWidth = useMemo(() => {
    return (
      (gameDefinition.typePayload as { world?: { width: number } })?.world?.width ??
      gameDefinition.viewport.width ??
      1280
    );
  }, [gameDefinition]);

  const worldHeight = useMemo(() => {
    return (
      (gameDefinition.typePayload as { world?: { height: number } })?.world?.height ??
      gameDefinition.viewport.height ??
      720
    );
  }, [gameDefinition]);

  // Adjust container zoom scale to fit available viewport
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const margin = 48;
      const scaleX = (rect.width - margin) / worldWidth;
      const scaleY = (rect.height - margin) / worldHeight;
      const fitScale = Math.min(1, Math.max(0.25, Math.min(scaleX, scaleY)));
      setScale(fitScale);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [worldHeight, worldWidth]);

  // Handle Dragging / Resizing on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const dx = (e.clientX - dragging.initialMouseX) / scale;
        const dy = (e.clientY - dragging.initialMouseY) / scale;
        const newX = Math.round(Math.max(0, Math.min(worldWidth - 20, dragging.initialObjX + dx)));
        const newY = Math.round(Math.max(0, Math.min(worldHeight - 20, dragging.initialObjY + dy)));
        onMoveObject(dragging.id, newX, newY);
      } else if (resizing) {
        const dx = (e.clientX - resizing.initialMouseX) / scale;
        const dy = (e.clientY - resizing.initialMouseY) / scale;
        let newW = resizing.initialW;
        let newH = resizing.initialH;

        if (resizing.handle === "e" || resizing.handle === "se") {
          newW = Math.max(20, Math.round(resizing.initialW + dx));
        }
        if (resizing.handle === "s" || resizing.handle === "se") {
          newH = Math.max(20, Math.round(resizing.initialH + dy));
        }

        onResizeObject(resizing.id, newW, newH);
      }
    };

    const handleMouseUp = () => {
      if (dragging) setDragging(null);
      if (resizing) setResizing(null);
    };

    if (dragging || resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, onMoveObject, onResizeObject, resizing, scale, worldHeight, worldWidth]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedObjectId) return;
      // Ignore if user is typing in an input
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const obj = gameDefinition.objects.find((o) => o.id === selectedObjectId);
      if (!obj) return;

      const step = e.shiftKey ? 32 : 8;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onMoveObject(obj.id, Math.max(0, obj.x - step), obj.y);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onMoveObject(obj.id, Math.min(worldWidth - (obj.width ?? 32), obj.x + step), obj.y);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        onMoveObject(obj.id, obj.x, Math.max(0, obj.y - step));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onMoveObject(obj.id, obj.x, Math.min(worldHeight - (obj.height ?? 32), obj.y + step));
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onRemoveObject(obj.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameDefinition.objects, onMoveObject, onRemoveObject, selectedObjectId, worldHeight, worldWidth]);

  // Handlers to create new entities
  const handleAddPlatform = useCallback(() => {
    const id = `plat_${Date.now().toString(36).slice(2, 6)}`;
    onAddObject({
      height: 32,
      id,
      name: "Platform",
      properties: { oneWay: false },
      type: "platform",
      width: 160,
      x: Math.round(worldWidth / 2 - 80),
      y: Math.round(worldHeight / 2),
    });
  }, [onAddObject, worldHeight, worldWidth]);

  const handleAddCoin = useCallback(() => {
    const id = `coin_${Date.now().toString(36).slice(2, 6)}`;
    onAddObject({
      height: 28,
      id,
      name: "Coin",
      radius: 14,
      type: "coin",
      width: 28,
      x: Math.round(worldWidth / 2 - 14),
      y: Math.round(worldHeight / 2 - 60),
    });
  }, [onAddObject, worldHeight, worldWidth]);

  const handleAddEnemy = useCallback(() => {
    const id = `enemy_${Date.now().toString(36).slice(2, 6)}`;
    onAddObject({
      height: 32,
      id,
      name: "Enemy",
      properties: { patrolDistance: 120, speed: 80 },
      type: "enemy",
      width: 32,
      x: Math.round(worldWidth / 2 + 100),
      y: Math.round(worldHeight / 2 - 32),
    });
  }, [onAddObject, worldHeight, worldWidth]);

  const handleAddSpike = useCallback(() => {
    const id = `spike_${Date.now().toString(36).slice(2, 6)}`;
    onAddObject({
      height: 20,
      id,
      name: "Spike",
      properties: { direction: "up" },
      type: "spike",
      width: 48,
      x: Math.round(worldWidth / 2 + 50),
      y: Math.round(worldHeight / 2),
    });
  }, [onAddObject, worldHeight, worldWidth]);

  const handleAddGoal = useCallback(() => {
    const existingGoal = gameDefinition.objects.find((o) => o.type === "goal");
    if (existingGoal) {
      onSelectObject(existingGoal.id);
      return;
    }
    const id = `goal_${Date.now().toString(36).slice(2, 6)}`;
    onAddObject({
      height: 64,
      id,
      name: "Goal Flag",
      properties: { label: "Goal" },
      type: "goal",
      width: 44,
      x: Math.min(worldWidth - 100, Math.round(worldWidth * 0.85)),
      y: Math.round(worldHeight / 2 - 64),
    });
  }, [gameDefinition.objects, onAddObject, onSelectObject, worldHeight, worldWidth]);

  const isChess = gameDefinition.gameType === "chess";

  return (
    <div className="relative flex flex-col h-full w-full bg-slate-950 overflow-hidden select-none">
      {/* Top Floating Quick-Add Toolbar */}
      {!isChess && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 p-1.5 shadow-2xl backdrop-blur">
          <span className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Add Object:
          </span>
          <Button
            className="h-7 gap-1 text-xs text-slate-200 hover:text-white"
            onClick={handleAddPlatform}
            size="sm"
            variant="ghost"
          >
            <Square className="size-3.5 text-slate-400" />
            <span>Platform</span>
          </Button>
          <Button
            className="h-7 gap-1 text-xs text-amber-300 hover:text-amber-200"
            onClick={handleAddCoin}
            size="sm"
            variant="ghost"
          >
            <Coins className="size-3.5" />
            <span>Coin</span>
          </Button>
          <Button
            className="h-7 gap-1 text-xs text-rose-300 hover:text-rose-200"
            onClick={handleAddEnemy}
            size="sm"
            variant="ghost"
          >
            <ShieldAlert className="size-3.5" />
            <span>Enemy</span>
          </Button>
          <Button
            className="h-7 gap-1 text-xs text-red-400 hover:text-red-300"
            onClick={handleAddSpike}
            size="sm"
            variant="ghost"
          >
            <Zap className="size-3.5" />
            <span>Spike</span>
          </Button>
          <Button
            className="h-7 gap-1 text-xs text-emerald-300 hover:text-emerald-200"
            onClick={handleAddGoal}
            size="sm"
            variant="ghost"
          >
            <Flag className="size-3.5" />
            <span>Goal</span>
          </Button>
        </div>
      )}

      {/* Main Canvas Scroll / Viewport Center */}
      <div
        className="flex-1 flex items-center justify-center p-6 overflow-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectObject(null);
          }
        }}
        ref={containerRef}
      >
        <div
          className="relative rounded-2xl border-2 border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden transition-transform"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onSelectObject(null);
            }
          }}
          style={{
            height: `${worldHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            width: `${worldWidth}px`,
          }}
        >
          {/* Background Grid Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)",
              backgroundSize: isChess ? "100px 100px" : "40px 40px",
            }}
          />

          {/* Chess Checkerboard Squares */}
          {isChess && (
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 pointer-events-none">
              {Array.from({ length: 64 }).map((_, i) => {
                const row = Math.floor(i / 8);
                const col = i % 8;
                const isDark = (row + col) % 2 === 1;
                return (
                  <div
                    className={isDark ? "bg-amber-900/40" : "bg-amber-100/10"}
                    key={i}
                  />
                );
              })}
            </div>
          )}

          {/* Render GameObjects */}
          {gameDefinition.objects.map((obj) => {
            const isSelected = selectedObjectId === obj.id;
            const w = obj.width ?? (obj.radius ? obj.radius * 2 : 40);
            const h = obj.height ?? (obj.radius ? obj.radius * 2 : 40);

            // Style by object type
            let bgClass = "bg-slate-700 border-slate-600";
            let label = obj.name || obj.type;

            if (obj.type === "player") {
              bgClass = "bg-cyan-500/80 border-cyan-300 text-cyan-100 shadow-lg shadow-cyan-500/30";
              label = "Player";
            } else if (obj.type === "platform") {
              bgClass = "bg-emerald-600/80 border-emerald-400 text-emerald-100 shadow-md";
              label = "Platform";
            } else if (obj.type === "coin") {
              bgClass = "bg-amber-400 border-amber-200 text-amber-950 rounded-full shadow-lg shadow-amber-400/40";
              label = "🪙";
            } else if (obj.type === "enemy") {
              bgClass = "bg-rose-600 border-rose-400 text-rose-100 shadow-md shadow-rose-600/30";
              label = "👾 Enemy";
            } else if (obj.type === "spike") {
              bgClass = "bg-red-700 border-red-500 text-red-200";
              label = "▲ Hazard";
            } else if (obj.type === "goal") {
              bgClass = "bg-emerald-500 border-emerald-300 text-emerald-950 shadow-xl shadow-emerald-500/40";
              label = "🏁 Goal";
            } else if (obj.type.startsWith("chess-")) {
              const isWhite = obj.properties?.color === "white";
              bgClass = isWhite
                ? "bg-slate-100 border-slate-300 text-slate-900 shadow-md"
                : "bg-slate-900 border-slate-700 text-slate-100 shadow-md";
              label = obj.name || obj.type.replace("chess-", "");
            }

            return (
              <div
                className={`absolute cursor-move border flex items-center justify-center text-xs font-semibold select-none transition-shadow ${bgClass} ${
                  isSelected
                    ? "ring-4 ring-indigo-400 ring-offset-2 ring-offset-slate-950 z-30 shadow-2xl"
                    : "hover:ring-2 hover:ring-indigo-300/60 z-10"
                }`}
                key={obj.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectObject(obj.id);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onSelectObject(obj.id);
                  setDragging({
                    id: obj.id,
                    initialMouseX: e.clientX,
                    initialMouseY: e.clientY,
                    initialObjX: obj.x,
                    initialObjY: obj.y,
                  });
                }}
                style={{
                  height: `${h}px`,
                  left: `${obj.x}px`,
                  top: `${obj.y}px`,
                  width: `${w}px`,
                }}
              >
                <span className="truncate px-1 pointer-events-none">{label}</span>

                {/* Selection Details & Resize Handles */}
                {isSelected && (
                  <>
                    <div className="absolute -top-6 left-0 bg-indigo-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none">
                      x:{obj.x} y:{obj.y} ({w}×{h})
                    </div>

                    {/* Resize Handle: Right (East) */}
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-2.5 bg-indigo-400 border border-white rounded-full cursor-ew-resize z-40"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizing({
                          handle: "e",
                          id: obj.id,
                          initialH: h,
                          initialMouseX: e.clientX,
                          initialMouseY: e.clientY,
                          initialW: w,
                        });
                      }}
                    />

                    {/* Resize Handle: Bottom (South) */}
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 size-2.5 bg-indigo-400 border border-white rounded-full cursor-ns-resize z-40"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizing({
                          handle: "s",
                          id: obj.id,
                          initialH: h,
                          initialMouseX: e.clientX,
                          initialMouseY: e.clientY,
                          initialW: w,
                        });
                      }}
                    />

                    {/* Resize Handle: Bottom-Right (South-East) */}
                    <div
                      className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 size-3 bg-indigo-500 border border-white rounded cursor-nwse-resize z-40"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizing({
                          handle: "se",
                          id: obj.id,
                          initialH: h,
                          initialMouseX: e.clientX,
                          initialMouseY: e.clientY,
                          initialW: w,
                        });
                      }}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Info Bar */}
      <footer className="h-8 border-t border-slate-800 bg-slate-900/80 px-4 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Canvas Size: <strong>{worldWidth} × {worldHeight}px</strong>
          </span>
          <span>
            Objects: <strong>{gameDefinition.objects.length}</strong>
          </span>
          {selectedObjectId && (
            <span className="text-indigo-400">
              Selected: <strong>{selectedObjectId}</strong> (Arrows to nudge, Del to remove)
            </span>
          )}
        </div>
        <div>
          Zoom: <strong>{Math.round(scale * 100)}%</strong>
        </div>
      </footer>
    </div>
  );
}
