import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ChessGameDefinition } from "@/game/chess/chess-definition";
import type { GameDefinition, GameType } from "@/game/core/game-definition";
import {
  gameDefinitionToLevelDefinition,
  isPlatformerGameDefinition,
  levelDefinitionToGameDefinition,
} from "@/game/core/platformer-definition";
import type { GameRecognitionRecord } from "@/game/recognition/types";
import type { LevelDefinition } from "@/json/level-schema";
import type { DetectionPrediction } from "@/types/detection";
import type { ProjectStage, ProjectSummary } from "@/types/project";
import type { StudioDocument } from "@/types/studio";
import type { UploadedImageMetadata } from "@/types/upload";
import { createId } from "@/utils/ids";
import { deleteProjectImageBlob } from "@/utils/image-storage";

interface ProjectStore {
  activeProjectId: string | null;
  clearProjectChessGame: (projectId: string) => void;
  clearProjectDetections: (projectId: string) => void;
  clearProjectGameDefinition: (projectId: string) => void;
  clearProjectLevel: (projectId: string) => void;
  clearProjectRecognition: (projectId: string) => void;
  createProject: (name: string) => ProjectSummary;
  projectChessGames: Record<string, ChessGameDefinition>;
  projectDetections: Record<string, DetectionPrediction[]>;
  projectGameDefinitions: Record<string, GameDefinition>;
  projectLevels: Record<string, LevelDefinition>;
  projectRecognitions: Record<string, GameRecognitionRecord>;
  projects: ProjectSummary[];
  projectUploads: Record<string, UploadedImageMetadata>;
  removeProject: (projectId: string) => void;
  removeProjectUpload: (projectId: string) => void;
  renameProject: (projectId: string, name: string) => void;
  saveStudioDocument: (projectId: string, document: StudioDocument) => void;
  setActiveProject: (projectId: string | null) => void;
  setProjectChessGame: (projectId: string, game: ChessGameDefinition) => void;
  setProjectDetections: (projectId: string, detections: DetectionPrediction[]) => void;
  setProjectGameDefinition: (projectId: string, def: GameDefinition) => void;
  setProjectLevel: (projectId: string, level: LevelDefinition) => void;
  setProjectRecognition: (projectId: string, record: GameRecognitionRecord) => void;
  setProjectStage: (projectId: string, stage: ProjectStage) => void;
  setProjectUpload: (projectId: string, metadata: UploadedImageMetadata) => void;
  setUserSelectedGameType: (projectId: string, gameType: GameType) => void;
  studioDocuments: Record<string, StudioDocument>;
}

function getProjectName(name: string) {
  return name.trim() || "Untitled level";
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      activeProjectId: null,
      projectChessGames: {},
      projectDetections: {},
      projectGameDefinitions: {},
      projectLevels: {},
      projectRecognitions: {},
      projects: [],
      projectUploads: {},
      studioDocuments: {},
      clearProjectChessGame: (projectId) => {
        set((state) => ({
          projectChessGames: Object.fromEntries(
            Object.entries(state.projectChessGames).filter(([id]) => id !== projectId),
          ),
          projectGameDefinitions: Object.fromEntries(
            Object.entries(state.projectGameDefinitions).filter(
              ([id, def]) => id !== projectId || def.gameType !== "chess",
            ),
          ),
        }));
      },
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
      clearProjectGameDefinition: (projectId) => {
        set((state) => ({
          projectGameDefinitions: Object.fromEntries(
            Object.entries(state.projectGameDefinitions).filter(([id]) => id !== projectId),
          ),
        }));
      },
      clearProjectRecognition: (projectId) => {
        set((state) => ({
          projectRecognitions: Object.fromEntries(
            Object.entries(state.projectRecognitions).filter(([id]) => id !== projectId),
          ),
        }));
      },
      clearProjectLevel: (projectId) => {
        const timestamp = new Date().toISOString();
        set((state) => ({
          projectGameDefinitions: Object.fromEntries(
            Object.entries(state.projectGameDefinitions).filter(
              ([id, def]) => id !== projectId || def.gameType !== "platformer",
            ),
          ),
          projectLevels: Object.fromEntries(
            Object.entries(state.projectLevels).filter(([id]) => id !== projectId),
          ),
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  stage: state.projectDetections[projectId]
                    ? ("detected" as const)
                    : state.projectUploads[projectId]
                      ? ("uploaded" as const)
                      : ("draft" as const),
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
          projectChessGames: Object.fromEntries(
            Object.entries(state.projectChessGames).filter(([id]) => id !== projectId),
          ),
          projectDetections: Object.fromEntries(
            Object.entries(state.projectDetections).filter(([id]) => id !== projectId),
          ),
          projectGameDefinitions: Object.fromEntries(
            Object.entries(state.projectGameDefinitions).filter(([id]) => id !== projectId),
          ),
          projectLevels: Object.fromEntries(
            Object.entries(state.projectLevels).filter(([id]) => id !== projectId),
          ),
          projectRecognitions: Object.fromEntries(
            Object.entries(state.projectRecognitions).filter(([id]) => id !== projectId),
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
      setProjectGameDefinition: (projectId, def) => {
        const timestamp = new Date().toISOString();
        set((state) => {
          const updatedGameDefs = {
            ...state.projectGameDefinitions,
            [projectId]: def,
          };

          let updatedLevels = state.projectLevels;
          let updatedChessGames = state.projectChessGames;

          if (def.gameType === "platformer" && isPlatformerGameDefinition(def)) {
            try {
              const level = gameDefinitionToLevelDefinition(def);
              updatedLevels = {
                ...state.projectLevels,
                [projectId]: level,
              };
            } catch {
              // Ignore parsing errors if definition payload is custom
            }
          } else if (def.gameType === "chess") {
            updatedChessGames = {
              ...state.projectChessGames,
              [projectId]: def as ChessGameDefinition,
            };
          }

          return {
            projectChessGames: updatedChessGames,
            projectGameDefinitions: updatedGameDefs,
            projectLevels: updatedLevels,
            projects: state.projects.map((project) =>
              project.id === projectId
                ? {
                    ...project,
                    stage: "generated" as const,
                    updatedAt: timestamp,
                  }
                : project,
            ),
          };
        });
      },
      setProjectLevel: (projectId, level) => {
        const timestamp = new Date().toISOString();
        const gameDef = levelDefinitionToGameDefinition(level, projectId);
        set((state) => ({
          projectGameDefinitions: {
            ...state.projectGameDefinitions,
            [projectId]: gameDef,
          },
          projectLevels: {
            ...state.projectLevels,
            [projectId]: level,
          },
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  stage: "generated" as const,
                  updatedAt: timestamp,
                }
              : project,
          ),
        }));
      },
      setProjectRecognition: (projectId, record) => {
        set((state) => ({
          projectRecognitions: {
            ...state.projectRecognitions,
            [projectId]: record,
          },
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
      setProjectChessGame: (projectId, game) => {
        const timestamp = new Date().toISOString();
        set((state) => ({
          projectChessGames: {
            ...state.projectChessGames,
            [projectId]: game,
          },
          projectGameDefinitions: {
            ...state.projectGameDefinitions,
            [projectId]: game,
          },
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  stage: "generated" as const,
                  updatedAt: timestamp,
                }
              : project,
          ),
        }));
      },
      setUserSelectedGameType: (projectId, gameType) => {
        set((state) => {
          const existing = state.projectRecognitions[projectId];
          const isPlayable = gameType === "platformer" || gameType === "chess";
          const updated: GameRecognitionRecord = existing
            ? {
                ...existing,
                userSelectedGameType: gameType,
              }
            : {
                detectedGameType: "unknown",
                recognitionConfidence: 1.0,
                recognitionEvidence: [`Manually selected as ${gameType}`],
                recognitionSource: "manual",
                recognitionWarnings: isPlayable
                  ? []
                  : [
                      `Gameplay engine for "${gameType}" is an architecture extension point coming in a future phase.`,
                    ],
                recognizedAt: new Date().toISOString(),
                userSelectedGameType: gameType,
              };

          return {
            projectRecognitions: {
              ...state.projectRecognitions,
              [projectId]: updated,
            },
          };
        });
      },
    }),
    {
      name: "draw2game-projects",
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
        projectChessGames: state.projectChessGames,
        projectDetections: state.projectDetections,
        projectGameDefinitions: state.projectGameDefinitions,
        projectLevels: state.projectLevels,
        projectRecognitions: state.projectRecognitions,
        projects: state.projects,
        projectUploads: state.projectUploads,
        studioDocuments: state.studioDocuments,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
