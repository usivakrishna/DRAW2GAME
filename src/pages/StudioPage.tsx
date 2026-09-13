import { useCallback, useEffect, useRef, useState } from "react";
import type { FabricObject } from "fabric";
import { AlertCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { InspectorPanel } from "@/components/drawing/InspectorPanel";
import { ProjectPicker } from "@/components/drawing/ProjectPicker";
import { StudioCanvas } from "@/components/drawing/StudioCanvas";
import { StudioHeader } from "@/components/drawing/StudioHeader";
import { StudioToolbar } from "@/components/drawing/StudioToolbar";
import { Button } from "@/components/ui/button";
import { type InspectorProperty, useStudioCanvas } from "@/hooks/use-studio-canvas";
import { useProjectStore } from "@/store/project-store";
import { DEFAULT_STUDIO_WORLD, type StudioTool } from "@/types/studio";
import { getErrorMessage } from "@/utils/errors";
import { downloadDataUrl, downloadTextFile } from "@/utils/download";

function getDownloadBaseName(projectName: string) {
  const normalizedName = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return normalizedName || "draw2game-level";
}

export function StudioPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const createProject = useProjectStore((state) => state.createProject);
  const projects = useProjectStore((state) => state.projects);
  const renameProject = useProjectStore((state) => state.renameProject);
  const saveStudioDocument = useProjectStore((state) => state.saveStudioDocument);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const studioDocuments = useProjectStore((state) => state.studioDocuments);
  const [activeTool, setActiveTool] = useState<StudioTool>("select");
  const [isProjectPickerOpen, setProjectPickerOpen] = useState(false);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [selectedObjectCount, setSelectedObjectCount] = useState(0);
  const [selectionRevision, setSelectionRevision] = useState(0);
  const createdProjectRef = useRef(false);
  const activeProjectIdRef = useRef<string | null>(null);
  const handleSaveRef = useRef<() => void>(() => {});
  const handleSelectionChange = useCallback(
    (object: FabricObject | null, selectedCount: number) => {
      setSelectedObject(object);
      setSelectedObjectCount(selectedCount);
      setSelectionRevision((revision) => revision + 1);
    },
    [],
  );
  const {
    canvas,
    canvasContainerRef,
    canvasElementRef,
    canRedo,
    canUndo,
    clearCanvas,
    commitHistory,
    deleteSelected,
    exportPng,
    getCanvasJson,
    loadCanvasJson,
    redo,
    resetCanvas,
    resetView,
    undo,
    updateObject,
    zoom,
    zoomBy,
  } = useStudioCanvas({
    activeTool,
    onSave: () => handleSaveRef.current(),
    onSelectionChange: handleSelectionChange,
  });
  const currentProject = projects.find((project) => project.id === projectId);
  const savedDocument = projectId ? studioDocuments[projectId] : undefined;

  const persistProjectCanvas = useCallback(
    (targetProjectId?: string) => {
      const idToSave = targetProjectId ?? projectId;
      if (!idToSave || !canvas) {
        return;
      }

      const canvasJson = getCanvasJson();
      if (!canvasJson) {
        return;
      }

      const currentDoc = useProjectStore.getState().studioDocuments[idToSave];
      const savedAt = new Date().toISOString();

      saveStudioDocument(idToSave, {
        canvasJson,
        savedAt,
        version: 1,
        world: currentDoc?.world ?? DEFAULT_STUDIO_WORLD,
      });
    },
    [canvas, getCanvasJson, projectId, saveStudioDocument],
  );

  useEffect(() => {
    if (projectId) {
      setActiveProject(projectId);
      return;
    }

    if (createdProjectRef.current) {
      return;
    }

    createdProjectRef.current = true;
    const project = createProject("Untitled level");
    navigate("/projects/" + project.id + "/studio", { replace: true });
  }, [createProject, navigate, projectId, setActiveProject]);

  useEffect(() => {
    if (!canvas || !projectId) {
      return;
    }

    if (activeProjectIdRef.current === projectId) {
      return;
    }

    const previousProjectId = activeProjectIdRef.current;

    // If leaving a previous project, persist its current canvas state first
    if (previousProjectId && previousProjectId !== projectId) {
      const outgoingCanvasJson = getCanvasJson();
      if (outgoingCanvasJson) {
        const prevDoc = useProjectStore.getState().studioDocuments[previousProjectId];
        saveStudioDocument(previousProjectId, {
          canvasJson: outgoingCanvasJson,
          savedAt: new Date().toISOString(),
          version: 1,
          world: prevDoc?.world ?? DEFAULT_STUDIO_WORLD,
        });
      }
    }

    activeProjectIdRef.current = projectId;
    let isCancelled = false;

    const loadProjectDocument = async () => {
      try {
        const targetDocument = useProjectStore.getState().studioDocuments[projectId];

        if (targetDocument) {
          await loadCanvasJson(targetDocument.canvasJson);
        } else {
          resetCanvas();
        }
      } catch (error) {
        if (!isCancelled) {
          toast.error("Could not load this project", {
            description: getErrorMessage(error),
          });
        }
      }
    };

    void loadProjectDocument();

    return () => {
      isCancelled = true;
    };
  }, [canvas, getCanvasJson, loadCanvasJson, projectId, resetCanvas, saveStudioDocument]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      persistProjectCanvas();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [persistProjectCanvas]);

  const handleSave = useCallback(() => {
    if (!projectId || !currentProject) {
      return;
    }

    const canvasJson = getCanvasJson();

    if (!canvasJson) {
      toast.error("The drawing canvas is not ready yet.");
      return;
    }

    const savedAt = new Date().toISOString();

    saveStudioDocument(projectId, {
      canvasJson,
      savedAt,
      version: 1,
      world: savedDocument?.world ?? DEFAULT_STUDIO_WORLD,
    });
    toast.success("Project saved locally");
  }, [currentProject, getCanvasJson, projectId, saveStudioDocument, savedDocument?.world]);

  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  const handleExportPng = useCallback(() => {
    if (!currentProject) {
      return;
    }

    const dataUrl = exportPng(savedDocument?.world ?? DEFAULT_STUDIO_WORLD);

    if (!dataUrl) {
      toast.error("The drawing canvas is not ready yet.");
      return;
    }

    downloadDataUrl(getDownloadBaseName(currentProject.name) + ".png", dataUrl);
    toast.success("PNG export started");
  }, [currentProject, exportPng, savedDocument?.world]);

  const handleExportJson = useCallback(() => {
    if (!currentProject) {
      return;
    }

    const canvasJson = getCanvasJson();

    if (!canvasJson) {
      toast.error("The drawing canvas is not ready yet.");
      return;
    }

    try {
      const exportDocument = {
        canvas: JSON.parse(canvasJson) as Record<string, unknown>,
        format: "draw2game-studio",
        project: {
          id: currentProject.id,
          name: currentProject.name,
        },
        version: 1,
        world: savedDocument?.world ?? DEFAULT_STUDIO_WORLD,
      };

      downloadTextFile(
        getDownloadBaseName(currentProject.name) + ".json",
        JSON.stringify(exportDocument, null, 2),
      );
      toast.success("Studio JSON export started");
    } catch (error) {
      toast.error("Could not export studio JSON", {
        description: getErrorMessage(error),
      });
    }
  }, [currentProject, getCanvasJson, savedDocument?.world]);

  const handleClear = useCallback(() => {
    if (!window.confirm("Clear every object from this drawing? This action can be undone.")) {
      return;
    }

    if (clearCanvas()) {
      toast.success("Canvas cleared");
    }
  }, [clearCanvas]);

  const handleDelete = useCallback(() => {
    if (deleteSelected()) {
      toast.success("Selected object removed");
    }
  }, [deleteSelected]);

  const handleInspectorUpdate = useCallback(
    (property: InspectorProperty, value: number | string | boolean) => {
      if (!selectedObject) {
        return;
      }

      updateObject(selectedObject, property, value);
      setSelectionRevision((revision) => revision + 1);
    },
    [selectedObject, updateObject],
  );

  const handleLoadProject = useCallback(
    (nextProjectId: string) => {
      if (nextProjectId === projectId) {
        setProjectPickerOpen(false);
        return;
      }

      persistProjectCanvas(projectId);
      setProjectPickerOpen(false);
      navigate("/projects/" + nextProjectId + "/studio");
    },
    [navigate, persistProjectCanvas, projectId],
  );

  const handleCreateProject = useCallback(() => {
    persistProjectCanvas(projectId);
    const newProject = createProject("Untitled level");
    setProjectPickerOpen(false);
    navigate("/projects/" + newProject.id + "/studio");
  }, [createProject, navigate, persistProjectCanvas, projectId]);

  if (!projectId) {
    return (
      <div className="grid min-h-[calc(100svh-4rem)] place-items-center bg-slate-50 p-6">
        <p className="text-sm font-medium text-slate-600">Preparing your drawing workspace…</p>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="grid min-h-[calc(100svh-4rem)] place-items-center bg-slate-50 p-6">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <AlertCircle aria-hidden="true" className="mx-auto size-8 text-amber-500" />
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Project not found</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This saved drawing project is no longer available in local storage.
          </p>
          <Button className="mt-5" onClick={() => navigate("/studio")} variant="outline">
            Create a new project
          </Button>
        </section>
      </div>
    );
  }

  const canAct = Boolean(canvas);

  return (
    <div className="flex h-[calc(100svh-4rem)] flex-col overflow-hidden bg-slate-50">
      <StudioHeader
        canAct={canAct}
        onClear={handleClear}
        onExportJson={handleExportJson}
        onExportPng={handleExportPng}
        onLoad={() => setProjectPickerOpen(true)}
        onProjectNameChange={(name) => renameProject(currentProject.id, name)}
        onSave={handleSave}
        projectName={currentProject.name}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[10rem_minmax(0,1fr)_19rem]">
        <StudioToolbar
          activeTool={activeTool}
          canDelete={selectedObjectCount > 0}
          canRedo={canRedo}
          canUndo={canUndo}
          onDelete={handleDelete}
          onRedo={() => void redo()}
          onSelectTool={setActiveTool}
          onUndo={() => void undo()}
        />
        <StudioCanvas
          canvasContainerRef={canvasContainerRef}
          canvasElementRef={canvasElementRef}
          onResetView={resetView}
          onZoomIn={() => zoomBy(0.2)}
          onZoomOut={() => zoomBy(-0.2)}
          zoom={zoom}
        />
        <InspectorPanel
          object={selectedObject}
          onCommit={commitHistory}
          onDelete={handleDelete}
          onUpdate={handleInspectorUpdate}
          revision={selectionRevision}
        />
      </div>

      <ProjectPicker
        currentProjectId={currentProject.id}
        isOpen={isProjectPickerOpen}
        onClose={() => setProjectPickerOpen(false)}
        onCreateProject={handleCreateProject}
        onSelect={handleLoadProject}
        projects={projects}
      />
    </div>
  );
}
