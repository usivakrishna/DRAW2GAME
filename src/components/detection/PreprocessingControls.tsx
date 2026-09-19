import { CheckCircle2, Loader2, RotateCcw, Sliders, Wand2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OpenCvStatus, PreprocessingOptions } from "@/types/detection";

interface PreprocessingControlsProps {
  isProcessing: boolean;
  onApply: () => void;
  onOptionsChange: (options: PreprocessingOptions) => void;
  onReset: () => void;
  onRetryOpenCv: () => void;
  openCvError?: string | null;
  openCvStatus: OpenCvStatus;
  options: PreprocessingOptions;
  stepsApplied: string[];
}

export function PreprocessingControls({
  isProcessing,
  onApply,
  onOptionsChange,
  onReset,
  onRetryOpenCv,
  openCvError,
  openCvStatus,
  options,
  stepsApplied,
}: PreprocessingControlsProps) {
  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header & OpenCV Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Wand2 aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              OpenCV.js Preprocessing
            </h3>
            <p className="text-xs text-slate-500">
              Browser-side noise reduction & edge enhancement
            </p>
          </div>
        </div>

        <div>
          {openCvStatus === "loading" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              <Loader2 className="size-3 animate-spin" />
              Loading OpenCV...
            </span>
          )}
          {openCvStatus === "ready" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="size-3.5" />
              OpenCV Ready
            </span>
          )}
          {openCvStatus === "error" && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                <XCircle className="size-3.5" />
                OpenCV Error
              </span>
              <Button onClick={onRetryOpenCv} size="sm" variant="ghost">
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>

      {openCvStatus === "error" && openCvError && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
          {openCvError}
        </p>
      )}

      {/* Interactive Pipeline Controls */}
      <div className="space-y-4 text-sm">
        {/* 1. Grayscale */}
        <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
          <div className="space-y-0.5">
            <span className="font-medium text-slate-800">Grayscale Conversion</span>
            <p className="text-xs text-slate-500">Converts color sketch to single-channel intensity</p>
          </div>
          <input
            checked={options.grayscale}
            className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            disabled={openCvStatus !== "ready"}
            onChange={(e) =>
              onOptionsChange({ ...options, grayscale: e.target.checked })
            }
            type="checkbox"
          />
        </label>

        {/* 2. Gaussian Blur */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
            <div className="space-y-0.5">
              <span className="font-medium text-slate-800">Gaussian Noise Reduction</span>
              <p className="text-xs text-slate-500">Smooths pencil grain and surface texture</p>
            </div>
            <input
              checked={options.gaussianBlur}
              className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              disabled={openCvStatus !== "ready"}
              onChange={(e) =>
                onOptionsChange({ ...options, gaussianBlur: e.target.checked })
              }
              type="checkbox"
            />
          </label>

          {options.gaussianBlur && (
            <div className="flex items-center justify-between gap-4 pl-4 pt-1">
              <span className="text-xs text-slate-600">Kernel Size:</span>
              <div className="flex gap-1.5">
                {[3, 5, 7].map((k) => (
                  <button
                    className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                      options.blurKernelSize === k
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                    key={k}
                    onClick={() =>
                      onOptionsChange({ ...options, blurKernelSize: k })
                    }
                    type="button"
                  >
                    {k}×{k}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Thresholding */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
            <div className="space-y-0.5">
              <span className="font-medium text-slate-800">Binarization / Thresholding</span>
              <p className="text-xs text-slate-500">Separates sketch ink lines from paper background</p>
            </div>
            <input
              checked={options.thresholding}
              className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              disabled={openCvStatus !== "ready"}
              onChange={(e) =>
                onOptionsChange({ ...options, thresholding: e.target.checked })
              }
              type="checkbox"
            />
          </label>

          {options.thresholding && (
            <div className="space-y-2.5 pl-4 pt-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600">Method:</span>
                <div className="flex gap-1.5">
                  <button
                    className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                      options.thresholdType === "otsu"
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                    onClick={() =>
                      onOptionsChange({ ...options, thresholdType: "otsu" })
                    }
                    type="button"
                  >
                    Otsu (Auto)
                  </button>
                  <button
                    className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                      options.thresholdType === "binary"
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                    onClick={() =>
                      onOptionsChange({ ...options, thresholdType: "binary" })
                    }
                    type="button"
                  >
                    Manual
                  </button>
                </div>
              </div>

              {options.thresholdType === "binary" && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-600">Cutoff:</span>
                  <input
                    className="w-32 accent-brand-600"
                    max={255}
                    min={0}
                    onChange={(e) =>
                      onOptionsChange({
                        ...options,
                        thresholdValue: Number(e.target.value),
                      })
                    }
                    type="range"
                    value={options.thresholdValue}
                  />
                  <span className="w-8 text-right font-mono text-xs text-slate-700">
                    {options.thresholdValue}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Canny Edge Detection */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
            <div className="space-y-0.5">
              <span className="font-medium text-slate-800">Canny Edge Detection</span>
              <p className="text-xs text-slate-500">Traces geometric contours and boundaries</p>
            </div>
            <input
              checked={options.edgeDetection}
              className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              disabled={openCvStatus !== "ready"}
              onChange={(e) =>
                onOptionsChange({ ...options, edgeDetection: e.target.checked })
              }
              type="checkbox"
            />
          </label>

          {options.edgeDetection && (
            <div className="space-y-2 pl-4 pt-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-600">Low Thresh:</span>
                <input
                  className="w-28 accent-brand-600"
                  max={255}
                  min={0}
                  onChange={(e) =>
                    onOptionsChange({
                      ...options,
                      cannyThreshold1: Number(e.target.value),
                    })
                  }
                  type="range"
                  value={options.cannyThreshold1}
                />
                <span className="w-8 text-right font-mono text-xs text-slate-700">
                  {options.cannyThreshold1}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-600">High Thresh:</span>
                <input
                  className="w-28 accent-brand-600"
                  max={255}
                  min={0}
                  onChange={(e) =>
                    onOptionsChange({
                      ...options,
                      cannyThreshold2: Number(e.target.value),
                    })
                  }
                  type="range"
                  value={options.cannyThreshold2}
                />
                <span className="w-8 text-right font-mono text-xs text-slate-700">
                  {options.cannyThreshold2}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Applied Pipeline Steps */}
      {stepsApplied.length > 0 && (
        <div className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-100">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 mb-1.5">
            <Sliders className="size-3 text-slate-400" />
            Applied stages:
          </div>
          <ul className="space-y-1 text-slate-500 pl-4 list-disc">
            {stepsApplied.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <Button
          disabled={openCvStatus !== "ready" || isProcessing}
          onClick={onReset}
          size="sm"
          variant="outline"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>

        <Button
          className="gap-1.5"
          disabled={openCvStatus !== "ready" || isProcessing}
          onClick={onApply}
          size="sm"
        >
          {isProcessing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Wand2 className="size-4" />
          )}
          Apply Preprocessing
        </Button>
      </div>
    </div>
  );
}
