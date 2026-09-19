import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREPROCESSING_OPTIONS,
  type PreprocessingOptions,
} from "@/types/detection";

describe("image-preprocessing", () => {
  it("provides valid default preprocessing options", () => {
    expect(DEFAULT_PREPROCESSING_OPTIONS.grayscale).toBe(true);
    expect(DEFAULT_PREPROCESSING_OPTIONS.gaussianBlur).toBe(true);
    expect(DEFAULT_PREPROCESSING_OPTIONS.blurKernelSize % 2).toBe(1); // odd
    expect(DEFAULT_PREPROCESSING_OPTIONS.thresholding).toBe(false);
    expect(DEFAULT_PREPROCESSING_OPTIONS.edgeDetection).toBe(false);
  });

  it("ensures custom preprocessing options have valid ranges", () => {
    const custom: PreprocessingOptions = {
      blurKernelSize: 7,
      cannyThreshold1: 60,
      cannyThreshold2: 180,
      edgeDetection: true,
      gaussianBlur: true,
      grayscale: true,
      thresholdType: "binary",
      thresholdValue: 140,
      thresholding: true,
    };

    expect(custom.blurKernelSize).toBeGreaterThan(0);
    expect(custom.cannyThreshold1).toBeLessThan(custom.cannyThreshold2);
    expect(custom.thresholdValue).toBeGreaterThanOrEqual(0);
    expect(custom.thresholdValue).toBeLessThanOrEqual(255);
  });
});
