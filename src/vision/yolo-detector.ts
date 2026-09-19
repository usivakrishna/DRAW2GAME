import * as ort from "onnxruntime-web";
import {
  DRAW2GAME_CLASSES,
  type DetectionBoundingBox,
  type DetectionClass,
  type DetectionPrediction,
  type ModelStatus,
  type YoloModelConfig,
  DEFAULT_YOLO_CONFIG,
} from "@/types/detection";
import { createId } from "@/utils/ids";

export interface LetterboxInfo {
  originalHeight: number;
  originalWidth: number;
  padX: number;
  padY: number;
  scale: number;
  targetHeight: number;
  targetWidth: number;
}

export interface YoloModelSessionResult {
  message?: string;
  session: ort.InferenceSession | null;
  status: ModelStatus;
}

export interface YoloDetectionResult {
  message?: string;
  predictions: DetectionPrediction[];
  status: ModelStatus;
}

/**
 * Gets configured model URL from environment or custom parameter.
 */
export function getYoloModelUrl(customUrl?: string): string {
  const url = customUrl || (import.meta.env.VITE_YOLO_MODEL_URL as string | undefined);
  return (url ?? "").trim();
}

/**
 * Checks if a YOLO model URL has been configured.
 */
export function isYoloModelConfigured(customUrl?: string): boolean {
  return Boolean(getYoloModelUrl(customUrl));
}

/**
 * Validates and loads the ONNX YOLO model.
 * If model URL is not configured or missing, cleanly returns "not-configured" status
 * without crashing or fabricating fake predictions.
 */
export async function loadYoloModel(
  customUrl?: string,
): Promise<YoloModelSessionResult> {
  const modelUrl = getYoloModelUrl(customUrl);

  if (!modelUrl) {
    return {
      message:
        "YOLOv8n model is not configured yet. Please configure a custom-trained ONNX model URL in VITE_YOLO_MODEL_URL containing the 6 DRAW2GAME classes (player, platform, enemy, coin, spike, goal).",
      session: null,
      status: "not-configured",
    };
  }

  try {
    // Configure WASM execution provider for browser compatibility
    const session = await ort.InferenceSession.create(modelUrl, {
      executionProviders: ["wasm"],
    });

    return {
      session,
      status: "ready",
    };
  } catch (error) {
    return {
      message: `Failed to load YOLO model from "${modelUrl}": ${
        error instanceof Error ? error.message : String(error)
      }`,
      session: null,
      status: "error",
    };
  }
}

/**
 * Letterboxes an image into target dimensions (default 640x640)
 * preserving aspect ratio with centered padding.
 */
export function letterboxImage(
  source: HTMLImageElement | HTMLCanvasElement,
  targetWidth = 640,
  targetHeight = 640,
): { canvas: HTMLCanvasElement; letterboxInfo: LetterboxInfo } {
  const originalWidth = "naturalWidth" in source ? source.naturalWidth : source.width;
  const originalHeight = "naturalHeight" in source ? source.naturalHeight : source.height;

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    throw new Error("Unable to create 2D canvas context for letterboxing.");
  }

  // Fill background with neutral gray (114/255 standard YOLO padding)
  ctx.fillStyle = "rgb(114, 114, 114)";
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Compute scale and offsets
  const scale = Math.min(targetWidth / originalWidth, targetHeight / originalHeight);
  const scaledWidth = originalWidth * scale;
  const scaledHeight = originalHeight * scale;
  const padX = (targetWidth - scaledWidth) / 2;
  const padY = (targetHeight - scaledHeight) / 2;

  ctx.drawImage(source, padX, padY, scaledWidth, scaledHeight);

  return {
    canvas,
    letterboxInfo: {
      originalHeight,
      originalWidth,
      padX,
      padY,
      scale,
      targetHeight,
      targetWidth,
    },
  };
}

/**
 * Converts a letterboxed image canvas into a 1x3xHxW Float32Array ONNX Tensor
 * with [0.0, 1.0] normalized RGB values in CHW planar format.
 */
export function imageToTensor(
  letterboxedCanvas: HTMLCanvasElement,
  width = 640,
  height = 640,
): ort.Tensor {
  const ctx = letterboxedCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Unable to get canvas context for tensor conversion.");
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData; // RGBA Uint8ClampedArray

  const numPixels = width * height;
  const floatData = new Float32Array(3 * numPixels);

  // Layout: RRRR... GGGG... BBBB... (CHW layout)
  for (let i = 0; i < numPixels; i++) {
    const r = (data[i * 4] ?? 0) / 255.0;
    const g = (data[i * 4 + 1] ?? 0) / 255.0;
    const b = (data[i * 4 + 2] ?? 0) / 255.0;

    floatData[i] = r; // Red channel
    floatData[numPixels + i] = g; // Green channel
    floatData[2 * numPixels + i] = b; // Blue channel
  }

  return new ort.Tensor("float32", floatData, [1, 3, height, width]);
}

/**
 * Calculates Intersection over Union (IoU) between two bounding boxes.
 */
export function calculateIoU(
  boxA: DetectionBoundingBox,
  boxB: DetectionBoundingBox,
): number {
  const x1 = Math.max(boxA.x, boxB.x);
  const y1 = Math.max(boxA.y, boxB.y);
  const x2 = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
  const y2 = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

  const intersectionWidth = Math.max(0, x2 - x1);
  const intersectionHeight = Math.max(0, y2 - y1);
  const intersectionArea = intersectionWidth * intersectionHeight;

  const areaA = boxA.width * boxA.height;
  const areaB = boxB.width * boxB.height;
  const unionArea = areaA + areaB - intersectionArea;

  if (unionArea <= 0) {
    return 0;
  }

  return intersectionArea / unionArea;
}

/**
 * Applies Non-Maximum Suppression (NMS) to eliminate overlapping lower-confidence detections.
 */
export function applyNonMaximumSuppression(
  predictions: DetectionPrediction[],
  iouThreshold = 0.45,
): DetectionPrediction[] {
  // Sort descending by confidence
  const sorted = [...predictions].sort((a, b) => b.confidence - a.confidence);
  const selected: DetectionPrediction[] = [];

  for (const candidate of sorted) {
    let shouldKeep = true;

    for (const kept of selected) {
      if (candidate.className === kept.className) {
        const iou = calculateIoU(candidate.boundingBox, kept.boundingBox);
        if (iou > iouThreshold) {
          shouldKeep = false;
          break;
        }
      }
    }

    if (shouldKeep) {
      selected.push(candidate);
    }
  }

  return selected;
}

/**
 * Converts bounding box from 640x640 letterbox space back to original image space.
 */
export function unletterboxBox(
  box: { cx: number; cy: number; h: number; w: number },
  info: LetterboxInfo,
): DetectionBoundingBox {
  const x1 = (box.cx - box.w / 2 - info.padX) / info.scale;
  const y1 = (box.cy - box.h / 2 - info.padY) / info.scale;
  const w = box.w / info.scale;
  const h = box.h / info.scale;

  const clampedX = Math.max(0, Math.min(info.originalWidth, x1));
  const clampedY = Math.max(0, Math.min(info.originalHeight, y1));
  const clampedWidth = Math.max(0, Math.min(info.originalWidth - clampedX, w));
  const clampedHeight = Math.max(0, Math.min(info.originalHeight - clampedY, h));

  return {
    height: Math.round(clampedHeight),
    width: Math.round(clampedWidth),
    x: Math.round(clampedX),
    y: Math.round(clampedY),
  };
}

/**
 * Decodes raw YOLOv8 output tensor [1, 4 + num_classes, 8400] into structured predictions.
 */
export function decodeYoloOutput(
  outputTensor: ort.Tensor,
  letterboxInfo: LetterboxInfo,
  config: YoloModelConfig = DEFAULT_YOLO_CONFIG,
): DetectionPrediction[] {
  const data = outputTensor.data as Float32Array;
  const dims = outputTensor.dims; // [1, 4 + num_classes, 8400] or [1, 8400, 4 + num_classes]

  if (!dims || dims.length < 3) {
    return [];
  }

  const dim1 = dims[1];
  const dim2 = dims[2];
  if (dim1 === undefined || dim2 === undefined) {
    return [];
  }

  const numClassesExpected = config.classes.length;
  let isChannelsFirst = true;
  let numFeatures = dim1;
  let numBoxes = dim2;

  if (dim1 === 4 + numClassesExpected) {
    isChannelsFirst = true;
    numFeatures = dim1;
    numBoxes = dim2;
  } else if (dim2 === 4 + numClassesExpected) {
    isChannelsFirst = false;
    numFeatures = dim2;
    numBoxes = dim1;
  } else if (dim1 < dim2) {
    isChannelsFirst = true;
    numFeatures = dim1;
    numBoxes = dim2;
  } else {
    isChannelsFirst = false;
    numFeatures = dim2;
    numBoxes = dim1;
  }

  const numClasses = numFeatures - 4;

  if (numClasses <= 0) {
    return [];
  }

  const rawPredictions: DetectionPrediction[] = [];

  for (let boxIdx = 0; boxIdx < numBoxes; boxIdx++) {
    // Read box coords [cx, cy, w, h]
    let cx = 0;
    let cy = 0;
    let w = 0;
    let h = 0;

    if (isChannelsFirst) {
      cx = data[0 * numBoxes + boxIdx] ?? 0;
      cy = data[1 * numBoxes + boxIdx] ?? 0;
      w = data[2 * numBoxes + boxIdx] ?? 0;
      h = data[3 * numBoxes + boxIdx] ?? 0;
    } else {
      const offset = boxIdx * numFeatures;
      cx = data[offset] ?? 0;
      cy = data[offset + 1] ?? 0;
      w = data[offset + 2] ?? 0;
      h = data[offset + 3] ?? 0;
    }

    // Find class with maximum confidence score
    let maxConfidence = 0;
    let bestClassIdx = -1;

    for (let c = 0; c < numClasses; c++) {
      const score = isChannelsFirst
        ? (data[(4 + c) * numBoxes + boxIdx] ?? 0)
        : (data[boxIdx * numFeatures + 4 + c] ?? 0);

      if (score > maxConfidence) {
        maxConfidence = score;
        bestClassIdx = c;
      }
    }

    if (maxConfidence >= config.confidenceThreshold && bestClassIdx >= 0) {
      const detectedClassName = config.classes[bestClassIdx] ?? `class_${bestClassIdx}`;
      const mappedClass = (config.classMap?.[detectedClassName] ??
        detectedClassName) as DetectionClass;

      // Only include if recognized as a DRAW2GAME class
      if (DRAW2GAME_CLASSES.includes(mappedClass)) {
        const boundingBox = unletterboxBox({ cx, cy, h, w }, letterboxInfo);

        if (boundingBox.width > 2 && boundingBox.height > 2) {
          rawPredictions.push({
            boundingBox,
            className: mappedClass,
            confidence: parseFloat(maxConfidence.toFixed(3)),
            id: createId("det"),
          });
        }
      }
    }
  }

  return applyNonMaximumSuppression(rawPredictions, config.iouThreshold);
}

/**
 * Runs the full client-side YOLO detection pipeline on an image or preprocessed canvas.
 */
export async function runYoloDetection(
  session: ort.InferenceSession | null,
  source: HTMLImageElement | HTMLCanvasElement,
  customConfig?: Partial<YoloModelConfig>,
): Promise<YoloDetectionResult> {
  if (!session) {
    return {
      message:
        "YOLOv8n model is not configured yet. No inference was run. Please configure VITE_YOLO_MODEL_URL with a trained model.",
      predictions: [],
      status: "not-configured",
    };
  }

  const config: YoloModelConfig = {
    ...DEFAULT_YOLO_CONFIG,
    ...customConfig,
  };

  try {
    const { canvas: letterboxedCanvas, letterboxInfo } = letterboxImage(
      source,
      config.inputWidth,
      config.inputHeight,
    );

    const inputTensor = imageToTensor(
      letterboxedCanvas,
      config.inputWidth,
      config.inputHeight,
    );

    const inputName = session.inputNames[0] ?? "images";
    const feeds: Record<string, ort.Tensor> = { [inputName]: inputTensor };

    const outputMap = await session.run(feeds);
    const outputName = session.outputNames[0] ?? Object.keys(outputMap)[0];
    if (!outputName) {
      return {
        message: "Model produced no output tensor.",
        predictions: [],
        status: "error",
      };
    }
    const outputTensor = outputMap[outputName];

    if (!outputTensor) {
      return {
        message: "Model output tensor was empty.",
        predictions: [],
        status: "error",
      };
    }

    const predictions = decodeYoloOutput(outputTensor, letterboxInfo, config);

    return {
      predictions,
      status: "ready",
    };
  } catch (error) {
    return {
      message: `Inference failed: ${error instanceof Error ? error.message : String(error)}`,
      predictions: [],
      status: "error",
    };
  }
}
