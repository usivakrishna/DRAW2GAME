export interface OpenCvMat {
  channels: () => number;
  clone: () => OpenCvMat;
  cols: number;
  copyTo: (dst: OpenCvMat) => void;
  data: Uint8Array;
  data32F: Float32Array;
  delete: () => void;
  isDeleted?: () => boolean;
  rows: number;
}

export interface OpenCvSize {
  height: number;
  width: number;
}

export interface OpenCvScalar {
  [index: number]: number;
}

export interface OpenCvRuntime {
  COLOR_GRAY2RGBA: number;
  COLOR_RGBA2GRAY: number;
  COLOR_RGBA2RGB: number;
  Canny: (
    src: OpenCvMat,
    dst: OpenCvMat,
    threshold1: number,
    threshold2: number,
  ) => void;
  GaussianBlur: (
    src: OpenCvMat,
    dst: OpenCvMat,
    ksize: OpenCvSize,
    sigmaX: number,
  ) => void;
  Mat: {
    new (): OpenCvMat;
    new (rows: number, cols: number, type: number, scalar?: OpenCvScalar): OpenCvMat;
    zeros: (rows: number, cols: number, type: number) => OpenCvMat;
  };
  Scalar: new (v0?: number, v1?: number, v2?: number, v3?: number) => OpenCvScalar;
  Size: new (width: number, height: number) => OpenCvSize;
  THRESH_BINARY: number;
  THRESH_OTSU: number;
  cvtColor: (src: OpenCvMat, dst: OpenCvMat, code: number) => void;
  imread: (source: HTMLCanvasElement | HTMLImageElement | string) => OpenCvMat;
  imshow: (canvas: HTMLCanvasElement | string, mat: OpenCvMat) => void;
  matFromImageData?: (imageData: ImageData) => OpenCvMat;
  onRuntimeInitialized?: () => void;
  threshold: (
    src: OpenCvMat,
    dst: OpenCvMat,
    thresh: number,
    maxval: number,
    type: number,
  ) => number;
}

declare global {
  interface Window {
    Module?: {
      onRuntimeInitialized?: () => void;
    };
    cv?: OpenCvRuntime;
  }
}

export const OPENCV_DEFAULT_CDN_URL = "https://docs.opencv.org/4.10.0/opencv.js";

let openCvLoadPromise: Promise<OpenCvRuntime> | null = null;

export function isOpenCvReady(): boolean {
  return typeof window !== "undefined" && typeof window.cv?.Mat === "function";
}

export function getOpenCvRuntime(): OpenCvRuntime {
  if (!isOpenCvReady() || !window.cv) {
    throw new Error(
      "OpenCV is not ready. Call loadOpenCv() before using computer vision preprocessing.",
    );
  }

  return window.cv;
}

/**
 * Dynamically loads OpenCV.js into the browser environment.
 */
export function loadOpenCv(customScriptUrl?: string): Promise<OpenCvRuntime> {
  if (isOpenCvReady() && window.cv) {
    return Promise.resolve(window.cv);
  }

  if (openCvLoadPromise) {
    return openCvLoadPromise;
  }

  openCvLoadPromise = new Promise<OpenCvRuntime>((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      reject(new Error("OpenCV.js can only be loaded in a browser environment."));
      return;
    }

    const scriptUrl =
      customScriptUrl ||
      import.meta.env.VITE_OPENCV_SCRIPT_URL ||
      OPENCV_DEFAULT_CDN_URL;

    // Check if script element is already added
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${scriptUrl}"]`,
    );

    const onReady = () => {
      if (window.cv && typeof window.cv.Mat === "function") {
        resolve(window.cv);
      } else {
        // Poll briefly if onRuntimeInitialized fired right before cv exposed
        const interval = setInterval(() => {
          if (window.cv && typeof window.cv.Mat === "function") {
            clearInterval(interval);
            resolve(window.cv);
          }
        }, 50);

        setTimeout(() => {
          clearInterval(interval);
          if (window.cv && typeof window.cv.Mat === "function") {
            resolve(window.cv);
          } else {
            reject(new Error("OpenCV runtime initialization timed out."));
          }
        }, 5000);
      }
    };

    // Configure Emscripten Module initialization hook
    window.Module = {
      ...window.Module,
      onRuntimeInitialized: () => {
        onReady();
      },
    };

    if (existingScript) {
      if (isOpenCvReady() && window.cv) {
        resolve(window.cv);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.type = "text/javascript";

    script.onerror = () => {
      openCvLoadPromise = null;
      reject(
        new Error(
          `Failed to load OpenCV.js script from "${scriptUrl}". Please check your internet connection or configure VITE_OPENCV_SCRIPT_URL.`,
        ),
      );
    };

    document.body.appendChild(script);
  });

  return openCvLoadPromise;
}
