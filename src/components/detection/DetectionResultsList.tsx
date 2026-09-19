import {
  AlertCircle,
  Cpu,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CLASS_COLORS,
  CLASS_LABELS,
  DRAW2GAME_CLASSES,
  type DetectionPrediction,
  type ModelStatus,
} from "@/types/detection";

interface DetectionResultsListProps {
  confidenceThreshold: number;
  iouThreshold: number;
  isDetecting: boolean;
  modelMessage?: string | undefined;
  modelStatus: ModelStatus;
  onClearDetections: () => void;
  onConfidenceChange: (val: number) => void;
  onIouChange: (val: number) => void;
  onRunDetection: () => void;
  predictions: DetectionPrediction[];
}

export function DetectionResultsList({
  confidenceThreshold,
  iouThreshold,
  isDetecting,
  modelMessage,
  modelStatus,
  onClearDetections,
  onConfidenceChange,
  onIouChange,
  onRunDetection,
  predictions,
}: DetectionResultsListProps) {
  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
            <Cpu aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              YOLOv8 Detection
            </h3>
            <p className="text-xs text-slate-500">
              ONNX Runtime Web inference engine
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
            modelStatus === "ready"
              ? "bg-emerald-50 text-emerald-700"
              : modelStatus === "loading"
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          {modelStatus === "not-configured" ? "Unconfigured" : modelStatus}
        </span>
      </div>

      {/* Model Status / Limitation Alert */}
      {modelStatus === "not-configured" && (
        <div
          aria-live="polite"
          className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-2"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-800">
                YOLOv8n model is not configured yet
              </p>
              <p className="text-amber-700 leading-relaxed">
                {modelMessage ||
                  "A verified custom-trained model for the 6 DRAW2GAME game-object classes is required for live inference. No fake predictions are simulated."}
              </p>
            </div>
          </div>

          <div className="pt-1.5 border-t border-amber-200/60">
            <p className="font-medium text-amber-800 mb-1">Target Object Classes:</p>
            <div className="flex flex-wrap gap-1">
              {DRAW2GAME_CLASSES.map((cls) => (
                <span
                  className="rounded bg-white/80 border border-amber-200 px-1.5 py-0.5 text-[11px] font-medium text-amber-900 capitalize"
                  key={cls}
                >
                  {cls}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {modelStatus === "error" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
          <p>{modelMessage || "Error during model initialization or inference."}</p>
        </div>
      )}

      {/* Sliders: Confidence and IoU */}
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-slate-700">Confidence Threshold:</span>
          <input
            className="w-32 accent-brand-600"
            disabled={modelStatus !== "ready" || isDetecting}
            max={0.95}
            min={0.1}
            onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
            step={0.05}
            type="range"
            value={confidenceThreshold}
          />
          <span className="w-8 text-right font-mono font-medium text-slate-800">
            {Math.round(confidenceThreshold * 100)}%
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-slate-700">NMS IoU Threshold:</span>
          <input
            className="w-32 accent-brand-600"
            disabled={modelStatus !== "ready" || isDetecting}
            max={0.8}
            min={0.2}
            onChange={(e) => onIouChange(parseFloat(e.target.value))}
            step={0.05}
            type="range"
            value={iouThreshold}
          />
          <span className="w-8 text-right font-mono font-medium text-slate-800">
            {Math.round(iouThreshold * 100)}%
          </span>
        </div>
      </div>

      {/* Detection Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <Button
          className="flex-1 gap-2"
          disabled={modelStatus !== "ready" || isDetecting}
          onClick={onRunDetection}
          size="sm"
        >
          {isDetecting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {modelStatus === "not-configured" ? "Model Unconfigured" : "Run Detection"}
        </Button>

        {predictions.length > 0 && (
          <Button
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            disabled={isDetecting}
            onClick={onClearDetections}
            size="sm"
            variant="ghost"
          >
            <Trash2 className="size-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Detection Results List */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Detections ({predictions.length})
          </h4>
        </div>

        {predictions.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">
            No objects detected.
          </p>
        ) : (
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {predictions.map((pred) => {
              const colors = CLASS_COLORS[pred.className];
              return (
                <div
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2 text-xs transition hover:bg-slate-50"
                  key={pred.id}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: colors.border }}
                    />
                    <span className="font-semibold text-slate-800">
                      {CLASS_LABELS[pred.className] ?? pred.className}
                    </span>
                    <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500 border border-slate-200">
                      {(pred.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <span className="font-mono text-[11px] text-slate-400">
                    {pred.boundingBox.width}×{pred.boundingBox.height} at ({pred.boundingBox.x},{pred.boundingBox.y})
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
