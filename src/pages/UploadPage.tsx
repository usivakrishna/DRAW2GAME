import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ProjectPicker } from "@/components/drawing/ProjectPicker";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { UploadHeader } from "@/components/upload/UploadHeader";
import { UploadPreview } from "@/components/upload/UploadPreview";
import { useProjectStore } from "@/store/project-store";
import type { UploadProcessingState, UploadedImageMetadata } from "@/types/upload";
import { getErrorMessage } from "@/utils/errors";
import {
  deleteProjectImageBlob,
  getProjectImageBlob,
  saveProjectImageBlob,
} from "@/utils/image-storage";
import { getImageDimensions, validateUploadFile } from "@/utils/upload-validation";

export function UploadPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const createProject = useProjectStore((state) => state.createProject);
  const projects = useProjectStore((state) => state.projects);
  const projectUploads = useProjectStore((state) => state.projectUploads);
  const removeProjectUpload = useProjectStore((state) => state.removeProjectUpload);
  const renameProject = useProjectStore((state) => state.renameProject);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const setProjectUpload = useProjectStore((state) => state.setProjectUpload);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProjectPickerOpen, setProjectPickerOpen] = useState(false);
  const [processingState, setProcessingState] = useState<UploadProcessingState>("idle");

  const currentBlobUrlRef = useRef<string | null>(null);
  currentBlobUrlRef.current = blobUrl;

  const currentProject = projects.find((p) => p.id === projectId);
  const currentUploadMetadata: UploadedImageMetadata | undefined = projectId
    ? projectUploads[projectId]
    : undefined;

  // Auto-redirect if missing projectId parameter
  useEffect(() => {
    if (projectId) {
      setActiveProject(projectId);
      return;
    }

    const targetId = activeProjectId ?? projects[0]?.id ?? null;
    if (targetId) {
      navigate(`/projects/${targetId}/upload`, { replace: true });
    } else {
      const newProject = createProject("Untitled level");
      navigate(`/projects/${newProject.id}/upload`, { replace: true });
    }
  }, [activeProjectId, createProject, navigate, projectId, projects, setActiveProject]);

  // Load project upload whenever active projectId changes
  useEffect(() => {
    if (!projectId) {
      return;
    }

    let isCancelled = false;

    const syncUpload = async () => {
      // Revoke any previous URL
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        setBlobUrl(null);
      }
      setErrorMessage(null);

      const metadata = useProjectStore.getState().projectUploads[projectId];
      if (!metadata) {
        setProcessingState("idle");
        return;
      }

      setProcessingState("preparing");
      try {
        const blob = await getProjectImageBlob(projectId);
        if (isCancelled) return;

        if (blob) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setProcessingState("ready");
        } else {
          // If metadata exists but blob is missing, reset
          setProcessingState("idle");
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error));
          setProcessingState("error");
        }
      }
    };

    void syncUpload();

    return () => {
      isCancelled = true;
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, [projectId]);

  // Handle new file upload or replace
  const handleProcessFile = useCallback(
    async (file: File) => {
      if (!projectId) return;

      setErrorMessage(null);

      // 1. Validate file
      const validation = validateUploadFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error);
        toast.error("Invalid file", { description: validation.error });
        // Keep state as ready if there was already an image, or idle
        setProcessingState(currentUploadMetadata ? "ready" : "idle");
        return;
      }

      setProcessingState("preparing");

      try {
        // 2. Measure dimensions
        const dimensions = await getImageDimensions(file);

        // 3. Save blob in IndexedDB
        await saveProjectImageBlob(projectId, file);

        // 4. Update metadata in store
        const metadata: UploadedImageMetadata = {
          dimensions,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "image/png",
          uploadedAt: new Date().toISOString(),
        };
        setProjectUpload(projectId, metadata);

        // 5. Create new object URL for preview
        if (currentBlobUrlRef.current) {
          URL.revokeObjectURL(currentBlobUrlRef.current);
        }
        const newUrl = URL.createObjectURL(file);
        setBlobUrl(newUrl);
        setProcessingState("ready");

        toast.success("Sketch uploaded successfully", {
          description: `${file.name} (${dimensions.width}×${dimensions.height})`,
        });
      } catch (error) {
        const message = getErrorMessage(error);
        setErrorMessage(message);
        setProcessingState(currentUploadMetadata ? "ready" : "error");
        toast.error("Failed to process image", { description: message });
      }
    },
    [currentUploadMetadata, projectId, setProjectUpload],
  );

  // Handle remove upload
  const handleRemoveUpload = useCallback(() => {
    if (!projectId) return;

    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      setBlobUrl(null);
    }

    void deleteProjectImageBlob(projectId);
    removeProjectUpload(projectId);
    setErrorMessage(null);
    setProcessingState("idle");

    toast.info("Uploaded sketch removed");
  }, [projectId, removeProjectUpload]);

  const handleSelectProject = useCallback(
    (targetProjectId: string) => {
      setProjectPickerOpen(false);
      navigate(`/projects/${targetProjectId}/upload`);
    },
    [navigate],
  );

  const handleCreateProject = useCallback(() => {
    setProjectPickerOpen(false);
    const newProject = createProject("Untitled level");
    navigate(`/projects/${newProject.id}/upload`);
  }, [createProject, navigate]);

  if (!projectId || !currentProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 aria-hidden="true" className="size-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/80">
      <UploadHeader
        currentProjectId={projectId}
        onOpenProjectPicker={() => setProjectPickerOpen(true)}
        onProjectNameChange={(name) => renameProject(projectId, name)}
        projectName={currentProject.name}
        stage={currentProject.stage}
      />

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {processingState === "preparing" && !blobUrl ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 aria-hidden="true" className="size-10 animate-spin text-brand-600" />
            <p className="text-sm font-medium text-slate-600">Preparing sketch preview...</p>
          </div>
        ) : blobUrl && currentUploadMetadata ? (
          <UploadPreview
            blobUrl={blobUrl}
            errorMessage={errorMessage}
            isReplacing={processingState === "preparing"}
            metadata={currentUploadMetadata}
            onClearError={() => setErrorMessage(null)}
            onRemove={handleRemoveUpload}
            onReplace={handleProcessFile}
            projectId={projectId}
          />
        ) : (
          <UploadDropzone
            disabled={processingState === "preparing"}
            errorMessage={errorMessage}
            isProcessing={processingState === "preparing"}
            onClearError={() => setErrorMessage(null)}
            onFileSelected={handleProcessFile}
          />
        )}
      </main>

      <ProjectPicker
        currentProjectId={projectId}
        isOpen={isProjectPickerOpen}
        onClose={() => setProjectPickerOpen(false)}
        onCreateProject={handleCreateProject}
        onSelect={handleSelectProject}
        projects={projects}
      />
    </div>
  );
}
