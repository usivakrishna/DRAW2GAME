import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AIEditorPanel } from "@/components/game/AIEditorPanel";
import { GameCanvas } from "@/components/game/GameCanvas";
import { GameHUD } from "@/components/game/GameHUD";
import {
  ControlsHelpModal,
  GameLoseOverlay,
  GamePauseOverlay,
  GameWinOverlay,
} from "@/components/game/GameOverlays";
import { NoLevelAlert } from "@/components/game/NoLevelAlert";
import { ProjectNotFoundState } from "@/components/shared/ProjectNotFoundState";
import { parseEditCommand } from "@/game-editor/command-parser";
import { applyEditCommand } from "@/game-editor/level-modifier";
import type { EditHistoryItem } from "@/game-editor/types";
import { levelDefinitionToGameDefinition } from "@/game/core/platformer-definition";
import { loadRuntimeLevel } from "@/game/levels/level-loader";
import type { PhaserGameBridge } from "@/game/PhaserGameBridge";
import {
  GameStateManager,
  type GameStateSnapshot,
} from "@/game/systems/game-state-manager";
import type { StyleId, ThemeId } from "@/game/themes/theme-types";
import { useProjectStore } from "@/store/project-store";

export function GamePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const createProject = useProjectStore((state) => state.createProject);
  const projectLevels = useProjectStore((state) => state.projectLevels);
  const projects = useProjectStore((state) => state.projects);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const setProjectLevel = useProjectStore((state) => state.setProjectLevel);

  const bridgeRef = useRef<PhaserGameBridge | null>(null);

  // Theme & Style selection
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>("classic");
  const [selectedStyle, setSelectedStyle] = useState<StyleId>("clean");
  const [isControlsHelpOpen, setControlsHelpOpen] = useState(false);

  // Phase 7: AI Editor state
  const [isAIEditorOpen, setAIEditorOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[] | undefined>(undefined);
  const [history, setHistory] = useState<EditHistoryItem[]>([]);

  // 1. Auto-redirect if missing projectId
  useEffect(() => {
    if (projectId) {
      setActiveProject(projectId);
      return;
    }

    const targetId = activeProjectId ?? projects[0]?.id ?? null;
    if (targetId) {
      navigate(`/projects/${targetId}/play`, { replace: true });
    } else {
      const newProject = createProject("Untitled level");
      navigate(`/projects/${newProject.id}/play`, { replace: true });
    }
  }, [activeProjectId, createProject, navigate, projectId, projects, setActiveProject]);

  const currentProject = projects.find((p) => p.id === projectId);
  const levelDefinition = projectId ? projectLevels[projectId] : undefined;

  // 2. Derive canonical PlatformerGameDefinition using Phase 10 architecture
  const gameDefinition = useMemo(() => {
    if (!levelDefinition) return null;
    return levelDefinitionToGameDefinition(levelDefinition, projectId);
  }, [levelDefinition, projectId]);

  // 3. Load runtime level data from LevelDefinition
  const runtimeLevel = useMemo(() => {
    if (!levelDefinition) return null;
    return loadRuntimeLevel(levelDefinition);
  }, [levelDefinition]);

  // 3. Initialize GameStateManager
  const gameStateManager = useMemo(() => {
    return new GameStateManager(runtimeLevel?.coins.length ?? 0);
  }, [runtimeLevel]);

  // 4. Track GameState snapshot in React
  const [gameState, setGameState] = useState<GameStateSnapshot>(() =>
    gameStateManager.getSnapshot(),
  );

  useEffect(() => {
    return gameStateManager.subscribe((snapshot) => {
      setGameState(snapshot);
    });
  }, [gameStateManager]);

  // Reset AI editor state when changing projects (project isolation)
  useEffect(() => {
    setHistory([]);
    setLastError(null);
    setLastSuccess(null);
    setSuggestions(undefined);
  }, [projectId]);

  // Handlers
  const handleRestart = useCallback(() => {
    if (bridgeRef.current) {
      bridgeRef.current.restart();
    } else {
      gameStateManager.restart();
    }
  }, [gameStateManager]);

  const handleTogglePause = useCallback(() => {
    gameStateManager.togglePause();
  }, [gameStateManager]);

  const handleResume = useCallback(() => {
    gameStateManager.resume();
  }, [gameStateManager]);

  const handleBridgeReady = useCallback((bridge: PhaserGameBridge) => {
    bridgeRef.current = bridge;
  }, []);

  const handleToggleAIEditor = useCallback(() => {
    setAIEditorOpen((prev) => !prev);
  }, []);

  const handleSubmitPrompt = useCallback(
    (promptText: string) => {
      if (!levelDefinition || !projectId) return;

      setIsProcessing(true);
      setLastError(null);
      setLastSuccess(null);
      setSuggestions(undefined);

      try {
        const parseResult = parseEditCommand(promptText);
        if (!parseResult.success || !parseResult.command) {
          setLastError(parseResult.error ?? "Could not understand command.");
          setSuggestions(parseResult.suggestions);
          setIsProcessing(false);
          return;
        }

        const executionResult = applyEditCommand(
          levelDefinition,
          parseResult.command,
          selectedTheme,
          selectedStyle,
        );

        if (!executionResult.success || !executionResult.updatedLevel) {
          setLastError(executionResult.error ?? "Failed to apply edit to level.");
          setIsProcessing(false);
          return;
        }

        // Record undo history item
        const historyItem: EditHistoryItem = {
          action: parseResult.command.action,
          id: `edit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          previousLevel: levelDefinition,
          previousStyle: selectedStyle,
          previousTheme: selectedTheme,
          prompt: promptText,
          summary: executionResult.message ?? "Level updated.",
          target: parseResult.command.target,
          timestamp: new Date().toISOString(),
        };

        setHistory((prev) => [historyItem, ...prev]);

        // Update canonical project level in store
        setProjectLevel(projectId, executionResult.updatedLevel);

        // Update Theme if changed
        if (executionResult.updatedTheme && executionResult.updatedTheme !== selectedTheme) {
          setSelectedTheme(executionResult.updatedTheme);
        }

        // Update Style if changed
        if (executionResult.updatedStyle && executionResult.updatedStyle !== selectedStyle) {
          setSelectedStyle(executionResult.updatedStyle);
        }

        setLastSuccess(executionResult.message ?? "Level updated.");
      } catch (err) {
        setLastError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while modifying the level.",
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [levelDefinition, projectId, selectedTheme, selectedStyle, setProjectLevel],
  );

  const handleUndo = useCallback(
    (historyItemId: string) => {
      if (!projectId) return;
      const targetIndex = history.findIndex((item) => item.id === historyItemId);
      if (targetIndex === -1) return;

      const targetItem = history[targetIndex];
      if (!targetItem) return;

      // Revert project level
      setProjectLevel(projectId, targetItem.previousLevel);

      // Revert theme/style if needed
      if (targetItem.previousTheme) {
        setSelectedTheme(targetItem.previousTheme);
      }
      if (targetItem.previousStyle) {
        setSelectedStyle(targetItem.previousStyle);
      }

      // Remove this history item and newer items
      setHistory((prev) => prev.slice(targetIndex + 1));
      setLastSuccess(`Undid "${targetItem.prompt}"`);
      setLastError(null);
      setSuggestions(undefined);
    },
    [history, projectId, setProjectLevel],
  );

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  if (projectId && !currentProject) {
    return <ProjectNotFoundState projectId={projectId} />;
  }

  if (!projectId || !currentProject) {
    return null;
  }

  // If no level exists for this project, show clear guidance
  if (!levelDefinition || !runtimeLevel) {
    return (
      <div className="flex h-screen flex-col bg-slate-100">
        <NoLevelAlert projectId={projectId} projectName={currentProject.name} />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Game Top HUD */}
      <GameHUD
        coinsCollected={gameState.coinsCollected}
        gameMode={runtimeLevel.gameMode}
        isAIEditorOpen={isAIEditorOpen}
        levelName={runtimeLevel.name}
        onOpenControlsHelp={() => setControlsHelpOpen(true)}
        onRestart={handleRestart}
        onStyleChange={setSelectedStyle}
        onThemeChange={setSelectedTheme}
        onToggleAIEditor={handleToggleAIEditor}
        onTogglePause={handleTogglePause}
        projectId={projectId}
        score={gameState.score}
        selectedStyle={selectedStyle}
        selectedTheme={selectedTheme}
        status={gameState.status}
        totalCoins={gameState.totalCoins}
      />

      {/* Main Game Stage Container */}
      <main className="relative flex-1 w-full overflow-hidden">
        <GameCanvas
          gameDefinition={gameDefinition ?? undefined}
          gameStateManager={gameStateManager}
          levelData={runtimeLevel}
          onBridgeReady={handleBridgeReady}
          styleId={selectedStyle}
          themeId={selectedTheme}
        />

        {/* Win Overlay Modal */}
        {gameState.status === "won" && (
          <GameWinOverlay
            onRestart={handleRestart}
            projectId={projectId}
            score={gameState.score}
            totalCoins={gameState.totalCoins}
          />
        )}

        {/* Lose Overlay Modal */}
        {gameState.status === "lost" && (
          <GameLoseOverlay
            causeOfDeath={gameState.causeOfDeath}
            onRestart={handleRestart}
            projectId={projectId}
            score={gameState.score}
          />
        )}

        {/* Pause Overlay Modal */}
        {gameState.status === "paused" && (
          <GamePauseOverlay
            onResume={handleResume}
            onRestart={handleRestart}
            projectId={projectId}
          />
        )}

        {/* Phase 7: AI Editor Side Panel */}
        <AIEditorPanel
          history={history}
          isOpen={isAIEditorOpen}
          isProcessing={isProcessing}
          lastError={lastError}
          lastSuccess={lastSuccess}
          onClearHistory={handleClearHistory}
          onClose={() => setAIEditorOpen(false)}
          onSubmitPrompt={handleSubmitPrompt}
          onUndo={handleUndo}
          suggestions={suggestions}
        />
      </main>

      {/* Keyboard Controls Help Dialog */}
      <ControlsHelpModal
        onClose={() => setControlsHelpOpen(false)}
        open={isControlsHelpOpen}
      />
    </div>
  );
}
