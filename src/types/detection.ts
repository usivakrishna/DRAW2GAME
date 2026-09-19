export const DRAW2GAME_CLASSES = [
  "player",
  "platform",
  "enemy",
  "coin",
  "spike",
  "goal",
] as const;

export type DetectionClass = (typeof DRAW2GAME_CLASSES)[number];

export const CLASS_COLORS: Record<
  DetectionClass,
  { bg: string; border: string; fill: string; text: string }
> = {
  player: {
    bg: "bg-emerald-50",
    border: "#10b981", // emerald-500
    fill: "rgba(16, 185, 129, 0.15)",
    text: "text-emerald-700",
  },
  platform: {
    bg: "bg-amber-50",
    border: "#f59e0b", // amber-500
    fill: "rgba(245, 158, 11, 0.15)",
    text: "text-amber-700",
  },
  enemy: {
    bg: "bg-rose-50",
    border: "#f43f5e", // rose-500
    fill: "rgba(244, 63, 94, 0.15)",
    text: "text-rose-700",
  },
  coin: {
    bg: "bg-yellow-50",
    border: "#eab308", // yellow-500
    fill: "rgba(234, 179, 8, 0.15)",
    text: "text-yellow-700",
  },
  spike: {
    bg: "bg-purple-50",
    border: "#a855f7", // purple-500
    fill: "rgba(168, 85, 247, 0.15)",
    text: "text-purple-700",
  },
  goal: {
    bg: "bg-sky-50",
    border: "#0ea5e9", // sky-500
    fill: "rgba(14, 165, 233, 0.15)",
    text: "text-sky-700",
  },
};

export const CLASS_LABELS: Record<DetectionClass, string> = {
  coin: "Coin",
  enemy: "Enemy",
  goal: "Goal",
  platform: "Platform",
  player: "Player",
  spike: "Spike",
};

export interface DetectionBoundingBox {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface DetectionPrediction {
  boundingBox: DetectionBoundingBox;
  className: DetectionClass;
  confidence: number;
  id: string;
}

export interface PreprocessingOptions {
  blurKernelSize: number; // Must be odd, e.g. 5
  cannyThreshold1: number; // 0-255
  cannyThreshold2: number; // 0-255
  edgeDetection: boolean;
  gaussianBlur: boolean;
  grayscale: boolean;
  thresholdType: "otsu" | "binary";
  thresholdValue: number; // 0-255
  thresholding: boolean;
}

export const DEFAULT_PREPROCESSING_OPTIONS: PreprocessingOptions = {
  blurKernelSize: 5,
  cannyThreshold1: 50,
  cannyThreshold2: 150,
  edgeDetection: false,
  gaussianBlur: true,
  grayscale: true,
  thresholdType: "otsu",
  thresholdValue: 128,
  thresholding: false,
};

export type OpenCvStatus = "idle" | "loading" | "ready" | "error";

export type ModelStatus =
  | "not-configured"
  | "loading"
  | "ready"
  | "incompatible-classes"
  | "error";

export type DetectionPipelineState =
  | "idle"
  | "preprocessing"
  | "detecting"
  | "complete"
  | "error";

export interface YoloModelConfig {
  classes: string[];
  classMap?: Record<string, DetectionClass>;
  confidenceThreshold: number;
  inputHeight: number;
  inputWidth: number;
  iouThreshold: number;
  modelUrl: string;
}

export const DEFAULT_YOLO_CONFIG: YoloModelConfig = {
  classes: [...DRAW2GAME_CLASSES],
  confidenceThreshold: 0.35,
  inputHeight: 640,
  inputWidth: 640,
  iouThreshold: 0.45,
  modelUrl: "",
};
