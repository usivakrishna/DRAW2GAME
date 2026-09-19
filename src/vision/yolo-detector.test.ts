import { describe, expect, it } from "vitest";
import * as ort from "onnxruntime-web";
import {
  type DetectionBoundingBox,
  type DetectionPrediction,
  DEFAULT_YOLO_CONFIG,
} from "@/types/detection";
import {
  applyNonMaximumSuppression,
  calculateIoU,
  decodeYoloOutput,
  getYoloModelUrl,
  isYoloModelConfigured,
  loadYoloModel,
  unletterboxBox,
  type LetterboxInfo,
} from "@/vision/yolo-detector";

describe("yolo-detector", () => {
  describe("model configuration validation", () => {
    it("reports not-configured status when no model URL is provided without inventing fake detections", async () => {
      expect(isYoloModelConfigured("")).toBe(false);
      expect(getYoloModelUrl("")).toBe("");

      const result = await loadYoloModel("");
      expect(result.status).toBe("not-configured");
      expect(result.session).toBeNull();
      expect(result.message).toContain("YOLOv8n model is not configured yet");
    });
  });

  describe("calculateIoU", () => {
    it("returns 1.0 for identical bounding boxes", () => {
      const box: DetectionBoundingBox = { height: 100, width: 100, x: 10, y: 10 };
      expect(calculateIoU(box, box)).toBe(1);
    });

    it("returns 0.0 for non-overlapping bounding boxes", () => {
      const boxA: DetectionBoundingBox = { height: 50, width: 50, x: 0, y: 0 };
      const boxB: DetectionBoundingBox = { height: 50, width: 50, x: 100, y: 100 };
      expect(calculateIoU(boxA, boxB)).toBe(0);
    });

    it("calculates correct intersection over union for overlapping boxes", () => {
      // 100x100 box at (0,0) and 100x100 box at (50,0)
      // Intersection: 50x100 = 5000
      // AreaA: 10000, AreaB: 10000, Union: 15000
      // IoU: 5000 / 15000 = 0.3333...
      const boxA: DetectionBoundingBox = { height: 100, width: 100, x: 0, y: 0 };
      const boxB: DetectionBoundingBox = { height: 100, width: 100, x: 50, y: 0 };
      const iou = calculateIoU(boxA, boxB);
      expect(iou).toBeCloseTo(0.3333, 3);
    });
  });

  describe("applyNonMaximumSuppression", () => {
    it("keeps distinct objects and eliminates duplicates of same class with high overlap", () => {
      const predHighConf: DetectionPrediction = {
        boundingBox: { height: 60, width: 60, x: 100, y: 100 },
        className: "player",
        confidence: 0.95,
        id: "pred-1",
      };

      const predLowConfOverlap: DetectionPrediction = {
        boundingBox: { height: 62, width: 58, x: 102, y: 101 }, // heavily overlaps pred-1
        className: "player",
        confidence: 0.72,
        id: "pred-2",
      };

      const predDifferentClass: DetectionPrediction = {
        boundingBox: { height: 60, width: 60, x: 100, y: 100 }, // same area but different class
        className: "coin",
        confidence: 0.88,
        id: "pred-3",
      };

      const predDistinctArea: DetectionPrediction = {
        boundingBox: { height: 40, width: 200, x: 300, y: 400 },
        className: "platform",
        confidence: 0.91,
        id: "pred-4",
      };

      const nmsResult = applyNonMaximumSuppression(
        [predLowConfOverlap, predHighConf, predDifferentClass, predDistinctArea],
        0.45,
      );

      // Should keep:
      // - predHighConf (player)
      // - predDifferentClass (coin)
      // - predDistinctArea (platform)
      // Should eliminate: predLowConfOverlap
      expect(nmsResult).toHaveLength(3);
      expect(nmsResult.map((p) => p.id)).toEqual(
        expect.arrayContaining(["pred-1", "pred-3", "pred-4"]),
      );
      expect(nmsResult.some((p) => p.id === "pred-2")).toBe(false);
    });
  });

  describe("unletterboxBox", () => {
    it("scales letterbox coordinates back to original image coordinates", () => {
      // 1000x500 original image letterboxed into 640x640:
      // scale = 640 / 1000 = 0.64
      // scaledWidth = 640, scaledHeight = 320
      // padX = 0, padY = (640 - 320) / 2 = 160
      const letterboxInfo: LetterboxInfo = {
        originalHeight: 500,
        originalWidth: 1000,
        padX: 0,
        padY: 160,
        scale: 0.64,
        targetHeight: 640,
        targetWidth: 640,
      };

      // Box centered at (320, 320), width 64, height 64 in 640x640 space
      const box = { cx: 320, cy: 320, h: 64, w: 64 };
      const originalBox = unletterboxBox(box, letterboxInfo);

      // x1 = (320 - 32 - 0) / 0.64 = 288 / 0.64 = 450
      // y1 = (320 - 32 - 160) / 0.64 = 128 / 0.64 = 200
      // w = 64 / 0.64 = 100
      // h = 64 / 0.64 = 100
      expect(originalBox.x).toBe(450);
      expect(originalBox.y).toBe(200);
      expect(originalBox.width).toBe(100);
      expect(originalBox.height).toBe(100);
    });
  });

  describe("decodeYoloOutput", () => {
    it("decodes valid detections and maps only DRAW2GAME classes", () => {
      const numBoxes = 3;
      const numFeatures = 4 + 6; // 4 box coords + 6 DRAW2GAME classes
      // Dims: [1, 10, 3] (channels-first layout)
      const data = new Float32Array(numFeatures * numBoxes);

      // Box 0: cx=320, cy=320, w=100, h=100, class 0 (player) conf=0.92
      data[0 * numBoxes + 0] = 320; // cx
      data[1 * numBoxes + 0] = 320; // cy
      data[2 * numBoxes + 0] = 100; // w
      data[3 * numBoxes + 0] = 100; // h
      data[4 * numBoxes + 0] = 0.92; // class 0 (player)

      // Box 1: cx=100, cy=100, w=50, h=50, class 3 (coin) conf=0.85
      data[0 * numBoxes + 1] = 100;
      data[1 * numBoxes + 1] = 100;
      data[2 * numBoxes + 1] = 50;
      data[3 * numBoxes + 1] = 50;
      data[7 * numBoxes + 1] = 0.85; // class 3 (coin)

      // Box 2: below threshold (conf=0.15)
      data[0 * numBoxes + 2] = 200;
      data[1 * numBoxes + 2] = 200;
      data[2 * numBoxes + 2] = 40;
      data[3 * numBoxes + 2] = 40;
      data[5 * numBoxes + 2] = 0.15; // class 1 (platform) but low conf

      const outputTensor = new ort.Tensor("float32", data, [1, numFeatures, numBoxes]);

      const letterboxInfo: LetterboxInfo = {
        originalHeight: 640,
        originalWidth: 640,
        padX: 0,
        padY: 0,
        scale: 1,
        targetHeight: 640,
        targetWidth: 640,
      };

      const predictions = decodeYoloOutput(outputTensor, letterboxInfo, {
        ...DEFAULT_YOLO_CONFIG,
        confidenceThreshold: 0.35,
      });

      expect(predictions).toHaveLength(2);
      expect(predictions[0]?.className).toBe("player");
      expect(predictions[0]?.confidence).toBe(0.92);
      expect(predictions[1]?.className).toBe("coin");
      expect(predictions[1]?.confidence).toBe(0.85);
    });
  });
});
