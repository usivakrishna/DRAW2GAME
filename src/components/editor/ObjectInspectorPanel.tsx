/**
 * DRAW2GAME — Phase 15: Universal Game Editor & Regeneration
 * Object & Game Settings Inspector Panel
 *
 * Provides inspection and modification of:
 * - Selected GameObject properties (position, size, custom parameters)
 * - Game-level settings (name, viewport, world dimensions, physics, themes, styles)
 * - Declarative game rules and runtime capabilities
 * - Live validation feedback with error/warning lists
 */

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Layers,
  Palette,
  Sliders,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameDefinition, GameObject, GameViewport } from "@/game/core/game-definition";
import type { ValidationResult } from "@/game/generation/validators/validation-types";
import { STYLE_LIST } from "@/game/themes/style-registry";
import { THEME_LIST } from "@/game/themes/theme-registry";

interface ObjectInspectorPanelProps {
  gameDefinition: GameDefinition;
  onRemoveObject: (id: string) => void;
  onUpdateObject: (id: string, changes: Partial<GameObject>) => void;
  onUpdateSettings: (changes: {
    fps?: number | undefined;
    gravityY?: number | undefined;
    jumpVelocity?: number | undefined;
    name?: string | undefined;
    styleId?: string | undefined;
    themeId?: string | undefined;
    viewport?: GameViewport | undefined;
    world?: { height: number; width: number } | undefined;
  }) => void;
  selectedObject: GameObject | null;
  validation: ValidationResult;
}

export function ObjectInspectorPanel({
  gameDefinition,
  onRemoveObject,
  onUpdateObject,
  onUpdateSettings,
  selectedObject,
  validation,
}: ObjectInspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<"entity" | "settings" | "rules" | "validation">("entity");

  const isChess = gameDefinition.gameType === "chess";
  const physicsOptions = gameDefinition.engineConfig.options as {
    gravityY?: number;
    jumpVelocity?: number;
  } | undefined;

  const worldDimensions = (gameDefinition.typePayload as {
    world?: { height: number; width: number };
  })?.world ?? gameDefinition.viewport;

  return (
    <div className="flex h-full flex-col bg-slate-900 border-l border-slate-800 text-slate-100 w-80 sm:w-96 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-950 px-2 pt-2 gap-1 text-xs">
        <button
          className={`flex items-center gap-1.5 px-3 py-2 font-medium border-b-2 transition ${
            activeTab === "entity"
              ? "border-indigo-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("entity")}
        >
          <Sliders className="size-3.5" />
          <span>Entity</span>
        </button>

        <button
          className={`flex items-center gap-1.5 px-3 py-2 font-medium border-b-2 transition ${
            activeTab === "settings"
              ? "border-indigo-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("settings")}
        >
          <Palette className="size-3.5" />
          <span>Settings</span>
        </button>

        <button
          className={`flex items-center gap-1.5 px-3 py-2 font-medium border-b-2 transition ${
            activeTab === "rules"
              ? "border-indigo-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("rules")}
        >
          <Layers className="size-3.5" />
          <span>Rules</span>
        </button>

        <button
          className={`flex items-center gap-1.5 px-3 py-2 font-medium border-b-2 transition ${
            activeTab === "validation"
              ? "border-indigo-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("validation")}
        >
          {validation.isValid ? (
            <CheckCircle2 className="size-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="size-3.5 text-amber-400" />
          )}
          <span>Audit</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* TAB 1: Selected Object Inspector */}
        {activeTab === "entity" && (
          <div className="space-y-4">
            {selectedObject ? (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="font-semibold text-sm text-white">{selectedObject.name || selectedObject.type}</h3>
                    <p className="text-[11px] font-mono text-slate-400">{selectedObject.id}</p>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-medium text-indigo-300 uppercase tracking-wider">
                    {selectedObject.type}
                  </span>
                </div>

                {/* Transform (X, Y, W, H) */}
                <div className="space-y-3">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                    Position & Bounds
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400">Position X (px)</label>
                      <input
                        className="w-full mt-1 rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                        onChange={(e) =>
                          onUpdateObject(selectedObject.id, {
                            x: Number(e.target.value) || 0,
                          })
                        }
                        type="number"
                        value={selectedObject.x}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400">Position Y (px)</label>
                      <input
                        className="w-full mt-1 rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                        onChange={(e) =>
                          onUpdateObject(selectedObject.id, {
                            y: Number(e.target.value) || 0,
                          })
                        }
                        type="number"
                        value={selectedObject.y}
                      />
                    </div>

                    {selectedObject.width !== undefined && (
                      <div>
                        <label className="text-[11px] text-slate-400">Width (px)</label>
                        <input
                          className="w-full mt-1 rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                          min={20}
                          onChange={(e) =>
                            onUpdateObject(selectedObject.id, {
                              width: Math.max(20, Number(e.target.value) || 20),
                            })
                          }
                          type="number"
                          value={selectedObject.width}
                        />
                      </div>
                    )}

                    {selectedObject.height !== undefined && (
                      <div>
                        <label className="text-[11px] text-slate-400">Height (px)</label>
                        <input
                          className="w-full mt-1 rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                          min={20}
                          onChange={(e) =>
                            onUpdateObject(selectedObject.id, {
                              height: Math.max(20, Number(e.target.value) || 20),
                            })
                          }
                          type="number"
                          value={selectedObject.height}
                        />
                      </div>
                    )}

                    {selectedObject.radius !== undefined && (
                      <div>
                        <label className="text-[11px] text-slate-400">Radius (px)</label>
                        <input
                          className="w-full mt-1 rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                          min={8}
                          onChange={(e) =>
                            onUpdateObject(selectedObject.id, {
                              radius: Math.max(8, Number(e.target.value) || 14),
                            })
                          }
                          type="number"
                          value={selectedObject.radius}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Specific entity properties */}
                {selectedObject.type === "player" && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="text-[11px] text-slate-400">Spawn Facing</label>
                    <select
                      className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                      onChange={(e) =>
                        onUpdateObject(selectedObject.id, {
                          properties: {
                            ...selectedObject.properties,
                            spawnFacing: e.target.value as "left" | "right",
                          },
                        })
                      }
                      value={(selectedObject.properties?.spawnFacing as string) || "right"}
                    >
                      <option value="right">Right</option>
                      <option value="left">Left</option>
                    </select>
                  </div>
                )}

                {selectedObject.type === "platform" && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        checked={Boolean(selectedObject.properties?.oneWay)}
                        className="rounded bg-slate-950 border-slate-800 text-indigo-600"
                        onChange={(e) =>
                          onUpdateObject(selectedObject.id, {
                            properties: {
                              ...selectedObject.properties,
                              oneWay: e.target.checked,
                            },
                          })
                        }
                        type="checkbox"
                      />
                      <span>One-Way Platform (Jump through from below)</span>
                    </label>
                  </div>
                )}

                {selectedObject.type === "enemy" && (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-[11px] text-slate-400">Patrol Speed</label>
                      <input
                        className="w-full mt-1 rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100"
                        onChange={(e) =>
                          onUpdateObject(selectedObject.id, {
                            properties: {
                              ...selectedObject.properties,
                              speed: Number(e.target.value) || 80,
                            },
                          })
                        }
                        type="number"
                        value={(selectedObject.properties?.speed as number) ?? 80}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Patrol Range (px)</label>
                      <input
                        className="w-full mt-1 rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100"
                        onChange={(e) =>
                          onUpdateObject(selectedObject.id, {
                            properties: {
                              ...selectedObject.properties,
                              patrolDistance: Number(e.target.value) || 120,
                            },
                          })
                        }
                        type="number"
                        value={(selectedObject.properties?.patrolDistance as number) ?? 120}
                      />
                    </div>
                  </div>
                )}

                {selectedObject.type === "spike" && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="text-[11px] text-slate-400">Spike Orientation</label>
                    <select
                      className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100"
                      onChange={(e) =>
                        onUpdateObject(selectedObject.id, {
                          properties: {
                            ...selectedObject.properties,
                            direction: e.target.value,
                          },
                        })
                      }
                      value={(selectedObject.properties?.direction as string) || "up"}
                    >
                      <option value="up">Pointing Up ▲</option>
                      <option value="down">Pointing Down ▼</option>
                      <option value="left">Pointing Left ◀</option>
                      <option value="right">Pointing Right ▶</option>
                    </select>
                  </div>
                )}

                {/* Delete Entity Button */}
                <div className="pt-4 border-t border-slate-800">
                  <Button
                    className="w-full gap-2 border-red-900/60 bg-red-950/40 text-red-300 hover:bg-red-900/60 hover:text-white"
                    disabled={selectedObject.type === "player" || selectedObject.type === "chess-king"}
                    onClick={() => onRemoveObject(selectedObject.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete Entity</span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Sliders className="size-8 mx-auto text-slate-600" />
                <p className="font-medium text-slate-400">No Object Selected</p>
                <p className="text-[11px] leading-relaxed">
                  Click any object on the canvas to inspect and modify its coordinates, dimensions, and properties.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Game Settings */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Game Title
              </label>
              <input
                className="w-full rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                onChange={(e) => onUpdateSettings({ name: e.target.value })}
                value={gameDefinition.name}
              />
            </div>

            {/* Theme & Style */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                Theme & Visual Style
              </span>

              <div>
                <label className="text-[11px] text-slate-400">Visual Theme</label>
                <select
                  className="w-full mt-1 rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100"
                  onChange={(e) => onUpdateSettings({ themeId: e.target.value })}
                  value={gameDefinition.settings.themeId || "classic"}
                >
                  {THEME_LIST.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Rendering Style</label>
                <select
                  className="w-full mt-1 rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100"
                  onChange={(e) => onUpdateSettings({ styleId: e.target.value })}
                  value={gameDefinition.settings.styleId || "clean"}
                >
                  {STYLE_LIST.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Platformer World & Physics Settings */}
            {!isChess && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                  Physics & World Dimensions
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400">World Width</label>
                    <input
                      className="w-full mt-1 rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100"
                      onChange={(e) =>
                        onUpdateSettings({
                          world: {
                            height: worldDimensions.height,
                            width: Number(e.target.value) || 1280,
                          },
                        })
                      }
                      type="number"
                      value={worldDimensions.width}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">World Height</label>
                    <input
                      className="w-full mt-1 rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100"
                      onChange={(e) =>
                        onUpdateSettings({
                          world: {
                            height: Number(e.target.value) || 720,
                            width: worldDimensions.width,
                          },
                        })
                      }
                      type="number"
                      value={worldDimensions.height}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400">Gravity Y</label>
                  <input
                    className="w-full mt-1 rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100"
                    onChange={(e) => onUpdateSettings({ gravityY: Number(e.target.value) || 1400 })}
                    type="number"
                    value={physicsOptions?.gravityY ?? 1400}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400">Jump Velocity</label>
                  <input
                    className="w-full mt-1 rounded bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs text-slate-100"
                    onChange={(e) =>
                      onUpdateSettings({ jumpVelocity: Number(e.target.value) || -520 })
                    }
                    type="number"
                    value={physicsOptions?.jumpVelocity ?? -520}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Capabilities & Declarative Rules */}
        {activeTab === "rules" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                Active Engine Capabilities
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(gameDefinition.capabilities ?? []).map((cap) => (
                  <span
                    className="rounded-lg bg-indigo-950/60 border border-indigo-500/30 px-2.5 py-1 font-mono text-[10px] text-indigo-300"
                    key={cap}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                Declarative Rules ({gameDefinition.rules.length})
              </span>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {gameDefinition.rules.map((rule) => (
                  <div
                    className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 space-y-1"
                    key={rule.id}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs">{rule.name}</span>
                      {rule.action && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-emerald-400">
                          {rule.action}
                        </span>
                      )}
                    </div>
                    {rule.description && (
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {rule.description}
                      </p>
                    )}
                    {rule.event && (
                      <span className="inline-block text-[10px] font-mono text-slate-500">
                        event: {rule.event}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Validation Status */}
        {activeTab === "validation" && (
          <div className="space-y-4">
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                validation.isValid
                  ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                  : "bg-amber-950/30 border-amber-500/30 text-amber-300"
              }`}
            >
              {validation.isValid ? (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="size-5 shrink-0 text-amber-400" />
              )}
              <div>
                <p className="font-semibold">
                  {validation.isValid ? "GameDefinition Valid" : "Issues Detected"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {validation.isValid
                    ? "Definition passes all generic and genre-specific constraints."
                    : `${validation.errors.length} error(s), ${validation.warnings.length} warning(s).`}
                </p>
              </div>
            </div>

            {validation.errors.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">
                  Errors (Blocking Save)
                </span>
                {validation.errors.map((err, idx) => (
                  <div
                    className="p-2 rounded bg-red-950/40 border border-red-900/60 text-red-200 text-xs flex items-start gap-2"
                    key={idx}
                  >
                    <AlertCircle className="size-3.5 text-red-400 shrink-0 mt-0.5" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                  Warnings (Non-blocking)
                </span>
                {validation.warnings.map((warn, idx) => (
                  <div
                    className="p-2 rounded bg-amber-950/30 border border-amber-900/50 text-amber-200 text-xs flex items-start gap-2"
                    key={idx}
                  >
                    <AlertCircle className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
