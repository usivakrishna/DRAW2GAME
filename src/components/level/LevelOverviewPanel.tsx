import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Coins,
  Compass,
  Flag,
  Layers,
  Skull,
  User,
  Zap,
} from "lucide-react";
import type { DetectionPrediction } from "@/types/detection";
import type { GameMode, LevelDefinition } from "@/json/level-schema";
import type { LevelValidationResult } from "@/json/detection-to-level";

interface LevelOverviewPanelProps {
  detections: DetectionPrediction[];
  level: LevelDefinition;
  onGameModeChange: (mode: GameMode) => void;
  unmappedDetections: DetectionPrediction[];
  validation: LevelValidationResult;
}

export function LevelOverviewPanel({
  detections,
  level,
  onGameModeChange,
  unmappedDetections,
  validation,
}: LevelOverviewPanelProps) {
  const worldWidth = level.world?.width ?? level.viewport?.width ?? 1280;
  const worldHeight = level.world?.height ?? level.viewport?.height ?? 720;
  const viewportWidth = level.viewport?.width ?? 1280;
  const viewportHeight = level.viewport?.height ?? 720;

  return (
    <div className="space-y-5">
      {/* Validation Status Card */}
      <div
        className={`rounded-2xl border p-5 shadow-sm transition ${
          validation.isValid
            ? "border-emerald-200 bg-emerald-50/50"
            : "border-rose-200 bg-rose-50/50"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {validation.isValid ? (
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="size-5 text-rose-600 shrink-0" />
            )}
            <div>
              <h3
                className={`text-sm font-semibold ${
                  validation.isValid ? "text-emerald-950" : "text-rose-950"
                }`}
              >
                {validation.isValid
                  ? "Valid Level Definition"
                  : "Level Validation Failed"}
              </h3>
              <p
                className={`text-xs ${
                  validation.isValid ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {validation.isValid
                  ? "Schema and gameplay contracts satisfied."
                  : `${validation.errors.length} error(s) must be resolved.`}
              </p>
            </div>
          </div>

          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
              validation.isValid
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {validation.isValid ? "VALID" : "INVALID"}
          </span>
        </div>

        {/* Validation Errors */}
        {validation.errors.length > 0 && (
          <div className="mt-3.5 space-y-1.5 border-t border-rose-200/60 pt-3">
            <p className="text-xs font-semibold text-rose-900">Validation Errors:</p>
            <ul className="space-y-1 text-xs text-rose-800">
              {validation.errors.map((err, idx) => (
                <li className="flex items-start gap-1.5" key={idx}>
                  <span className="text-rose-500 font-bold">&bull;</span>
                  <span>{err}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Validation Warnings */}
        {validation.warnings.length > 0 && (
          <div className="mt-3.5 space-y-1.5 border-t border-slate-200/60 pt-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
              <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
              <span>Warnings:</span>
            </div>
            <ul className="space-y-1 text-xs text-amber-800">
              {validation.warnings.map((warn, idx) => (
                <li className="flex items-start gap-1.5" key={idx}>
                  <span className="text-amber-500 font-bold">&bull;</span>
                  <span>{warn}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Mode & World Configuration */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-slate-900">Game Mode</h3>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                level.gameMode === "single-screen"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => onGameModeChange("single-screen")}
              type="button"
            >
              Single-Screen
            </button>
            <button
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                level.gameMode === "side-scrolling"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => onGameModeChange("side-scrolling")}
              type="button"
            >
              Side-Scrolling
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-slate-500 font-medium">World Dimensions</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900">
              {worldWidth} &times; {worldHeight} px
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {level.gameMode === "side-scrolling"
                ? "Extended horizontal playfield"
                : "Exact viewport fit"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p className="text-slate-500 font-medium">Viewport Camera</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900">
              {viewportWidth} &times; {viewportHeight} px
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Fixed 16:9 standard display
            </p>
          </div>
        </div>
      </div>

      {/* Entity Summary Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-slate-900">Level Entities</h3>
          </div>
          <span className="text-xs text-slate-500">
            Total items:{" "}
            {1 +
              (level.goal ? 1 : 0) +
              level.platforms.length +
              level.enemies.length +
              level.coins.length +
              level.spikes.length}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-xs">
          {/* Player */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <User className="size-3.5 text-emerald-600" />
              <span>Player</span>
            </div>
            <p className="mt-1 font-mono text-base font-semibold text-slate-900">
              {level.player ? 1 : 0}
            </p>
            <p className="text-[10px] text-slate-400">
              at ({level.player?.x}, {level.player?.y})
            </p>
          </div>

          {/* Goal */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Flag className="size-3.5 text-indigo-600" />
              <span>Goal</span>
            </div>
            <p className="mt-1 font-mono text-base font-semibold text-slate-900">
              {level.goal ? 1 : 0}
            </p>
            <p className="text-[10px] text-slate-400">
              {level.goal
                ? `at (${level.goal.x}, ${level.goal.y})`
                : "None"}
            </p>
          </div>

          {/* Platforms */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Layers className="size-3.5 text-amber-600" />
              <span>Platforms</span>
            </div>
            <p className="mt-1 font-mono text-base font-semibold text-slate-900">
              {level.platforms.length}
            </p>
            <p className="text-[10px] text-slate-400">Solid geometry</p>
          </div>

          {/* Enemies */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Skull className="size-3.5 text-rose-600" />
              <span>Enemies</span>
            </div>
            <p className="mt-1 font-mono text-base font-semibold text-slate-900">
              {level.enemies.length}
            </p>
            <p className="text-[10px] text-slate-400">Hazard entities</p>
          </div>

          {/* Coins */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Coins className="size-3.5 text-yellow-600" />
              <span>Coins</span>
            </div>
            <p className="mt-1 font-mono text-base font-semibold text-slate-900">
              {level.coins.length}
            </p>
            <p className="text-[10px] text-slate-400">Collectibles</p>
          </div>

          {/* Spikes */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Zap className="size-3.5 text-purple-600" />
              <span>Spikes</span>
            </div>
            <p className="mt-1 font-mono text-base font-semibold text-slate-900">
              {level.spikes.length}
            </p>
            <p className="text-[10px] text-slate-400">Static hazards</p>
          </div>
        </div>
      </div>

      {/* Detection Mapping Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Detection &rarr; Entity Mapping
          </h4>
          <span className="text-xs font-medium text-slate-600">
            {detections.length} raw detection(s)
          </span>
        </div>

        {detections.length === 0 ? (
          <p className="py-2 text-xs text-slate-500 italic">
            No Phase 4 computer vision detections currently recorded for this project.
          </p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs pr-1">
            {detections.map((d) => (
              <div
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-1.5 font-mono text-[11px]"
                key={d.id}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 capitalize">
                    {d.className}
                  </span>
                  <span className="rounded bg-white px-1.5 py-0.2 border border-slate-200 text-[10px] text-slate-500">
                    {(d.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <span className="text-slate-500">
                  {d.boundingBox.width}&times;{d.boundingBox.height} at ({d.boundingBox.x},{d.boundingBox.y})
                </span>
              </div>
            ))}
          </div>
        )}

        {unmappedDetections.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
            <p className="font-semibold">
              Unmapped detections ({unmappedDetections.length}):
            </p>
            <p className="text-[11px] text-amber-800">
              The following detected objects do not match any DRAW2GAME level class:{" "}
              {unmappedDetections.map((u) => u.className).join(", ")}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
