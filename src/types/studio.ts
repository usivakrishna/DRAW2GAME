import type { DetectionClass } from "@/types/detection";

export const GAME_OBJECT_TYPES = [
  "player",
  "platform",
  "enemy",
  "coin",
  "spike",
  "goal",
] as const satisfies readonly DetectionClass[];

export type GameObjectType = (typeof GAME_OBJECT_TYPES)[number];

export const DRAWING_OBJECT_TYPES = ["pencil", "rectangle", "circle", "line"] as const;

export type DrawingObjectType = (typeof DRAWING_OBJECT_TYPES)[number];

export type StudioObjectType = DrawingObjectType | GameObjectType;

export type StudioTool = "select" | "pan" | "eraser" | StudioObjectType;

export interface StudioObjectMetadata {
  category: "drawing" | "game";
  id: string;
  type: StudioObjectType;
}

export interface StudioWorldSize {
  height: number;
  width: number;
}

export interface StudioDocument {
  canvasJson: string;
  savedAt: string;
  version: 1;
  world: StudioWorldSize;
}

export const DEFAULT_STUDIO_WORLD: StudioWorldSize = {
  height: 1440,
  width: 2560,
};
