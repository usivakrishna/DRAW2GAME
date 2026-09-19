export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_UPLOAD_SIZE_LABEL = "10 MB";

export const ACCEPTED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

export const ACCEPTED_FILE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
] as const;

export type AcceptedFileExtension = (typeof ACCEPTED_FILE_EXTENSIONS)[number];

export type UploadProcessingState =
  | "idle"
  | "selected"
  | "preparing"
  | "ready"
  | "error";

export interface ImageDimensions {
  height: number;
  width: number;
}

export interface UploadedImageMetadata {
  dimensions: ImageDimensions;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export type UploadValidationResult =
  | { valid: true }
  | { error: string; valid: false };
