import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as ort from "onnxruntime-web";
import { CheckCircle2, Loader2, Pencil, Play, UploadCloud } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { DetectionHeader } from "@/components/detection/DetectionHeader";
import { DetectionOverlayCanvas } from "@/components/detection/DetectionOverlayCanvas";
import { DetectionResultsList } from "@/components/detection/DetectionResultsList";
import { GameRecognitionPanel } from "@/components/detection/GameRecognitionPanel";
import { PreprocessingControls } from "@/components/detection/PreprocessingControls";
import { ProjectPicker } from "@/components/drawing/ProjectPicker";
import { ProjectNotFoundState } from "@/components/shared/ProjectNotFoundState";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/project-store";
import {
  DEFAULT_PREPROCESSING_OPTIONS,
  type ModelStatus,
  type OpenCvStatus,
  type PreprocessingOptions,
} from "@/types/detection";
import { getProjectImageBlob } from "@/utils/image-storage";
import { preprocessSketchImage } from "@/vision/image-preprocessing";
import { isOpenCvReady, loadOpenCv } from "@/vision/opencv-loader";
import { loadYoloModel, runYoloDetection } from "@/vision/yolo-detector";

export function DetectionPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const createProject = useProjectStore((state) => state.createProject);
  const clearProjectDetections = useProjectStore((state) => state.clearProjectDetections);
  const projectDetections = useProjectStore((state) => state.projectDetections);
  const projectGameDefinitions = useProjectStore((state) => state.projectGameDefinitions);
  const projectRecognitions = useProjectStore((state) => state.projectRecognitions);
  const projects = useProjectStore((state) => state.projects);
  const projectUploads = useProjectStore((state) => state.projectUploads);
  const renameProject = useProjectStore((state) => state.renameProject);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);
  const setProjectDetections = useProjectStore((state) => state.setProjectDetections);
  const setProjectUpload = useProjectStore((state) => state.setProjectUpload);

  // Local state
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [isProjectPickerOpen, setProjectPickerOpen] = useState(false);

  // OpenCV state
  const [openCvStatus, setOpenCvStatus] = useState<OpenCvStatus>(
    isOpenCvReady() ? "ready" : "loading",
  );
  const [openCvError, setOpenCvError] = useState<string | null>(null);
  const [preprocessingOptions, setPreprocessingOptions] =
    useState<PreprocessingOptions>(DEFAULT_PREPROCESSING_OPTIONS);
  const [preprocessedCanvas, setPreprocessedCanvas] =
    useState<HTMLCanvasElement | null>(null);
  const [stepsApplied, setStepsApplied] = useState<string[]>([]);
  const [isPreprocessing, setIsPreprocessing] = useState(false);

  // YOLO state
  const [modelStatus, setModelStatus] = useState<ModelStatus>("not-configured");
  const [modelMessage, setModelMessage] = useState<string | undefined>();
  const [yoloSession, setYoloSession] = useState<ort.InferenceSession | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.35);
  const [iouThreshold, setIouThreshold] = useState(0.45);
  const [isDetecting, setIsDetecting] = useState(false);

  const currentBlobUrlRef = useRef<string | null>(null);
  currentBlobUrlRef.current = blobUrl;

  const currentProject = projects.find((p) => p.id === projectId);
  const currentUpload = projectId ? projectUploads[projectId] : undefined;
  const currentDetections = (projectId ? projectDetections[projectId] : undefined) ?? [];
  const currentRecognition = projectId ? projectRecognitions[projectId] : undefined;
  const currentGameDefinition = projectId ? projectGameDefinitions[projectId] : undefined;

  const resolvedImageDimensions = useMemo(() => {
    if (imageElement) {
      return {
        height: imageElement.naturalHeight,
        width: imageElement.naturalWidth,
      };
    }
    return currentUpload?.dimensions;
  }, [imageElement, currentUpload?.dimensions]);

  // 1. Auto-redirect if missing projectId
  useEffect(() => {
    if (projectId) {
      setActiveProject(projectId);
      return;
    }

    const targetId = activeProjectId ?? projects[0]?.id ?? null;
    if (targetId) {
      navigate(`/projects/${targetId}/detect`, { replace: true });
    } else {
      const newProject = createProject("Untitled level");
      navigate(`/projects/${newProject.id}/detect`, { replace: true });
    }
  }, [activeProjectId, createProject, navigate, projectId, projects, setActiveProject]);

  // 2. Load OpenCV.js on mount
  const initOpenCv = useCallback(async () => {
    if (isOpenCvReady()) {
      setOpenCvStatus("ready");
      return;
    }

    setOpenCvStatus("loading");
    setOpenCvError(null);
    try {
      await loadOpenCv();
      setOpenCvStatus("ready");
    } catch (error) {
      setOpenCvStatus("error");
      setOpenCvError(
        error instanceof Error ? error.message : "Failed to load OpenCV.js",
      );
    }
  }, []);

  useEffect(() => {
    void initOpenCv();
  }, [initOpenCv]);

  // 3. Check YOLO Model status on mount
  useEffect(() => {
    let isCancelled = false;

    const initModel = async () => {
      const res = await loadYoloModel();
      if (isCancelled) return;

      setModelStatus(res.status);
      setModelMessage(res.message);
      setYoloSession(res.session);
    };

    void initModel();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 4. Load Project Image on projectId change
  useEffect(() => {
    if (!projectId) return;

    let isCancelled = false;
    setIsLoadingImage(true);

    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      setBlobUrl(null);
      setImageElement(null);
    }
    setPreprocessedCanvas(null);
    setStepsApplied([]);

    const fetchImage = async () => {
      try {
        const blob = await getProjectImageBlob(projectId);
        if (isCancelled) return;

        if (blob) {
          const url = URL.createObjectURL(blob);
          const img = new Image();

          img.onload = () => {
            if (isCancelled) return;
            setBlobUrl(url);
            setImageElement(img);
            setIsLoadingImage(false);

            const existingUpload = useProjectStore.getState().projectUploads[projectId];
            if (!existingUpload) {
              setProjectUpload(projectId, {
                dimensions: { height: img.naturalHeight, width: img.naturalWidth },
                fileName: "project-sketch.png",
                fileSize: blob.size,
                mimeType: blob.type || "image/png",
                uploadedAt: new Date().toISOString(),
              });
            }
          };

          img.onerror = () => {
            if (isCancelled) return;
            URL.revokeObjectURL(url);
            setIsLoadingImage(false);
          };

          img.src = url;
        } else {
          setIsLoadingImage(false);
        }
      } catch {
        if (!isCancelled) {
          setIsLoadingImage(false);
        }
      }
    };

    void fetchImage();

    return () => {
      isCancelled = true;
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, [projectId, setProjectUpload]);

  // 5. Preprocessing handler
  const handleApplyPreprocessing = useCallback(async () => {
    if (!imageElement) {
      toast.error("No image available to preprocess.");
      return;
    }

    setIsPreprocessing(true);
    try {
      const res = await preprocessSketchImage(imageElement, preprocessingOptions);
      setPreprocessedCanvas(res.outputCanvas);
      setStepsApplied(res.stepsApplied);
      toast.success("OpenCV preprocessing applied", {
        description: `${res.stepsApplied.length - 1} transformations active.`,
      });
    } catch (error) {
      toast.error("Preprocessing failed", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsPreprocessing(false);
    }
  }, [imageElement, preprocessingOptions]);

  const handleResetPreprocessing = useCallback(() => {
    setPreprocessingOptions(DEFAULT_PREPROCESSING_OPTIONS);
    setPreprocessedCanvas(null);
    setStepsApplied([]);
    toast.info("Preprocessing options reset");
  }, []);

  // 6. Detection handler
  const handleRunDetection = useCallback(async () => {
    if (!projectId || !imageElement) return;

    if (!yoloSession) {
      toast.error("YOLOv8n model is not configured yet.");
      return;
    }

    setIsDetecting(true);
    try {
      const source = preprocessedCanvas ?? imageElement;
      const res = await runYoloDetection(yoloSession, source, {
        confidenceThreshold,
        iouThreshold,
      });

      if (res.status === "ready") {
        setProjectDetections(projectId, res.predictions);
        toast.success("Detection complete", {
          description: `Found ${res.predictions.length} game element(s).`,
        });
      } else {
        toast.error("Detection failed", { description: res.message });
      }
    } catch (error) {
      toast.error("Inference failed", {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsDetecting(false);
    }
  }, [
    confidenceThreshold,
    imageElement,
    iouThreshold,
    preprocessedCanvas,
    projectId,
    setProjectDetections,
    yoloSession,
  ]);

  const handleClearDetections = useCallback(() => {
    if (!projectId) return;
    clearProjectDetections(projectId);
    toast.info("Detections cleared");
  }, [clearProjectDetections, projectId]);

  if (projectId && !currentProject) {
    return <ProjectNotFoundState projectId={projectId} />;
  }

  if (!projectId || !currentProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 aria-hidden="true" className="size-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/80">
      <DetectionHeader
        currentProjectId={projectId}
        onOpenProjectPicker={() => setProjectPickerOpen(true)}
        onProjectNameChange={(name) => renameProject(projectId, name)}
        projectName={currentProject.name}
        stage={currentProject.stage}
      />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {isLoadingImage ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 aria-hidden="true" className="size-10 animate-spin text-brand-600" />
            <p className="text-sm font-medium text-slate-600">Loading project sketch...</p>
          </div>
        ) : !imageElement ? (
          /* Empty state: prompt to draw in studio or upload sketch */
          <div className="max-w-md mx-auto py-16 text-center space-y-4">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-8 ring-brand-50/50">
              <UploadCloud className="size-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">
                No sketch found for this project
              </h2>
              <p className="text-sm text-slate-500">
                Draw a game sketch in the Drawing Studio or upload an image to start computer vision detection and game generation.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild className="gap-2">
                <Link to={`/projects/${projectId}/studio`}>
                  <Pencil className="size-4" />
                  Draw in Studio
                </Link>
              </Button>
              <Button asChild className="gap-2" variant="outline">
                <Link to={`/projects/${projectId}/upload`}>
                  <UploadCloud className="size-4" />
                  Upload Sketch
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pipeline Status Stepper Bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="size-3.5" />
                    <span>1. Sketch Loaded</span>
                  </div>
                  <span className="text-slate-300">→</span>
                  <div className={`flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg border ${
                    stepsApplied.length > 1
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : "text-slate-600 bg-slate-50 border-slate-200"
                  }`}>
                    <span>2. OpenCV: {stepsApplied.length > 1 ? `${stepsApplied.length - 1} Filters` : "Ready"}</span>
                  </div>
                  <span className="text-slate-300">→</span>
                  <div className={`flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg border ${
                    currentDetections.length > 0
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : "text-slate-600 bg-slate-50 border-slate-200"
                  }`}>
                    <span>3. Detection: {currentDetections.length > 0 ? `${currentDetections.length} Objects` : "Pending"}</span>
                  </div>
                  <span className="text-slate-300">→</span>
                  <div className={`flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg border ${
                    currentRecognition?.userSelectedGameType || (currentRecognition?.detectedGameType && currentRecognition.detectedGameType !== "unknown")
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : "text-amber-700 bg-amber-50 border-amber-200"
                  }`}>
                    <span>
                      4. Genre: {currentRecognition?.userSelectedGameType
                        ? `${currentRecognition.userSelectedGameType} (Manual)`
                        : currentRecognition?.detectedGameType && currentRecognition.detectedGameType !== "unknown"
                          ? `${currentRecognition.detectedGameType} (${Math.round(currentRecognition.recognitionConfidence * 100)}%)`
                          : "Uncertain"}
                    </span>
                  </div>
                  <span className="text-slate-300">→</span>
                  <div className={`flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg border ${
                    currentGameDefinition
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : "text-slate-600 bg-slate-50 border-slate-200"
                  }`}>
                    <span>5. Definition: {currentGameDefinition ? "Generated" : "Ready to Build"}</span>
                  </div>
                </div>

                {currentGameDefinition && (
                  <Button asChild className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold" size="sm">
                    <Link to={`/projects/${projectId}/play`}>
                      <Play className="size-3.5 fill-current" />
                      Play Game
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Main two-column detection interface */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_25rem]">
              {/* Left: Image, Preprocessed View, and Detection Overlays */}
              <div className="space-y-6">
                <DetectionOverlayCanvas
                  imageElement={imageElement}
                  originalBlobUrl={blobUrl}
                  predictions={currentDetections}
                  preprocessedCanvas={preprocessedCanvas}
                />
              </div>

              {/* Right: Controls Panel */}
              <div className="space-y-6">
                {projectId && (
                  <GameRecognitionPanel
                    canvas={preprocessedCanvas}
                    imageDimensions={resolvedImageDimensions}
                    predictions={currentDetections}
                    projectId={projectId}
                  />
                )}

                <PreprocessingControls
                  isProcessing={isPreprocessing}
                  onApply={handleApplyPreprocessing}
                  onOptionsChange={setPreprocessingOptions}
                  onReset={handleResetPreprocessing}
                  onRetryOpenCv={initOpenCv}
                  openCvError={openCvError}
                  openCvStatus={openCvStatus}
                  options={preprocessingOptions}
                  stepsApplied={stepsApplied}
                />

                <DetectionResultsList
                  confidenceThreshold={confidenceThreshold}
                  iouThreshold={iouThreshold}
                  isDetecting={isDetecting}
                  modelMessage={modelMessage}
                  modelStatus={modelStatus}
                  onClearDetections={handleClearDetections}
                  onConfidenceChange={setConfidenceThreshold}
                  onIouChange={setIouThreshold}
                  onRunDetection={handleRunDetection}
                  predictions={currentDetections}
                  projectId={projectId}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <ProjectPicker
        currentProjectId={projectId}
        isOpen={isProjectPickerOpen}
        onClose={() => setProjectPickerOpen(false)}
        onCreateProject={() => {
          setProjectPickerOpen(false);
          const newProject = createProject("Untitled level");
          navigate(`/projects/${newProject.id}/detect`);
        }}
        onSelect={(targetId) => {
          setProjectPickerOpen(false);
          navigate(`/projects/${targetId}/detect`);
        }}
        projects={projects}
      />
    </div>
  );
}
