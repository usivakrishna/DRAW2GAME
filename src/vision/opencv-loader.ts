export interface OpenCvRuntime {
  Mat: unknown;
  imread: (source: HTMLCanvasElement | HTMLImageElement | string) => unknown;
  matFromImageData: (imageData: ImageData) => unknown;
}

declare global {
  interface Window {
    cv?: OpenCvRuntime;
  }
}

export function getOpenCvRuntime(): OpenCvRuntime {
  const runtime = window.cv;

  if (!runtime) {
    throw new Error(
      "OpenCV has not been loaded. Configure VITE_OPENCV_SCRIPT_URL before starting detection.",
    );
  }

  return runtime;
}
