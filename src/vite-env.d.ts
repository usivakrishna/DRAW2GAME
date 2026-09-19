/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_OPENCV_SCRIPT_URL?: string;
  readonly VITE_YOLO_MODEL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
