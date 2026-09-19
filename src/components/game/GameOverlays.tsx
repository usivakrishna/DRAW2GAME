import {
  ArrowLeft,
  CheckCircle2,
  Coins,
  Play,
  RotateCcw,
  Skull,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface WinOverlayProps {
  onRestart: () => void;
  projectId: string;
  score: number;
  totalCoins: number;
}

export function GameWinOverlay({
  onRestart,
  projectId,
  score,
  totalCoins,
}: WinOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-slate-900 p-6 text-center text-slate-100 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <CheckCircle2 className="size-8" />
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Level Complete
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
            YOU WIN!
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            You successfully reached the goal flag!
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-center gap-2 text-amber-400">
            <Coins className="size-5" />
            <span className="text-xl font-mono font-bold">{score}</span>
            <span className="text-xs text-slate-400">
              / {totalCoins} coins collected
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <Button
            className="w-full sm:flex-1 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            onClick={onRestart}
          >
            <RotateCcw className="size-4" />
            Play Again
          </Button>

          <Button
            asChild
            className="w-full sm:flex-1 gap-2 text-slate-300 hover:text-white hover:bg-slate-800"
            variant="outline"
          >
            <Link to={`/projects/${projectId}/json`}>
              <ArrowLeft className="size-4" />
              Back to Level
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

interface LoseOverlayProps {
  causeOfDeath?: string | undefined;
  onRestart: () => void;
  projectId: string;
  score: number;
}

export function GameLoseOverlay({
  causeOfDeath,
  onRestart,
  projectId,
  score,
}: LoseOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-900 p-6 text-center text-slate-100 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
          <Skull className="size-8" />
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-rose-400">
            Game Over
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
            ELIMINATED
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {causeOfDeath || "Watch out for obstacles and patrolling hazards!"}
          </p>
        </div>

        {/* Score Summary */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
          <div className="flex items-center justify-center gap-2 text-amber-400 font-mono text-sm">
            <Coins className="size-4" />
            <span>Score at defeat: {score}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <Button
            className="w-full sm:flex-1 gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold"
            onClick={onRestart}
          >
            <RotateCcw className="size-4" />
            Try Again (R)
          </Button>

          <Button
            asChild
            className="w-full sm:flex-1 gap-2 text-slate-300 hover:text-white hover:bg-slate-800"
            variant="outline"
          >
            <Link to={`/projects/${projectId}/json`}>
              <ArrowLeft className="size-4" />
              Back to Level
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  projectId: string;
}

export function GamePauseOverlay({
  onResume,
  onRestart,
  projectId,
}: PauseOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6 text-center text-slate-100 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-400">
            Game Suspended
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
            PAUSED
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Press ESC or click Resume to continue playing.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            className="w-full gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold"
            onClick={onResume}
          >
            <Play className="size-4" />
            Resume (ESC)
          </Button>

          <Button
            className="w-full gap-2 text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={onRestart}
            variant="outline"
          >
            <RotateCcw className="size-4" />
            Restart Level (R)
          </Button>

          <Button
            asChild
            className="w-full gap-2 text-slate-400 hover:text-white hover:bg-slate-800"
            variant="ghost"
          >
            <Link to={`/projects/${projectId}/json`}>
              <ArrowLeft className="size-4" />
              Back to Level JSON
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ControlsModalProps {
  onClose: () => void;
  open: boolean;
}

export function ControlsHelpModal({ onClose, open }: ControlsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-white">Keyboard Controls</h3>
          <button
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Move Left</span>
            <div className="flex gap-1">
              <kbd className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                A
              </kbd>
              <kbd className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                &larr;
              </kbd>
            </div>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Move Right</span>
            <div className="flex gap-1">
              <kbd className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                D
              </kbd>
              <kbd className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                &rarr;
              </kbd>
            </div>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Jump</span>
            <div className="flex gap-1">
              <kbd className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                W
              </kbd>
              <kbd className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                &uarr;
              </kbd>
              <kbd className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                Space
              </kbd>
            </div>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Pause / Resume</span>
            <div className="flex gap-1">
              <kbd className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                ESC
              </kbd>
              <kbd className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                P
              </kbd>
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400">Quick Restart</span>
            <kbd className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-200">
              R
            </kbd>
          </div>
        </div>

        <Button className="w-full" onClick={onClose} size="sm">
          Got It
        </Button>
      </div>
    </div>
  );
}
