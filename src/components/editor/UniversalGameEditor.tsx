/**
 * DRAW2GAME — Phase 15: Universal Game Editor & Regeneration
 * Universal Game Editor Component
 *
 * Integrates:
 * - Visual 2D Canvas object manipulation
 * - Object & Game Settings Inspector
 * - Natural language AI Editor integration
 * - Undo / Redo history
 * - Save Changes with validation
 * - Play Again game regeneration
 */

import { useCallback, useState } from "react";
import {
  ArrowLeft,
  Play,
  Redo2,
  RotateCcw,
  Save,
  Sparkles,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { AIEditorPanel } from "@/components/game/AIEditorPanel";
import { Button } from "@/components/ui/button";
import type { GameDefinition } from "@/game/core/game-definition";
import { parseEditCommand } from "@/game-editor/command-parser";
import type { EditHistoryItem } from "@/game-editor/types";
import { useUniversalEditor } from "@/game-editor/useUniversalEditor";
import { ObjectInspectorPanel } from "./ObjectInspectorPanel";
import { VisualEditorCanvas } from "./VisualEditorCanvas";

interface UniversalGameEditorProps {
  initialDefinition: GameDefinition;
  onCancel: () => void;
  onPlayAgain: (updatedDefinition: GameDefinition) => void;
  projectId: string;
  projectName: string;
}

export function UniversalGameEditor({
  initialDefinition,
  onCancel,
  onPlayAgain,
  projectId,
  projectName,
}: UniversalGameEditorProps) {
  const {
    addObject,
    applyAiCommand,
    canRedo,
    canUndo,
    draftDefinition,
    futureCount,
    historyCount,
    isDirty,
    moveObject,
    redo,
    removeObject,
    resetChanges,
    resizeObject,
    saveChanges,
    selectObject,
    selectedObject,
    selectedObjectId,
    undo,
    updateObjectProperties,
    updateSettings,
    validation,
  } = useUniversalEditor({
    initialDefinition,
    projectId,
  });

  // AI Editor state
  const [isAIEditorOpen, setAIEditorOpen] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiLastError, setAiLastError] = useState<string | null>(null);
  const [aiLastSuccess, setAiLastSuccess] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[] | undefined>();
  const [aiHistory, setAiHistory] = useState<EditHistoryItem[]>([]);

  // Handle Save
  const handleSave = useCallback(() => {
    const res = saveChanges();
    if (res.success) {
      toast.success("GameDefinition saved successfully!", {
        description: `Project "${projectName}" updated with latest edits.`,
      });
    } else {
      toast.error("Cannot save invalid GameDefinition", {
        description: res.errors?.join("; ") || "Resolve audit errors before saving.",
      });
    }
  }, [projectName, saveChanges]);

  // Handle Play Again (Save if dirty & regenerate)
  const handlePlayAgain = useCallback(() => {
    const res = saveChanges();
    if (!res.success) {
      toast.error("Cannot start game with invalid GameDefinition", {
        description: res.errors?.join("; ") || "Resolve audit errors before playing.",
      });
      return;
    }

    toast.success("Regenerating Game...", {
      description: "Loading updated GameDefinition into UniversalGameEngine.",
    });

    onPlayAgain(res.definition!);
  }, [onPlayAgain, saveChanges]);

  // AI Prompt submission
  const handleAiSubmit = useCallback(
    (promptText: string) => {
      setAiProcessing(true);
      setAiLastError(null);
      setAiLastSuccess(null);
      setAiSuggestions(undefined);

      try {
        const parseRes = parseEditCommand(promptText);
        if (!parseRes.success || !parseRes.command) {
          setAiLastError(parseRes.error ?? "Could not understand command.");
          setAiSuggestions(parseRes.suggestions);
          setAiProcessing(false);
          return;
        }

        const validCommand = parseRes.command;
        const editRes = applyAiCommand(validCommand);
        if (!editRes.success) {
          setAiLastError(editRes.error ?? "Failed to apply command.");
          setAiProcessing(false);
          return;
        }

        // Record history item
        setAiHistory((prev) => [
          {
            action: validCommand.action,
            id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            previousLevel: {} as never,
            prompt: promptText,
            summary: editRes.message ?? "GameDefinition updated.",
            target: validCommand.target,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);

        setAiLastSuccess(editRes.message ?? "GameDefinition updated.");
      } catch (err) {
        setAiLastError(err instanceof Error ? err.message : "Error applying command.");
      } finally {
        setAiProcessing(false);
      }
    },
    [applyAiCommand],
  );

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Editor Toolbar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 backdrop-blur z-30">
        {/* Left: Exit/Cancel & Title */}
        <div className="flex items-center gap-3">
          <Button
            className="h-8 gap-1.5 text-xs text-slate-300 hover:text-white"
            onClick={onCancel}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="size-3.5" />
            <span>Cancel</span>
          </Button>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-950 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-400 border border-indigo-500/30">
              Universal Editor
            </span>
            <h1 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-sm">
              {draftDefinition.name || projectName}
            </h1>
            {isDirty && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
                Unsaved Changes
              </span>
            )}
          </div>
        </div>

        {/* Center: Undo / Redo / Reset */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
          <Button
            className="h-7 w-7 p-0 text-slate-400 hover:text-white disabled:opacity-30"
            disabled={!canUndo}
            onClick={undo}
            size="sm"
            title={`Undo (${historyCount} steps)`}
            variant="ghost"
          >
            <Undo2 className="size-3.5" />
          </Button>
          <Button
            className="h-7 w-7 p-0 text-slate-400 hover:text-white disabled:opacity-30"
            disabled={!canRedo}
            onClick={redo}
            size="sm"
            title={`Redo (${futureCount} steps)`}
            variant="ghost"
          >
            <Redo2 className="size-3.5" />
          </Button>
          <div className="h-3 w-px bg-slate-800 my-auto" />
          <Button
            className="h-7 gap-1 px-2 text-xs text-slate-400 hover:text-white disabled:opacity-30"
            disabled={!isDirty}
            onClick={resetChanges}
            size="sm"
            title="Reset to last saved GameDefinition"
            variant="ghost"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Button>
        </div>

        {/* Right: AI Editor, Save Changes, Play Again */}
        <div className="flex items-center gap-2.5">
          <Button
            className={`h-8 gap-1.5 text-xs font-semibold transition ${
              isAIEditorOpen
                ? "bg-purple-600 text-white"
                : "border border-purple-500/40 bg-purple-950/40 text-purple-200 hover:bg-purple-900/60 hover:text-white"
            }`}
            onClick={() => setAIEditorOpen((prev) => !prev)}
            size="sm"
            variant="outline"
          >
            <Sparkles className="size-3.5 text-purple-300" />
            <span>AI Editor</span>
          </Button>

          <Button
            className="h-8 gap-1.5 text-xs font-medium border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
            disabled={!isDirty || !validation.isValid}
            onClick={handleSave}
            size="sm"
            variant="outline"
          >
            <Save className="size-3.5" />
            <span>Save Changes</span>
          </Button>

          <Button
            className="h-8 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
            disabled={!validation.isValid}
            onClick={handlePlayAgain}
            size="sm"
          >
            <Play className="size-3.5 fill-current" />
            <span>Play Again</span>
          </Button>
        </div>
      </header>

      {/* Main Split Layout: Visual Canvas (Left) + Inspector (Right) */}
      <main className="relative flex-1 flex overflow-hidden">
        <div className="flex-1 h-full overflow-hidden">
          <VisualEditorCanvas
            gameDefinition={draftDefinition}
            onAddObject={addObject}
            onMoveObject={moveObject}
            onRemoveObject={(id) => {
              const res = removeObject(id);
              if (!res.success) {
                toast.error(res.error);
              }
            }}
            onResizeObject={resizeObject}
            onSelectObject={selectObject}
            selectedObjectId={selectedObjectId}
          />
        </div>

        <ObjectInspectorPanel
          gameDefinition={draftDefinition}
          onRemoveObject={(id) => {
            const res = removeObject(id);
            if (!res.success) {
              toast.error(res.error);
            }
          }}
          onUpdateObject={updateObjectProperties}
          onUpdateSettings={updateSettings}
          selectedObject={selectedObject}
          validation={validation}
        />

        {/* AI Editor Side Panel */}
        <AIEditorPanel
          history={aiHistory}
          isOpen={isAIEditorOpen}
          isProcessing={aiProcessing}
          lastError={aiLastError}
          lastSuccess={aiLastSuccess}
          onClearHistory={() => setAiHistory([])}
          onClose={() => setAIEditorOpen(false)}
          onSubmitPrompt={handleAiSubmit}
          onUndo={undo}
          suggestions={aiSuggestions}
        />
      </main>
    </div>
  );
}
