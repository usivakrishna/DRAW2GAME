export type ProjectStage = "draft" | "uploaded" | "detected" | "generated";

export interface ProjectSummary {
  createdAt: string;
  id: string;
  name: string;
  stage: ProjectStage;
  updatedAt: string;
}
