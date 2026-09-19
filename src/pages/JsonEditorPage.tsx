import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ProjectPicker } from "@/components/drawing/ProjectPicker";
import { LevelHeader } from "@/components/level/LevelHeader";
import { LevelJsonViewer } from "@/components/level/LevelJsonViewer";
import { LevelOverviewPanel } from "@/components/level/LevelOverviewPanel";
import {
  convertDetectionsToLevel,
  type DetectionToLevelResult,
  validateLevel,
} from "@/json/detection-to-level";
import {
  createEmptyLevel,
  createPlayableDemoLevel,
  type GameMode,
  type LevelDefinition,
} from "@/json/level-schema";
import { useProjectStore } from "@/store/project-store";
import type { DetectionPrediction } from "@/types/detection";

const EMPTY_DETECTIONS: DetectionPrediction[] = [];

export function JsonEditorPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const createProject = useProjectStore((state) => state.createProject);
  const projectDetections = useProjectStore((state) => state.projectDetections);
  const projectLevels = useProjectStore((state) => state.projectLevels);
  const projects = useProjectStore((state) => state.projects);
  const projectUploads = useProjectStore((state) => state.projectUploads);
  const renameProject = useProjectStore((state) => state.renameProject);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const setProjectLevel = useProjectStore((state) => state.setProjectLevel);

  const [isProjectPickerOpen, setProjectPickerOpen] = useState(false);

  // 1. Auto-redirect if missing projectId
  useEffect(() => {
    if (projectId) {
      setActiveProject(projectId);
      return;
    }

    const targetId = activeProjectId ?? projects[0]?.id ?? null;
    if (targetId) {
      navigate(`/projects/${targetId}/json`, { replace: true });
    } else {
      const newProject = createProject("Untitled level");
      navigate(`/projects/${newProject.id}/json`, { replace: true });
    }
  }, [activeProjectId, createProject, navigate, projectId, projects, setActiveProject]);

  const currentProject = projects.find((p) => p.id === projectId);
  const currentDetections = useMemo(
    () => (projectId ? projectDetections[projectId] : undefined) ?? EMPTY_DETECTIONS,
    [projectId, projectDetections],
  );
  const currentUpload = projectId ? projectUploads[projectId] : undefined;
  const storedLevel = projectId ? projectLevels[projectId] : undefined;

  // 2. Initialize or recover level definition for this project
  useEffect(() => {
    if (!projectId || !currentProject) return;

    if (!storedLevel) {
      if (currentDetections.length > 0) {
        const result = convertDetectionsToLevel(currentDetections, {
          levelName: currentProject.name,
          sourceDimensions: currentUpload ? currentUpload.dimensions : undefined,
        });
        setProjectLevel(projectId, result.level);
      } else {
        const empty = createEmptyLevel(currentProject.name, "single-screen");
        setProjectLevel(projectId, empty);
      }
    }
  }, [
    currentDetections,
    currentProject,
    currentUpload,
    projectId,
    setProjectLevel,
    storedLevel,
  ]);

  // Active level fallback
  const activeLevel: LevelDefinition = useMemo(() => {
    if (storedLevel) return storedLevel;
    if (currentProject) return createEmptyLevel(currentProject.name, "single-screen");
    return createEmptyLevel("Untitled level", "single-screen");
  }, [storedLevel, currentProject]);

  // Run validation on active level
  const validation = useMemo(() => {
    return validateLevel(activeLevel);
  }, [activeLevel]);

  // Conversion result comparison if detections exist
  const conversionAnalysis: DetectionToLevelResult | null = useMemo(() => {
    if (currentDetections.length === 0 || !currentProject) return null;
    return convertDetectionsToLevel(currentDetections, {
      gameMode: activeLevel.gameMode,
      levelName: currentProject.name,
      sourceDimensions: currentUpload ? currentUpload.dimensions : undefined,
    });
  }, [activeLevel.gameMode, currentDetections, currentProject, currentUpload]);

  // Handler: Change Game Mode
  const handleGameModeChange = useCallback(
    (newMode: GameMode) => {
      if (!projectId) return;
      const isSide = newMode === "side-scrolling";
      const updatedWorld = {
        height: activeLevel.world?.height ?? 720,
        width: isSide ? 2560 : 1280,
      };

      const updatedLevel: LevelDefinition = {
        ...activeLevel,
        gameMode: newMode,
        world: updatedWorld,
      };

      setProjectLevel(projectId, updatedLevel);
      toast.info(`Switched game mode to ${newMode}`);
    },
    [activeLevel, projectId, setProjectLevel],
  );

  // Handler: Regenerate from Detection
  const handleRegenerate = useCallback(() => {
    if (!projectId || !currentProject) return;

    if (currentDetections.length === 0) {
      toast.info("No detections available. Resetting to standard template.");
      const fresh = createEmptyLevel(currentProject.name, activeLevel.gameMode);
      setProjectLevel(projectId, fresh);
      return;
    }

    const result = convertDetectionsToLevel(currentDetections, {
      gameMode: activeLevel.gameMode,
      levelName: currentProject.name,
      sourceDimensions: currentUpload ? currentUpload.dimensions : undefined,
    });

    setProjectLevel(projectId, result.level);
    toast.success("Regenerated Level JSON from latest detection results");
  }, [activeLevel.gameMode, currentDetections, currentProject, currentUpload, projectId, setProjectLevel]);

  // Handler: Reset to Template
  const handleResetToTemplate = useCallback(() => {
    if (!projectId || !currentProject) return;
    const fresh = createEmptyLevel(currentProject.name, activeLevel.gameMode);
    setProjectLevel(projectId, fresh);
    toast.success("Reset level definition to default schema template");
  }, [activeLevel.gameMode, currentProject, projectId, setProjectLevel]);

  // Handler: Load Demo Playable Level
  const handleLoadDemoLevel = useCallback(() => {
    if (!projectId || !currentProject) return;
    const demo = createPlayableDemoLevel(currentProject.name, activeLevel.gameMode);
    setProjectLevel(projectId, demo);
    toast.success("Loaded playable demo level with platforms, coins, and goal!");
  }, [activeLevel.gameMode, currentProject, projectId, setProjectLevel]);

  // Handler: Rename Project
  const handleProjectNameChange = useCallback(
    (name: string) => {
      if (!projectId) return;
      renameProject(projectId, name);
      if (storedLevel) {
        setProjectLevel(projectId, {
          ...storedLevel,
          name: name.trim() || "Untitled level",
        });
      }
    },
    [projectId, renameProject, setProjectLevel, storedLevel],
  );

  // Handler: Switch Project
  const handleSelectProject = useCallback(
    (targetProjectId: string) => {
      setActiveProject(targetProjectId);
      setProjectPickerOpen(false);
      navigate(`/projects/${targetProjectId}/json`);
    },
    [navigate, setActiveProject],
  );

  if (!projectId || !currentProject) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      {/* Header */}
      <LevelHeader
        currentProjectId={projectId}
        onOpenProjectPicker={() => setProjectPickerOpen(true)}
        onProjectNameChange={handleProjectNameChange}
        projectName={currentProject.name}
        stage={currentProject.stage}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden p-4 sm:p-6">
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Overview, Controls & Validation */}
          <section
            aria-label="Level overview and validation"
            className="h-full overflow-y-auto pr-1 lg:col-span-5 xl:col-span-4"
          >
            <LevelOverviewPanel
              detections={currentDetections}
              level={activeLevel}
              onGameModeChange={handleGameModeChange}
              unmappedDetections={conversionAnalysis?.unmappedDetections ?? []}
              validation={validation}
            />
          </section>

          {/* Right Column: Code Viewer & Export */}
          <section
            aria-label="Level JSON definition view"
            className="h-full lg:col-span-7 xl:col-span-8"
          >
            <LevelJsonViewer
              level={activeLevel}
              onLoadDemoLevel={handleLoadDemoLevel}
              onRegenerate={handleRegenerate}
              onResetToTemplate={handleResetToTemplate}
              projectName={currentProject.name}
            />
          </section>
        </div>
      </main>

      {/* Project Switcher Modal */}
      <ProjectPicker
        currentProjectId={projectId}
        isOpen={isProjectPickerOpen}
        onClose={() => setProjectPickerOpen(false)}
        onCreateProject={() => {
          setProjectPickerOpen(false);
          const newProject = createProject("Untitled level");
          navigate(`/projects/${newProject.id}/json`);
        }}
        onSelect={handleSelectProject}
        projects={projects}
      />
    </div>
  );
}
