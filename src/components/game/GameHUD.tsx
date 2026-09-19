import {
  ArrowLeft,
  Coins,
  Compass,
  HelpCircle,
  LayoutDashboard,
  Palette,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { STYLE_LIST } from "@/game/themes/style-registry";
import { THEME_LIST } from "@/game/themes/theme-registry";
import type { StyleId, ThemeId } from "@/game/themes/theme-types";
import type { GameStatus } from "@/types/game";

interface GameHUDProps {
  coinsCollected: number;
  gameMode: "side-scrolling" | "single-screen";
  isAIEditorOpen?: boolean;
  levelName: string;
  onOpenControlsHelp: () => void;
  onRestart: () => void;
  onStyleChange: (styleId: StyleId) => void;
  onThemeChange: (themeId: ThemeId) => void;
  onToggleAIEditor?: () => void;
  onTogglePause: () => void;
  projectId: string;
  score: number;
  selectedStyle: StyleId;
  selectedTheme: ThemeId;
  status: GameStatus;
  totalCoins: number;
}

export function GameHUD({
  coinsCollected,
  gameMode,
  isAIEditorOpen,
  levelName,
  onOpenControlsHelp,
  onRestart,
  onStyleChange,
  onThemeChange,
  onToggleAIEditor,
  onTogglePause,
  projectId,
  score,
  selectedStyle,
  selectedTheme,
  status,
  totalCoins,
}: GameHUDProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-4 py-2.5 text-slate-100 sm:px-6">
      {/* Left: Back links and Level Name */}
      <div className="flex items-center gap-2.5">
        <Button asChild className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800" size="sm" variant="ghost">
          <Link to="/dashboard">
            <LayoutDashboard className="size-3.5 mr-1" />
            <span>Dashboard</span>
          </Link>
        </Button>

        <Button asChild className="h-8 text-xs text-slate-300 hover:text-white hover:bg-slate-800" size="sm" variant="ghost">
          <Link to={`/projects/${projectId}/json`}>
            <ArrowLeft className="size-3.5 mr-1" />
            <span>Level JSON</span>
          </Link>
        </Button>

        <div className="h-4 w-px bg-slate-800" />

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
              {levelName}
            </h1>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400 capitalize">
              <Compass className="size-2.5 inline mr-1" />
              {gameMode}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Score Counter */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-1">
        <Coins className="size-4 text-amber-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Score:
        </span>
        <span className="font-mono text-base font-bold text-amber-400">
          {score}
        </span>
        {totalCoins > 0 && (
          <span className="text-xs text-slate-500 font-mono">
            ({coinsCollected}/{totalCoins} coins)
          </span>
        )}
      </div>

      {/* Right: Theme / Style selectors, Pause, Restart, Help, AI Editor */}
      <div className="flex flex-wrap items-center gap-2">
        {/* AI Editor Toggle Button */}
        {onToggleAIEditor && (
          <Button
            className={`h-8 gap-1.5 text-xs font-semibold transition ${
              isAIEditorOpen
                ? "bg-purple-600 text-white hover:bg-purple-500 shadow-md shadow-purple-600/20"
                : "border border-purple-500/40 bg-purple-950/40 text-purple-200 hover:bg-purple-900/60 hover:text-white"
            }`}
            onClick={onToggleAIEditor}
            size="sm"
            variant="outline"
          >
            <Sparkles className="size-3.5 text-purple-300" />
            <span>AI Editor</span>
          </Button>
        )}

        {/* Theme Picker */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1">
          <Palette className="size-3.5 text-slate-400" />
          <select
            aria-label="Select Game Theme"
            className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer"
            onChange={(e) => onThemeChange(e.target.value as ThemeId)}
            value={selectedTheme}
          >
            {THEME_LIST.map((t) => (
              <option className="bg-slate-900 text-slate-200" key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Style Picker */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1">
          <select
            aria-label="Select Game Style"
            className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer"
            onChange={(e) => onStyleChange(e.target.value as StyleId)}
            value={selectedStyle}
          >
            {STYLE_LIST.map((s) => (
              <option className="bg-slate-900 text-slate-200" key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pause / Resume Button */}
        <Button
          className="h-8 gap-1.5 text-xs text-slate-200 hover:text-white hover:bg-slate-800"
          onClick={onTogglePause}
          size="sm"
          variant="ghost"
        >
          {status === "paused" ? (
            <Play className="size-3.5 text-emerald-400" />
          ) : (
            <Pause className="size-3.5 text-amber-400" />
          )}
          <span>{status === "paused" ? "Resume" : "Pause"}</span>
        </Button>

        {/* Restart Button */}
        <Button
          className="h-8 gap-1.5 text-xs text-slate-200 hover:text-white hover:bg-slate-800"
          onClick={onRestart}
          size="sm"
          variant="ghost"
        >
          <RotateCcw className="size-3.5" />
          <span>Restart</span>
        </Button>

        {/* Controls Help */}
        <Button
          className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={onOpenControlsHelp}
          size="sm"
          title="Controls Guide"
          variant="ghost"
        >
          <HelpCircle className="size-4" />
        </Button>
      </div>
    </header>
  );
}
