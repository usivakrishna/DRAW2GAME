import type { RefObject } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
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
  return (
    <section aria-label="Drawing canvas" className="min-h-[480px] min-w-0 bg-slate-100 p-3 sm:p-4">
      <div
        className="studio-fabric-canvas relative h-full min-h-[450px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        ref={canvasContainerRef}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148, 163, 184, 0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.18) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <canvas className="relative z-10 block" ref={canvasElementRef} />

        <div className="absolute right-3 bottom-3 z-20 flex items-center gap-1 rounded-lg border border-slate-200 bg-white/95 p-1 shadow-sm backdrop-blur">
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

        <p className="pointer-events-none absolute bottom-4 left-4 z-20 hidden rounded-md border border-slate-200 bg-white/95 px-2.5 py-1.5 text-xs text-slate-500 shadow-sm backdrop-blur sm:block">
          Scroll to zoom · Hold Space or select Pan to move across the level
        </p>
      </div>
    </section>
  );
}
