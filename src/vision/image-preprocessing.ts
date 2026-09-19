import type { PreprocessingOptions } from "@/types/detection";
import {
  getOpenCvRuntime,
  type OpenCvMat,
  type OpenCvRuntime,
} from "@/vision/opencv-loader";

export interface PreprocessingResult {
  height: number;
  outputCanvas: HTMLCanvasElement;
  stepsApplied: string[];
  width: number;
}

/**
 * Executes OpenCV.js image preprocessing pipeline on a source image/canvas.
 * Guarantees that all intermediate WebAssembly Mat objects are properly deleted.
 */
export async function preprocessSketchImage(
  source: HTMLImageElement | HTMLCanvasElement,
  options: PreprocessingOptions,
  targetCanvas?: HTMLCanvasElement,
): Promise<PreprocessingResult> {
  const cv: OpenCvRuntime = getOpenCvRuntime();

  // Create or reuse output canvas
  const outputCanvas = targetCanvas ?? document.createElement("canvas");
  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;

  outputCanvas.width = width;
  outputCanvas.height = height;

  const matsToClean: OpenCvMat[] = [];
  const stepsApplied: string[] = ["Source image loaded"];

  try {
    // 1. Read source image into OpenCV Mat
    const srcMat = cv.imread(source);
    matsToClean.push(srcMat);

    let currentMat = srcMat.clone();
    matsToClean.push(currentMat);

    let isSingleChannel = false;

    // 2. Grayscale conversion
    if (options.grayscale) {
      const grayMat = new cv.Mat();
      matsToClean.push(grayMat);
      cv.cvtColor(currentMat, grayMat, cv.COLOR_RGBA2GRAY);
      currentMat = grayMat;
      isSingleChannel = true;
      stepsApplied.push("Grayscale conversion (COLOR_RGBA2GRAY)");
    }

    // 3. Gaussian Blur noise reduction
    if (options.gaussianBlur) {
      let k = Math.max(1, Math.round(options.blurKernelSize));
      if (k % 2 === 0) k += 1; // Kernel must be odd

      const blurMat = new cv.Mat();
      matsToClean.push(blurMat);
      const ksize = new cv.Size(k, k);
      cv.GaussianBlur(currentMat, blurMat, ksize, 0);
      currentMat = blurMat;
      stepsApplied.push(`Gaussian noise reduction (${k}×${k})`);
    }

    // 4. Thresholding
    if (options.thresholding) {
      // Ensure single-channel before thresholding
      if (!isSingleChannel) {
        const tempGray = new cv.Mat();
        matsToClean.push(tempGray);
        cv.cvtColor(currentMat, tempGray, cv.COLOR_RGBA2GRAY);
        currentMat = tempGray;
        isSingleChannel = true;
      }

      const threshMat = new cv.Mat();
      matsToClean.push(threshMat);

      if (options.thresholdType === "otsu") {
        cv.threshold(currentMat, threshMat, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
        stepsApplied.push("Otsu thresholding (binary auto-threshold)");
      } else {
        const val = Math.min(255, Math.max(0, options.thresholdValue));
        cv.threshold(currentMat, threshMat, val, 255, cv.THRESH_BINARY);
        stepsApplied.push(`Binary thresholding (threshold: ${val})`);
      }

      currentMat = threshMat;
    }

    // 5. Canny Edge Detection
    if (options.edgeDetection) {
      // Ensure single-channel before Canny
      if (!isSingleChannel) {
        const tempGray = new cv.Mat();
        matsToClean.push(tempGray);
        cv.cvtColor(currentMat, tempGray, cv.COLOR_RGBA2GRAY);
        currentMat = tempGray;
        isSingleChannel = true;
      }

      const cannyMat = new cv.Mat();
      matsToClean.push(cannyMat);
      cv.Canny(
        currentMat,
        cannyMat,
        options.cannyThreshold1,
        options.cannyThreshold2,
      );
      currentMat = cannyMat;
      stepsApplied.push(
        `Canny edge detection (${options.cannyThreshold1} / ${options.cannyThreshold2})`,
      );
    }

    // 6. Draw final result to the target canvas
    cv.imshow(outputCanvas, currentMat);

    return {
      height,
      outputCanvas,
      stepsApplied,
      width,
    };
  } finally {
    // Crucial memory management: delete all allocated Mat instances
    for (const mat of matsToClean) {
      try {
        mat.delete();
      } catch {
        // Safe to ignore if already cleaned up
      }
    }
  }
}
