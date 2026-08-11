import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ProjectStage, ProjectSummary } from "@/types/project";
import type { StudioDocument } from "@/types/studio";
import { createId } from "@/utils/ids";

interface ProjectStore {
  activeProjectId: string | null;
  createProject: (name: string) => ProjectSummary;
  projects: ProjectSummary[];
  removeProject: (projectId: string) => void;
  renameProject: (projectId: string, name: string) => void;
  saveStudioDocument: (projectId: string, document: StudioDocument) => void;
  setActiveProject: (projectId: string | null) => void;
  setProjectStage: (projectId: string, stage: ProjectStage) => void;
  studioDocuments: Record<string, StudioDocument>;
}

function getProjectName(name: string) {
  return name.trim() || "Untitled level";
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      activeProjectId: null,
      projects: [],
      studioDocuments: {},
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
        set((state) => ({
          activeProjectId: state.activeProjectId === projectId ? null : state.activeProjectId,
          projects: state.projects.filter((project) => project.id !== projectId),
          studioDocuments: Object.fromEntries(
            Object.entries(state.studioDocuments).filter(([id]) => id !== projectId),
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
    }),
    {
      name: "draw2game-projects",
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        projects: state.projects,
        studioDocuments: state.studioDocuments,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
