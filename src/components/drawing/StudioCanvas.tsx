import { useState, type RefObject } from "react";
import { Grid3X3, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudioCanvasProps {
  canvasContainerRef: RefObject<HTMLDivElement | null>;
  canvasElementRef: RefObject<HTMLCanvasElement | null>;
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
}

export function StudioCanvas({
  canvasContainerRef,
  canvasElementRef,
  onResetView,
  onZoomIn,
  onZoomOut,
  zoom,
}: StudioCanvasProps) {
  const [showGrid, setShowGrid] = useState(true);

  return (
    <section
      aria-label="Drawing canvas"
      className="relative flex min-h-[480px] min-w-0 flex-1 flex-col bg-slate-100 p-3 sm:p-4"
    >
      {/* Outer wrapper: position relative so absolute children are correctly anchored */}
      <div className="relative flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Grid overlay – sits behind the Fabric canvas via z-index 0 */}
        {showGrid && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(148, 163, 184, 0.2) 1px, transparent 1px), " +
                "linear-gradient(to bottom, rgba(148, 163, 184, 0.2) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              opacity: 0.8,
            }}
          />
        )}

        {/*
         * CRITICAL: Do NOT apply z-index or position classes here.
         * Fabric.js copies the className of this element to its upper-canvas.
         * Any z-index or position class would be duplicated onto the upper-canvas
         * and break Fabric's internal stacking / event capture.
         *
         * The ref container div below matches what Fabric expects as its parent.
         * Fabric will inject its own canvas-container div (position:relative) here.
         */}
        <div
          className="absolute inset-0 z-10"
          ref={canvasContainerRef}
          style={{ overflow: "hidden" }}
        >
          {/* Fabric.js wraps this element itself — keep className clean */}
          <canvas ref={canvasElementRef} />
        </div>

        {/* Canvas controls – above everything with z-20 */}
        <div className="absolute right-3 bottom-3 z-20 flex items-center gap-1 rounded-lg border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
          <Button
            aria-label={showGrid ? "Hide grid background" : "Show grid background"}
            aria-pressed={showGrid}
            className={showGrid ? "bg-slate-100 text-slate-900" : ""}
            onClick={() => setShowGrid((prev) => !prev)}
            size="icon"
            title={showGrid ? "Hide grid" : "Show grid"}
            variant="ghost"
          >
            <Grid3X3 aria-hidden="true" className="size-4" />
          </Button>
          <div className="h-4 w-px bg-slate-200" />
          <Button
            aria-label="Zoom out"
            onClick={onZoomOut}
            size="icon"
            title="Zoom out"
            variant="ghost"
          >
            <ZoomOut aria-hidden="true" className="size-4" />
          </Button>
          <span
            aria-live="polite"
            className="min-w-12 text-center text-xs font-semibold text-slate-600 tabular-nums"
          >
            {Math.round(zoom * 100)}%
          </span>
          <Button
            aria-label="Zoom in"
            onClick={onZoomIn}
            size="icon"
            title="Zoom in"
            variant="ghost"
          >
            <ZoomIn aria-hidden="true" className="size-4" />
          </Button>
          <Button
            aria-label="Reset view"
            onClick={onResetView}
            size="icon"
            title="Reset view"
            variant="ghost"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
          </Button>
        </div>

        {/* Hint text */}
        <p className="pointer-events-none absolute bottom-4 left-4 z-20 hidden rounded-md border border-slate-200 bg-white/95 px-2.5 py-1.5 text-xs text-slate-500 shadow-sm backdrop-blur sm:block">
          Scroll to zoom · Hold Space or click Pan to move the level
        </p>
      </div>
    </section>
  );
}
