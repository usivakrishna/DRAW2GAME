import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GameCanvas } from "@/components/game/GameCanvas";
import { GameHUD } from "@/components/game/GameHUD";
import {
  ControlsHelpModal,
  GameLoseOverlay,
  GamePauseOverlay,
  GameWinOverlay,
} from "@/components/game/GameOverlays";
import { NoLevelAlert } from "@/components/game/NoLevelAlert";
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

  const bridgeRef = useRef<PhaserGameBridge | null>(null);

  // Theme & Style selection
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>("classic");
  const [selectedStyle, setSelectedStyle] = useState<StyleId>("clean");
  const [isControlsHelpOpen, setControlsHelpOpen] = useState(false);

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

  // 2. Load runtime level data from LevelDefinition
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
        levelName={runtimeLevel.name}
        onOpenControlsHelp={() => setControlsHelpOpen(true)}
        onRestart={handleRestart}
        onStyleChange={setSelectedStyle}
        onThemeChange={setSelectedTheme}
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
      </main>

      {/* Keyboard Controls Help Dialog */}
      <ControlsHelpModal
        onClose={() => setControlsHelpOpen(false)}
        open={isControlsHelpOpen}
      />
    </div>
  );
}
