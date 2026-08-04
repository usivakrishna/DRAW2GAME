import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ProjectStage, ProjectSummary } from "@/types/project";
import { createId } from "@/utils/ids";

interface ProjectStore {
  activeProjectId: string | null;
  createProject: (name: string) => ProjectSummary;
  projects: ProjectSummary[];
  removeProject: (projectId: string) => void;
  renameProject: (projectId: string, name: string) => void;
  setActiveProject: (projectId: string | null) => void;
  setProjectStage: (projectId: string, stage: ProjectStage) => void;
}

function getProjectName(name: string) {
  return name.trim() || "Untitled level";
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      activeProjectId: null,
      projects: [],
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
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
