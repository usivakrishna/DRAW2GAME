/**
 * DRAW2GAME — Phase 11: Game Recognition & Game-Type Detection
 * Structural Feature Extraction Engine
 *
 * Analyzes object detection bounding boxes, spatial coordinates,
 * geometric aspects, and visual topology without fabricating fake AI predictions.
 */

import type { DetectionPrediction } from "@/types/detection";
import type { StructuralFeatures } from "./types";

export interface FeatureExtractionInput {
  canvas?: HTMLCanvasElement | null | undefined;
  customSignals?: Partial<StructuralFeatures> | undefined;
  imageDimensions?: { height: number; width: number } | undefined;
  predictions?: DetectionPrediction[] | undefined;
}

/**
 * Extracts normalized, explainable structural features from available
 * detections, dimensional canvas bounds, and geometric layout topology.
 */
export function extractStructuralFeatures(
  input: FeatureExtractionInput = {},
): StructuralFeatures {
  const { canvas, customSignals, imageDimensions, predictions = [] } = input;

  // 1. Resolve dimensions & aspect ratio
  let width = imageDimensions?.width ?? canvas?.width ?? 1280;
  let height = imageDimensions?.height ?? canvas?.height ?? 720;
  if (width <= 0) width = 1280;
  if (height <= 0) height = 720;

  const aspectRatio = Number((width / height).toFixed(2));
  const isNearSquare = aspectRatio >= 0.85 && aspectRatio <= 1.15;
  const isNearDoubleSquare = aspectRatio >= 1.65 && aspectRatio <= 2.4;

  // 2. Compute object class counts
  const classCounts: Record<string, number> = {
    coin: 0,
    enemy: 0,
    goal: 0,
    platform: 0,
    player: 0,
    spike: 0,
  };

  for (const pred of predictions) {
    classCounts[pred.className] = (classCounts[pred.className] ?? 0) + 1;
  }

  // 3. Analyze bounding box geometries
  let horizontalSegmentsCount = 0;
  let verticalSegmentsCount = 0;
  let circularRegionsCount = 0;
  let cornerPocketsCount = 0;
  let hasBottomBaseline = false;

  const yPositions: number[] = [];

  for (const pred of predictions) {
    const { height: bh, width: bw, x, y } = pred.boundingBox;
    const boxAspect = bh > 0 ? bw / bh : 1;

    // Horizontal segment: width significantly exceeds height
    if (boxAspect >= 2.0 || pred.className === "platform") {
      horizontalSegmentsCount += 1;
      yPositions.push(y);

      // Check if it rests near the bottom third
      if (y >= height * 0.65) {
        hasBottomBaseline = true;
      }
    }

    // Vertical segment: height significantly exceeds width
    if (bh >= bw * 2.0) {
      verticalSegmentsCount += 1;
    }

    // Circular / near-square region (coins, tokens, pockets, balls)
    if (boxAspect >= 0.75 && boxAspect <= 1.35) {
      circularRegionsCount += 1;
    }

    // Check if located in corner zones (within 18% of edge margins)
    const inLeft = x <= width * 0.18;
    const inRight = x + bw >= width * 0.82;
    const inTop = y <= height * 0.18;
    const inBottom = y + bh >= height * 0.82;

    if ((inLeft || inRight) && (inTop || inBottom)) {
      cornerPocketsCount += 1;
    }
  }

  // 4. Analyze vertical tiers (at least 2 distinct Y tiers with > 70px gap)
  let hasVerticalSeparation = false;
  if (yPositions.length >= 2) {
    const sortedY = [...yPositions].sort((a, b) => a - b);
    for (let i = 1; i < sortedY.length; i++) {
      const prev = sortedY[i - 1];
      const curr = sortedY[i];
      if (prev !== undefined && curr !== undefined && curr - prev >= 70) {
        hasVerticalSeparation = true;
        break;
      }
    }
  }

  const hasPlayerGoalPair =
    (classCounts["player"] ?? 0) > 0 && (classCounts["goal"] ?? 0) > 0;

  // 5. Default structural indicators (can be augmented by customSignals)
  const defaultFeatures: StructuralFeatures = {
    aspectRatio,
    circularRegionsCount,
    classCounts: {
      coin: classCounts["coin"] ?? 0,
      enemy: classCounts["enemy"] ?? 0,
      goal: classCounts["goal"] ?? 0,
      platform: classCounts["platform"] ?? 0,
      player: classCounts["player"] ?? 0,
      spike: classCounts["spike"] ?? 0,
      ...classCounts,
    },
    continuousPathDetected: false,
    cornerPocketsCount,
    dimensions: { height, width },
    discreteTilesDetected: false,
    gridCellsCount: 0,
    hasBottomBaseline,
    hasPlayerGoalPair,
    hasVerticalSeparation,
    horizontalSegmentsCount,
    isNearDoubleSquare,
    isNearSquare,
    opposingGoalZonesDetected: false,
    predictions,
    quadrantSymmetryDetected: false,
    reticleDetected: false,
    verticalSegmentsCount,
  };

  // Merge with custom signals if provided (e.g. from OpenCV or test fixtures)
  return {
    ...defaultFeatures,
    ...customSignals,
  };
}
