/**
 * DRAW2GAME — Phase 11: Game Recognition & Game-Type Detection
 * User-Facing Game Recognition Panel
 *
 * Displays detected game type, confidence score, structural evidence,
 * playability status (Playable vs Extension Point vs Unknown),
 * and provides manual game-type override controls.
 */

import { useCallback, useEffect, useMemo } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  EXTENSION_GAME_TYPES,
  type GameType,
} from "@/game/core/game-definition";
import { GameRecognizer } from "@/game/recognition/game-recognizer";
import type { GameRecognitionRecord } from "@/game/recognition/types";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/project-store";
import type { DetectionPrediction } from "@/types/detection";

const GAME_TYPE_LABELS: Record<GameType | "unknown", string> = {
  carrom: "Carrom",
  chess: "Chess",
  ludo: "Ludo",
  platformer: "2D Platformer",
  pool: "Pool / Billiards",
  puzzle: "Puzzle",
  racing: "Racing",
  shooter: "Shooter",
  sports: "Sports",
  unknown: "Unknown",
};

interface GameRecognitionPanelProps {
  canvas?: HTMLCanvasElement | null | undefined;
  imageDimensions?: { height: number; width: number } | undefined;
  predictions: DetectionPrediction[];
  projectId: string;
}

export function GameRecognitionPanel({
  canvas,
  imageDimensions,
  predictions,
  projectId,
}: GameRecognitionPanelProps) {
  const projectRecognitions = useProjectStore(
    (state) => state.projectRecognitions,
  );
  const setProjectRecognition = useProjectStore(
    (state) => state.setProjectRecognition,
  );
  const setUserSelectedGameType = useProjectStore(
    (state) => state.setUserSelectedGameType,
  );

  const savedRecord = projectRecognitions[projectId];
  const userOverride = savedRecord?.userSelectedGameType;

  // Run recognition whenever predictions or dimensions change
  const autoResult = useMemo(() => {
    return GameRecognizer.recognize({
      canvas,
      imageDimensions,
      predictions,
    });
  }, [canvas, imageDimensions, predictions]);

  // Sync auto-detected result to store if not user-overridden
  useEffect(() => {
    if (!userOverride) {
      const record: GameRecognitionRecord = {
        detectedGameType: autoResult.gameType,
        recognitionAlternatives: autoResult.alternatives,
        recognitionConfidence: autoResult.confidence,
        recognitionEvidence: autoResult.evidence,
        recognitionSource: autoResult.source,
        recognitionWarnings: autoResult.warnings,
        recognizedAt: new Date().toISOString(),
        suggestedAction: autoResult.suggestedAction,
        userSelectedGameType: undefined,
      };
      setProjectRecognition(projectId, record);
    }
  }, [autoResult, projectId, setProjectRecognition, userOverride]);

  // Active game type (user override takes precedence)
  const activeGameType = userOverride ?? autoResult.gameType;
  const isManuallyOverridden = Boolean(userOverride);
  const isPlayable = activeGameType === "platformer" || activeGameType === "chess";
  const isUnknown = activeGameType === "unknown";

  const confidencePercent = isManuallyOverridden
    ? 100
    : Math.round(autoResult.confidence * 100);

  const evidence = isManuallyOverridden
    ? [`User manually designated game type as ${GAME_TYPE_LABELS[userOverride!]}`]
    : autoResult.evidence;

  const warnings = isManuallyOverridden
    ? !isPlayable
      ? [
          `Gameplay engine for "${userOverride}" is an architecture extension point coming in a future phase.`,
        ]
      : []
    : autoResult.warnings;

  // Handler: Manual Override Selection
  const handleSelectGameType = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = e.target.value as GameType | "auto";
      if (selected === "auto") {
        const record: GameRecognitionRecord = {
          detectedGameType: autoResult.gameType,
          recognitionAlternatives: autoResult.alternatives,
          recognitionConfidence: autoResult.confidence,
          recognitionEvidence: autoResult.evidence,
          recognitionSource: autoResult.source,
          recognitionWarnings: autoResult.warnings,
          recognizedAt: new Date().toISOString(),
          suggestedAction: autoResult.suggestedAction,
          userSelectedGameType: undefined,
        };
        setProjectRecognition(projectId, record);
      } else {
        setUserSelectedGameType(projectId, selected);
      }
    },
    [autoResult, projectId, setProjectRecognition, setUserSelectedGameType],
  );

  // Handler: Reset to Auto-Detected
  const handleResetToAuto = useCallback(() => {
    const record: GameRecognitionRecord = {
      detectedGameType: autoResult.gameType,
      recognitionAlternatives: autoResult.alternatives,
      recognitionConfidence: autoResult.confidence,
      recognitionEvidence: autoResult.evidence,
      recognitionSource: autoResult.source,
      recognitionWarnings: autoResult.warnings,
      recognizedAt: new Date().toISOString(),
      suggestedAction: autoResult.suggestedAction,
      userSelectedGameType: undefined,
    };
    setProjectRecognition(projectId, record);
  }, [autoResult, projectId, setProjectRecognition]);

  return (
    <div
      aria-label="Game Type Recognition Panel"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
            <Compass aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Game Type Recognition
            </h3>
            <p className="text-xs text-slate-500">
              Structural analysis & genre classifier
            </p>
          </div>
        </div>

        {/* Playable / Status Badge */}
        {isPlayable ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="size-3.5" />
            Playable
          </span>
        ) : isUnknown ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            <HelpCircle className="size-3.5" />
            Uncertain
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            <Clock className="size-3.5" />
            Coming in Future Phase
          </span>
        )}
      </div>

      {/* Main Detection Result Display */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {isManuallyOverridden ? "Manually Selected" : "Detected Game Type"}
            </p>
            <h4 className="text-base font-bold text-slate-900">
              {isUnknown
                ? "Unknown / Ambiguous"
                : GAME_TYPE_LABELS[activeGameType]}
            </h4>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Confidence
            </p>
            <p className="font-mono text-sm font-bold text-slate-700">
              {confidencePercent}%
            </p>
          </div>
        </div>

        {/* Confidence Meter Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full transition-all duration-300 ${
              isPlayable
                ? "bg-emerald-500"
                : isUnknown
                  ? "bg-amber-400"
                  : "bg-indigo-500"
            }`}
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>

      {/* Structural Evidence List */}
      <div className="space-y-1.5 text-xs">
        <p className="font-semibold text-slate-700">Visual Evidence:</p>
        {evidence.length === 0 ? (
          <p className="text-slate-400 italic">No structural signals detected yet.</p>
        ) : (
          <ul className="space-y-1 pl-1">
            {evidence.map((item, idx) => (
              <li
                className="flex items-start gap-1.5 text-slate-600 leading-relaxed"
                key={idx}
              >
                <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Warnings & Suggestions */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 p-2.5 text-xs text-amber-800 space-y-1">
          <div className="flex items-start gap-1.5 font-medium">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5 text-amber-600" />
            <span>Notice:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-700">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Manual Override Controls */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <label
            className="text-xs font-semibold text-slate-700"
            htmlFor="game-type-override-select"
          >
            Manual Game Type Override:
          </label>
          {isManuallyOverridden && (
            <button
              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700 hover:underline"
              onClick={handleResetToAuto}
              type="button"
            >
              <RotateCcw className="size-3" />
              Reset to Auto
            </button>
          )}
        </div>

        <select
          aria-label="Select manual game type override"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          id="game-type-override-select"
          onChange={handleSelectGameType}
          value={userOverride ?? "auto"}
        >
          <option value="auto">
            Auto-Detect ({isUnknown ? "Unknown" : GAME_TYPE_LABELS[autoResult.gameType]})
          </option>
          <optgroup label="Playable Game Types">
            <option value="platformer">2D Platformer (Playable)</option>
            <option value="chess">Chess (Playable)</option>
          </optgroup>
          <optgroup label="Architecture Extension Points (Future Engines)">
            {EXTENSION_GAME_TYPES.map((type) => (
              <option key={type} value={type}>
                {GAME_TYPE_LABELS[type]} (Extension Point)
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Primary Action Button */}
      <div className="pt-1">
        {isPlayable ? (
          activeGameType === "chess" ? (
            <Button
              asChild
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
              size="sm"
            >
              <Link to={`/projects/${projectId}/play`}>
                <Sparkles className="size-4" />
                <span>Play Chess Now</span>
                <ArrowRight className="size-4 ml-auto" />
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
              size="sm"
            >
              <Link to={`/projects/${projectId}/json`}>
                <Sparkles className="size-4" />
                <span>Convert to Level JSON</span>
                <ArrowRight className="size-4 ml-auto" />
              </Link>
            </Button>
          )
        ) : isUnknown ? (
          <div className="rounded-lg bg-slate-50 p-2.5 text-center text-xs text-slate-500 border border-slate-200">
            <p>
              Layout is uncertain. You can add platforms to make it a Platformer,
              or manually select <strong>2D Platformer</strong> above to generate a playable level.
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-200 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5 text-amber-900">
              <Clock className="size-3.5 shrink-0" />
              Recognized as {GAME_TYPE_LABELS[activeGameType]}
            </p>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              The architecture supports recognizing {GAME_TYPE_LABELS[activeGameType]},
              but its dedicated engine is scheduled for future phases.
            </p>
            <Button
              className="w-full mt-1 bg-amber-700 hover:bg-amber-600 text-white text-xs h-7"
              onClick={() => setUserSelectedGameType(projectId, "platformer")}
              size="sm"
              type="button"
            >
              Switch to Platformer to Play Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
