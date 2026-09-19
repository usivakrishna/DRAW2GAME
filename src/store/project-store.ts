import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DetectionPrediction } from "@/types/detection";
import type { ProjectStage, ProjectSummary } from "@/types/project";
import type { StudioDocument } from "@/types/studio";
import type { UploadedImageMetadata } from "@/types/upload";
import { createId } from "@/utils/ids";
import { deleteProjectImageBlob } from "@/utils/image-storage";

interface ProjectStore {
  activeProjectId: string | null;
  clearProjectDetections: (projectId: string) => void;
  createProject: (name: string) => ProjectSummary;
  projectDetections: Record<string, DetectionPrediction[]>;
  projects: ProjectSummary[];
  projectUploads: Record<string, UploadedImageMetadata>;
  removeProject: (projectId: string) => void;
  removeProjectUpload: (projectId: string) => void;
  renameProject: (projectId: string, name: string) => void;
  saveStudioDocument: (projectId: string, document: StudioDocument) => void;
  setActiveProject: (projectId: string | null) => void;
  setProjectDetections: (projectId: string, detections: DetectionPrediction[]) => void;
  setProjectStage: (projectId: string, stage: ProjectStage) => void;
  setProjectUpload: (projectId: string, metadata: UploadedImageMetadata) => void;
  studioDocuments: Record<string, StudioDocument>;
}

function getProjectName(name: string) {
  return name.trim() || "Untitled level";
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      activeProjectId: null,
      projectDetections: {},
      projects: [],
      projectUploads: {},
      studioDocuments: {},
      clearProjectDetections: (projectId) => {
        const timestamp = new Date().toISOString();
        set((state) => ({
          projectDetections: Object.fromEntries(
            Object.entries(state.projectDetections).filter(([id]) => id !== projectId),
          ),
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  stage: state.projectUploads[projectId] ? ("uploaded" as const) : ("draft" as const),
                  updatedAt: timestamp,
                }
              : project,
          ),
        }));
      },
      createProject: (name) => {
        const timestamp = new Date().toISOString();
        const project: ProjectSummary = {
          createdAt: timestamp,
          id: createId("project"),
          name: getProjectName(name),
          stage: "draft",
          updatedAt: timestamp,
        };

        set((state) => ({
          activeProjectId: project.id,
          projects: [project, ...state.projects],
        }));

        return project;
      },
      removeProject: (projectId) => {
        void deleteProjectImageBlob(projectId);
        set((state) => ({
          activeProjectId: state.activeProjectId === projectId ? null : state.activeProjectId,
          projectDetections: Object.fromEntries(
            Object.entries(state.projectDetections).filter(([id]) => id !== projectId),
          ),
          projects: state.projects.filter((project) => project.id !== projectId),
          projectUploads: Object.fromEntries(
            Object.entries(state.projectUploads).filter(([id]) => id !== projectId),
          ),
          studioDocuments: Object.fromEntries(
            Object.entries(state.studioDocuments).filter(([id]) => id !== projectId),
          ),
        }));
      },
      removeProjectUpload: (projectId) => {
        void deleteProjectImageBlob(projectId);
        const timestamp = new Date().toISOString();

        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  stage: project.stage === "uploaded" ? ("draft" as const) : project.stage,
                  updatedAt: timestamp,
                }
              : project,
          ),
          projectUploads: Object.fromEntries(
            Object.entries(state.projectUploads).filter(([id]) => id !== projectId),
          ),
        }));
      },
      renameProject: (projectId, name) => {
        const nextName = getProjectName(name);
        const timestamp = new Date().toISOString();

        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  name: nextName,
                  updatedAt: timestamp,
                }
              : project,
          ),
        }));
      },
      saveStudioDocument: (projectId, document) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  updatedAt: document.savedAt,
                }
              : project,
          ),
          studioDocuments: {
            ...state.studioDocuments,
            [projectId]: document,
          },
        }));
      },
      setActiveProject: (projectId) => {
        set({ activeProjectId: projectId });
      },
      setProjectDetections: (projectId, detections) => {
        const timestamp = new Date().toISOString();
        set((state) => ({
          projectDetections: {
            ...state.projectDetections,
            [projectId]: detections,
          },
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  stage: "detected" as const,
                  updatedAt: timestamp,
                }
              : project,
          ),
        }));
      },
      setProjectStage: (projectId, stage) => {
        const timestamp = new Date().toISOString();

        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  stage,
                  updatedAt: timestamp,
                }
              : project,
          ),
        }));
      },
      setProjectUpload: (projectId, metadata) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  stage: "uploaded" as const,
                  updatedAt: metadata.uploadedAt,
                }
              : project,
          ),
          projectUploads: {
            ...state.projectUploads,
            [projectId]: metadata,
          },
        }));
      },
    }),
    {
      name: "draw2game-projects",
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        projectDetections: state.projectDetections,
        projects: state.projects,
        projectUploads: state.projectUploads,
        studioDocuments: state.studioDocuments,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
