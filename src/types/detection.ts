export type DetectionClass = "coin" | "enemy" | "goal" | "platform" | "player" | "spike";

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
