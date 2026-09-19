import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type EditHistoryItem,
  EXAMPLE_COMMANDS,
} from "@/game-editor/types";

interface AIEditorPanelProps {
  history: EditHistoryItem[];
  isOpen: boolean;
  isProcessing: boolean;
  lastError: string | null;
  lastSuccess: string | null;
  onClearHistory?: () => void;
  onClose: () => void;
  onSubmitPrompt: (prompt: string) => void;
  onUndo: (historyItemId: string) => void;
  suggestions?: string[] | undefined;
}

export function AIEditorPanel({
  history,
  isOpen,
  isProcessing,
  lastError,
  lastSuccess,
  onClearHistory,
  onClose,
  onSubmitPrompt,
  onUndo,
  suggestions,
}: AIEditorPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isProcessing) return;
    onSubmitPrompt(prompt);
    setPrompt("");
  };

  const handleApplySuggestion = (cmd: string) => {
    if (isProcessing) return;
    onSubmitPrompt(cmd);
  };

  const categories = ["All", "Coins", "Hazards", "Enemies", "Platforms", "Physics", "Theme", "Style"];
  const filteredExamples =
    activeCategory === "All"
      ? EXAMPLE_COMMANDS
      : EXAMPLE_COMMANDS.filter((c) => c.category === activeCategory);

  return (
    <aside
      aria-label="AI Game Editor Side Panel"
      className="absolute right-0 top-0 bottom-0 z-50 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-950/95 p-5 text-slate-100 shadow-2xl backdrop-blur-md transition-all duration-300 sm:w-96"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-md shadow-indigo-500/20">
            <Sparkles className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              AI Game Editor
              <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/30">
                Phase 7
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Natural-language command modifier
            </p>
          </div>
        </div>

        <Button
          aria-label="Close AI Editor"
          className="size-8 text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={onClose}
          size="icon"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-5 overflow-y-auto py-4 pr-1">
        {/* Prompt Input Form */}
        <form className="space-y-2.5" onSubmit={handleSubmit}>
          <label className="text-xs font-medium text-slate-300 block" htmlFor="ai-editor-prompt">
            Tell me what you want to change...
          </label>
          <div className="relative">
            <input
              autoComplete="off"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 pr-10 text-xs text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
              disabled={isProcessing}
              id="ai-editor-prompt"
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 'Add 5 coins', 'Make gravity lower'..."
              type="text"
              value={prompt}
            />
            <Button
              aria-label="Submit prompt"
              className="absolute right-1.5 top-1.5 size-7 rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50"
              disabled={!prompt.trim() || isProcessing}
              size="icon"
              type="submit"
            >
              {isProcessing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
            </Button>
          </div>

          <Button
            className="w-full gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-semibold text-white shadow hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
            disabled={!prompt.trim() || isProcessing}
            size="sm"
            type="submit"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Applying Changes...</span>
              </>
            ) : (
              <>
                <Wand2 className="size-3.5" />
                <span>Apply Change</span>
              </>
            )}
          </Button>
        </form>

        {/* Status Messages */}
        {lastSuccess && (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-400 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-white">Change Applied!</span>
              <p className="text-[11px] text-emerald-200">{lastSuccess}</p>
            </div>
          </div>
        )}

        {lastError && (
          <div className="space-y-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-rose-200">{lastError}</p>
            </div>
            {suggestions && suggestions.length > 0 && (
              <div className="pt-2 border-t border-rose-500/20">
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Try these instead:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((sug) => (
                    <button
                      className="rounded-lg bg-rose-950/80 px-2 py-1 text-[11px] text-rose-200 border border-rose-700/50 hover:bg-rose-900 transition text-left"
                      key={sug}
                      onClick={() => handleApplySuggestion(sug)}
                      type="button"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Example Commands Tabs & Chips */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="size-3.5 text-purple-400" />
              Example Prompts
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition ${
                  activeCategory === cat
                    ? "bg-purple-600 text-white font-semibold"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
                key={cat}
                onClick={() => setActiveCategory(cat)}
                type="button"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Suggestion Chips */}
          <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
            {filteredExamples.map((ex) => (
              <button
                className="group flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-purple-500/50 hover:bg-purple-950/30 hover:text-white text-left"
                key={ex.prompt}
                onClick={() => handleApplySuggestion(ex.prompt)}
                type="button"
              >
                <span>{ex.prompt}</span>
                <ArrowRight className="size-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition text-purple-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Edit History Section */}
        {history.length > 0 && (
          <div className="space-y-2.5 border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="size-3.5 text-slate-400" />
                Edit History ({history.length})
              </span>
              {onClearHistory && (
                <button
                  className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                  onClick={onClearHistory}
                  type="button"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {history.map((item, idx) => (
                <div
                  className="flex items-center justify-between rounded-xl border border-slate-800/90 bg-slate-900/60 p-2.5 text-xs transition hover:bg-slate-900"
                  key={item.id}
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <span className="font-semibold text-white truncate block">
                      "{item.prompt}"
                    </span>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.summary}
                    </p>
                  </div>

                  {idx === 0 && (
                    <Button
                      className="h-7 gap-1 px-2 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 shrink-0"
                      onClick={() => onUndo(item.id)}
                      size="sm"
                      title="Undo this change"
                      variant="ghost"
                    >
                      <RotateCcw className="size-3 text-amber-400" />
                      Undo
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-900 pt-3 text-center">
        <p className="text-[10px] text-slate-500">
          Rule-based AI engine &middot; Changes apply instantly to level state
        </p>
      </div>
    </aside>
  );
}
