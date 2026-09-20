/**
 * DRAW2GAME — Phase 12: Multiple 2D Game Engines
 * Complete Chess Game Stage UI Component
 *
 * Integrates ChessBoardView with captured piece counters, turn indicators,
 * move history logs, checkmate/draw dialogs, and game controls.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  createDefaultChessGameDefinition,
  type ChessGameDefinition,
  type ChessPayload,
} from "./chess-definition";
import { UniversalGameEngine } from "@/game/runtime/universal-game-engine";
import { ChessBoardView } from "./ChessBoardView";
import { ChessPieceIcon } from "./ChessPieceIcon";

interface ChessGameStageProps {
  initialDefinition: ChessGameDefinition;
  onDefinitionChange?: ((def: ChessGameDefinition) => void) | undefined;
  projectId: string;
  projectName: string;
}

export function ChessGameStage({
  initialDefinition,
  onDefinitionChange,
  projectId,
  projectName,
}: ChessGameStageProps) {
  const [engine] = useState(() => {
    const eng = new UniversalGameEngine();
    eng.initialize({ container: document.createElement("div") });
    void eng.load(initialDefinition);
    eng.start();
    return eng;
  });

  const [payload, setPayload] = useState<ChessPayload>(
    () => initialDefinition.typePayload ?? createDefaultChessGameDefinition(initialDefinition.id).typePayload!
  );

  const onDefinitionChangeRef = useRef(onDefinitionChange);
  useEffect(() => {
    onDefinitionChangeRef.current = onDefinitionChange;
  }, [onDefinitionChange]);

  const initialDefRef = useRef(initialDefinition);
  useEffect(() => {
    initialDefRef.current = initialDefinition;
  }, [initialDefinition]);

  useEffect(() => {
    return engine.onStateChange((newPayload) => {
      setPayload(newPayload as ChessPayload);
      if (onDefinitionChangeRef.current && initialDefRef.current) {
        onDefinitionChangeRef.current({
          ...initialDefRef.current,
          typePayload: newPayload as ChessPayload,
        });
      }
    });
  }, [engine]);

  // Restart handler
  const handleRestart = useCallback(() => {
    engine.restart();
  }, [engine]);

  // Flip board handler
  const handleFlipBoard = useCallback(() => {
    engine.flipBoard();
  }, [engine]);

  const isCheckmate = payload.gameStatus === "checkmate";
  const isStalemate = payload.gameStatus === "stalemate";
  const isCheck = payload.gameStatus === "check";

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-100 select-none">
      {/* Top Header */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button asChild className="h-8 gap-1.5 text-xs text-slate-300 hover:text-white" size="sm" variant="ghost">
            <Link to={`/projects/${projectId}/detect`}>
              <ArrowLeft className="size-3.5" />
              <span>Detection</span>
            </Link>
          </Button>

          <span className="h-4 w-px bg-slate-800" />

          <div>
            <h1 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>{projectName}</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                Universal Game Engine
              </span>
            </h1>
          </div>
        </div>

        {/* Turn & Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1 text-xs">
            <span
              className={`size-2.5 rounded-full ${
                payload.currentTurn === "white"
                  ? "bg-white ring-2 ring-slate-400"
                  : "bg-slate-900 ring-2 ring-white"
              }`}
            />
            <span className="font-medium capitalize text-slate-200">
              {payload.currentTurn}&apos;s Turn
            </span>
          </div>

          {isCheck && !isCheckmate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/30 animate-pulse">
              <AlertCircle className="size-3.5" />
              Check!
            </span>
          )}

          <Button
            className="h-8 gap-1.5 text-xs text-slate-300 hover:text-white"
            onClick={handleFlipBoard}
            size="sm"
            variant="outline"
          >
            <RotateCcw className="size-3.5" />
            <span>Flip</span>
          </Button>

          <Button
            className="h-8 gap-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
            onClick={handleRestart}
            size="sm"
          >
            <RotateCcw className="size-3.5" />
            <span>Restart</span>
          </Button>
        </div>
      </header>

      {/* Main Stage Grid */}
      <main className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left: Interactive Chess Board */}
        <section
          aria-label="Playable Chess Board"
          className="relative flex size-full items-center justify-center overflow-auto p-4"
        >
          <ChessBoardView engine={engine} payload={payload} />

          {/* Checkmate / Stalemate Modal Dialog */}
          {(isCheckmate || isStalemate) && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-2xl space-y-4">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 ring-8 ring-amber-500/5">
                  <Trophy className="size-8" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white">
                    {isCheckmate ? "Checkmate!" : "Stalemate!"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isCheckmate
                      ? `${payload.winner?.toUpperCase()} has won the game!`
                      : "The game has concluded in a draw."}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                    onClick={handleRestart}
                  >
                    Play Again
                  </Button>
                  <Button asChild className="flex-1" variant="outline">
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right: Game Info, Captured Pieces & History Panel */}
        <aside
          aria-label="Chess game info and history"
          className="flex flex-col border-l border-slate-800 bg-slate-900/60 p-4 space-y-4 overflow-y-auto"
        >
          {/* Captured Pieces Section */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Captured Pieces
            </h3>

            {/* Captured White (by Black) */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">White Lost:</span>
              <div className="flex flex-wrap gap-1 min-h-[28px] items-center rounded-lg bg-slate-900/80 p-1.5 border border-slate-800/80">
                {payload.capturedWhite.length === 0 ? (
                  <span className="text-[11px] text-slate-600 italic">None</span>
                ) : (
                  payload.capturedWhite.map((piece, i) => (
                    <ChessPieceIcon className="size-5" color={piece.color} key={i} type={piece.type} />
                  ))
                )}
              </div>
            </div>

            {/* Captured Black (by White) */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 font-medium">Black Lost:</span>
              <div className="flex flex-wrap gap-1 min-h-[28px] items-center rounded-lg bg-slate-900/80 p-1.5 border border-slate-800/80">
                {payload.capturedBlack.length === 0 ? (
                  <span className="text-[11px] text-slate-600 italic">None</span>
                ) : (
                  payload.capturedBlack.map((piece, i) => (
                    <ChessPieceIcon className="size-5" color={piece.color} key={i} type={piece.type} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Move History Log */}
          <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Move History ({payload.moveHistory.length})
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto pt-2 pr-1 space-y-1">
              {payload.moveHistory.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-600 italic">
                  No moves made yet. Click a white piece to begin.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                  {payload.moveHistory.map((m, idx) => {
                    const moveNum = Math.floor(idx / 2) + 1;
                    const isWhite = idx % 2 === 0;
                    return (
                      <div
                        className="flex items-center justify-between rounded px-2 py-1 bg-slate-900 border border-slate-800/60"
                        key={idx}
                      >
                        <span className="text-slate-500">{isWhite ? `${moveNum}.` : ""}</span>
                        <span className="font-semibold text-slate-200">{m.san}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* AI Editor Notice */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Sparkles className="size-3.5 text-brand-400" />
              <span>AI Editor Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Chess editing commands will be added in a future phase. Switch back to a Platformer
              project to use natural-language AI level edits.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
