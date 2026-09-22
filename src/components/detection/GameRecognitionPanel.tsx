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
import { UniversalGameGenerator } from "@/game/generation";
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
  const projectGameDefinitions = useProjectStore(
    (state) => state.projectGameDefinitions,
  );
  const projectRecognitions = useProjectStore(
    (state) => state.projectRecognitions,
  );
  const setProjectGameDefinition = useProjectStore(
    (state) => state.setProjectGameDefinition,
  );
  const setProjectRecognition = useProjectStore(
    (state) => state.setProjectRecognition,
  );
  const setUserSelectedGameType = useProjectStore(
    (state) => state.setUserSelectedGameType,
  );

  const currentGameDefinition = projectGameDefinitions[projectId];
  const savedRecord = projectRecognitions[projectId];
  const userOverride = savedRecord?.userSelectedGameType;

  const dimWidth = imageDimensions?.width;
  const dimHeight = imageDimensions?.height;

  // Run recognition whenever predictions or dimensions change
  const autoResult = useMemo(() => {
    return GameRecognizer.recognize({
      canvas,
      imageDimensions:
        dimWidth && dimHeight ? { height: dimHeight, width: dimWidth } : undefined,
      predictions,
    });
  }, [canvas, dimHeight, dimWidth, predictions]);

  // Sync auto-detected result to store if not user-overridden and if changed
  useEffect(() => {
    if (userOverride) return;

    if (
      savedRecord &&
      savedRecord.detectedGameType === autoResult.gameType &&
      savedRecord.recognitionConfidence === autoResult.confidence &&
      savedRecord.suggestedAction === autoResult.suggestedAction
    ) {
      return;
    }

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
  }, [
    autoResult.alternatives,
    autoResult.confidence,
    autoResult.evidence,
    autoResult.gameType,
    autoResult.source,
    autoResult.suggestedAction,
    autoResult.warnings,
    projectId,
    savedRecord,
    setProjectRecognition,
    userOverride,
  ]);

  // Active game type (user override takes precedence)
  const activeGameType = userOverride ?? autoResult.gameType;
  const isManuallyOverridden = Boolean(userOverride);
  const isPlayable = activeGameType === "platformer" || activeGameType === "chess";
  const isUnknown = activeGameType === "unknown";

  // Phase 13: Universal Game Generation pipeline execution
  const generationResult = useMemo(() => {
    const targetType = isManuallyOverridden
      ? userOverride
      : (isUnknown ? undefined : activeGameType);

    return UniversalGameGenerator.generateGame({
      canvas,
      predictions,
      projectId,
      source: "detection",
      sourceDimensions: imageDimensions,
      targetGameType: targetType,
    });
  }, [activeGameType, canvas, imageDimensions, isManuallyOverridden, isUnknown, predictions, projectId, userOverride]);

  useEffect(() => {
    if (generationResult.success && generationResult.gameDefinition && !currentGameDefinition) {
      setProjectGameDefinition(projectId, generationResult.gameDefinition);
    }
  }, [currentGameDefinition, generationResult.gameDefinition, generationResult.success, projectId, setProjectGameDefinition]);

  const confidencePercent = isManuallyOverridden
    ? 100
    : Math.round(autoResult.confidence * 100);

  const evidence = isManuallyOverridden
    ? [`User manually designated game type as ${GAME_TYPE_LABELS[userOverride!]}`]
    : autoResult.evidence;

  const warnings = isManuallyOverridden
    ? !isPlayable
      ? [
          `Gameplay capabilities and rules for "${userOverride}" are an architecture extension point coming in a future phase.`,
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

      {/* Low confidence / Uncertainty notification */}
      {(autoResult.confidence < 0.6 || isUnknown) && !isManuallyOverridden && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900">
            <AlertCircle className="size-4 text-amber-600 shrink-0" />
            <span>Game type could not be confidently recognized ({confidencePercent}%)</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            The visual evidence does not match a single genre with high confidence. Select your intended game type below to proceed with generation.
          </p>
        </div>
      )}

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
          <optgroup label="Architecture Extension Points (Future Capabilities)">
            {EXTENSION_GAME_TYPES.map((type) => (
              <option key={type} value={type}>
                {GAME_TYPE_LABELS[type]} (Extension Point)
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Phase 13: Universal Game Definition Architecture Status */}
      <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-brand-600" />
            <span className="text-xs font-semibold text-slate-800">
              Universal Game Definition
            </span>
          </div>
          {generationResult.success ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="size-3" />
              Valid Definition
            </span>
          ) : generationResult.isExtensionPoint ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
              <Clock className="size-3" />
              Extension Point
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full">
              <AlertCircle className="size-3" />
              Blocked
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed">
          Target: <strong className="text-slate-800">{GAME_TYPE_LABELS[generationResult.gameType] || activeGameType}</strong>
          {generationResult.metadata?.generatorId && ` via ${generationResult.metadata.generatorId}`}
        </p>

        {/* Required Runtime Capabilities */}
        {generationResult.gameDefinition?.capabilities && (
          <div className="space-y-1 pt-1">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Active Capabilities:</p>
            <div className="flex flex-wrap gap-1">
              {generationResult.gameDefinition.capabilities.map((cap) => (
                <span
                  className="inline-flex items-center rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-800"
                  key={cap}
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Generation Errors */}
        {generationResult.errors.length > 0 && !generationResult.isExtensionPoint && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-[11px] text-rose-800 space-y-1">
            <p className="font-semibold flex items-center gap-1 text-rose-900">
              <AlertCircle className="size-3" />
              Generation Issues:
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              {generationResult.errors.map((err, i) => (
                <li key={i}>{err.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Generation Warnings */}
        {generationResult.warnings.length > 0 && (
          <div className="rounded-lg bg-slate-100/70 border border-slate-200 p-2 text-[11px] text-slate-600 space-y-0.5">
            <p className="font-medium text-slate-700">Notices:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
              {generationResult.warnings.map((w, i) => (
                <li key={i}>{w.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="pt-1">
        {isPlayable ? (
          <div className="space-y-2">
            <Button
              asChild
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs"
              size="sm"
            >
              <Link
                onClick={() => {
                  if (generationResult.success && generationResult.gameDefinition) {
                    setProjectGameDefinition(projectId, generationResult.gameDefinition);
                  }
                }}
                to={`/projects/${projectId}/play`}
              >
                <Sparkles className="size-4" />
                <span>Play {GAME_TYPE_LABELS[activeGameType]} Now</span>
                <ArrowRight className="size-4 ml-auto" />
              </Link>
            </Button>

            {activeGameType === "platformer" && (
              <Button
                asChild
                className="w-full text-xs text-slate-600 hover:text-slate-900"
                onClick={() => {
                  if (generationResult.success && generationResult.gameDefinition) {
                    setProjectGameDefinition(projectId, generationResult.gameDefinition);
                  }
                }}
                size="sm"
                variant="ghost"
              >
                <Link to={`/projects/${projectId}/json`}>
                  <span>Inspect / Edit Level JSON</span>
                  <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        ) : isUnknown ? (
          <div className="rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-600 border border-slate-200 space-y-2">
            <p className="font-medium text-slate-800">
              Select a game type to generate:
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                onClick={() => setUserSelectedGameType(projectId, "platformer")}
                size="sm"
                type="button"
              >
                2D Platformer
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8"
                onClick={() => setUserSelectedGameType(projectId, "chess")}
                size="sm"
                type="button"
              >
                Chess
              </Button>
            </div>
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
