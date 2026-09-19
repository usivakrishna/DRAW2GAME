import {
  ACCEPTED_FILE_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_LABEL,
  type ImageDimensions,
  type UploadValidationResult,
} from "@/types/upload";

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) {
    return "0 B";
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.min(i, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, safeIndex)).toFixed(dm))} ${sizes[safeIndex]}`;
}

export function validateUploadFile(file: File): UploadValidationResult {
  if (!file) {
    return {
      error: "No file selected.",
      valid: false,
    };
  }

  // Check MIME type or file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ACCEPTED_FILE_EXTENSIONS.some((ext) =>
    fileName.endsWith(ext),
  );
  const hasValidMime = ACCEPTED_MIME_TYPES.includes(
    file.type as (typeof ACCEPTED_MIME_TYPES)[number],
  );

  if (!hasValidExtension && !hasValidMime) {
    return {
      error: `Unsupported file format "${file.name}". Please upload a PNG, JPG, JPEG, or WebP image.`,
      valid: false,
    };
  }

  // Check file size
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return {
      error: `File is too large (${formatBytes(file.size)}). Maximum allowed size is ${MAX_UPLOAD_SIZE_LABEL}.`,
      valid: false,
    };
  }

  if (file.size === 0) {
    return {
      error: "The selected file is empty.",
      valid: false,
    };
  }

  return { valid: true };
}

export function getImageDimensions(
  source: File | Blob | string,
): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let url: string | null = null;

    if (typeof source === "string") {
      url = source;
    } else {
      url = URL.createObjectURL(source);
    }

    img.onload = () => {
      if (typeof source !== "string" && url) {
        URL.revokeObjectURL(url);
      }
      resolve({
        height: img.naturalHeight,
        width: img.naturalWidth,
      });
    };

    img.onerror = () => {
      if (typeof source !== "string" && url) {
        URL.revokeObjectURL(url);
      }
      reject(new Error("Failed to load image to calculate dimensions."));
    };

    img.src = url;
  });
}
