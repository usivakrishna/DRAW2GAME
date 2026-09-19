import { useEffect, useRef, useState } from "react";
import { Eye, Image as ImageIcon, Layers, Wand2 } from "lucide-react";
import {
  CLASS_COLORS,
  CLASS_LABELS,
  type DetectionPrediction,
} from "@/types/detection";

interface DetectionOverlayCanvasProps {
  imageElement: HTMLImageElement | null;
  originalBlobUrl: string | null;
  predictions: DetectionPrediction[];
  preprocessedCanvas: HTMLCanvasElement | null;
}

type ViewMode = "original" | "preprocessed" | "detection";

export function DetectionOverlayCanvas({
  imageElement,
  originalBlobUrl,
  predictions,
  preprocessedCanvas,
}: DetectionOverlayCanvasProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(
    predictions.length > 0 ? "detection" : "original",
  );
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const preprocessedContainerRef = useRef<HTMLDivElement>(null);

  // When preprocessed canvas updates and is viewed, attach it
  useEffect(() => {
    if (viewMode === "preprocessed" && preprocessedCanvas && preprocessedContainerRef.current) {
      preprocessedContainerRef.current.innerHTML = "";
      preprocessedCanvas.className = "max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow-sm";
      preprocessedContainerRef.current.appendChild(preprocessedCanvas);
    }
  }, [viewMode, preprocessedCanvas]);

  // Render bounding box overlays on canvas
  useEffect(() => {
    if (viewMode !== "detection") return;

    const canvas = overlayCanvasRef.current;
    if (!canvas || !imageElement) return;

    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background original image
    ctx.drawImage(imageElement, 0, 0);

    // Draw detections
    for (const pred of predictions) {
      const { x, y, width, height } = pred.boundingBox;
      const colors = CLASS_COLORS[pred.className] ?? {
        border: "#6366f1",
        fill: "rgba(99, 102, 241, 0.15)",
        text: "text-indigo-700",
      };

      // Fill area
      ctx.fillStyle = colors.fill;
      ctx.fillRect(x, y, width, height);

      // Stroke boundary
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = Math.max(2, Math.round(canvas.width / 400));
      ctx.strokeRect(x, y, width, height);

      // Label background & text
      const labelText = `${CLASS_LABELS[pred.className] ?? pred.className} ${(
        pred.confidence * 100
      ).toFixed(0)}%`;
      const fontSize = Math.max(14, Math.round(canvas.width / 45));
      ctx.font = `600 ${fontSize}px sans-serif`;

      const textMetrics = ctx.measureText(labelText);
      const textPadding = 6;
      const labelWidth = textMetrics.width + textPadding * 2;
      const labelHeight = fontSize + textPadding * 1.5;

      const labelY = Math.max(labelHeight, y);

      ctx.fillStyle = colors.border;
      ctx.fillRect(x, labelY - labelHeight, labelWidth, labelHeight);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(labelText, x + textPadding, labelY - textPadding);
    }
  }, [imageElement, predictions, viewMode]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Top Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-1 rounded-xl bg-slate-200/60 p-1">
          <button
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "original"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setViewMode("original")}
            type="button"
          >
            <ImageIcon className="size-3.5" />
            Original Sketch
          </button>

          <button
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "preprocessed"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setViewMode("preprocessed")}
            type="button"
          >
            <Wand2 className="size-3.5" />
            OpenCV Preprocessed
          </button>

          <button
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "detection"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setViewMode("detection")}
            type="button"
          >
            <Layers className="size-3.5" />
            Detection Overlays
            {predictions.length > 0 && (
              <span className="rounded-full bg-brand-100 px-1.5 py-0.2 text-[10px] text-brand-700 font-bold">
                {predictions.length}
              </span>
            )}
          </button>
        </div>

        {imageElement && (
          <span className="text-xs text-slate-500 font-medium">
            {imageElement.naturalWidth} × {imageElement.naturalHeight} px
          </span>
        )}
      </div>

      {/* Frame Display */}
      <div className="relative flex items-center justify-center p-4 sm:p-6 bg-slate-900/5 min-h-[380px] max-h-[600px] overflow-hidden">
        {viewMode === "original" && originalBlobUrl && (
          <div className="relative max-h-[540px] max-w-full flex items-center justify-center rounded-xl overflow-hidden shadow-sm border border-slate-200/80 bg-white">
            <img
              alt="Original sketch"
              className="max-h-[500px] w-auto max-w-full object-contain select-none"
              src={originalBlobUrl}
            />
          </div>
        )}

        {viewMode === "preprocessed" && (
          <div className="relative max-h-[540px] max-w-full flex items-center justify-center rounded-xl overflow-hidden shadow-sm border border-slate-200/80 bg-white p-2">
            {preprocessedCanvas ? (
              <div ref={preprocessedContainerRef} />
            ) : (
              <div className="py-20 text-center text-sm text-slate-400">
                <Wand2 className="mx-auto size-8 text-slate-300 mb-2" />
                No preprocessing applied yet. Click &quot;Apply Preprocessing&quot; in the panel.
              </div>
            )}
          </div>
        )}

        {viewMode === "detection" && (
          <div className="relative max-h-[540px] max-w-full flex items-center justify-center rounded-xl overflow-hidden shadow-sm border border-slate-200/80 bg-white">
            {predictions.length === 0 ? (
              <div className="relative">
                {originalBlobUrl && (
                  <img
                    alt="Original sketch"
                    className="max-h-[500px] w-auto max-w-full object-contain select-none opacity-85"
                    src={originalBlobUrl}
                  />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/30 backdrop-blur-[1px] p-6 text-center text-white">
                  <Eye className="size-8 mb-2 opacity-80" />
                  <p className="text-sm font-semibold">No active detections</p>
                  <p className="text-xs text-slate-200 max-w-xs mt-1">
                    Run detection or configure the trained YOLOv8 model in the controls panel.
                  </p>
                </div>
              </div>
            ) : (
              <canvas
                className="max-h-[500px] w-auto max-w-full object-contain select-none"
                ref={overlayCanvasRef}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
