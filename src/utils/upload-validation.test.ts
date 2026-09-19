import { describe, expect, it } from "vitest";
import {
  MAX_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_LABEL,
} from "@/types/upload";
import { formatBytes, validateUploadFile } from "@/utils/upload-validation";

describe("upload-validation", () => {
  describe("formatBytes", () => {
    it("formats 0 bytes correctly", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(-10)).toBe("0 B");
    });

    it("formats bytes, KB, and MB correctly", () => {
      expect(formatBytes(512)).toBe("512 B");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1536)).toBe("1.5 KB");
      expect(formatBytes(1024 * 1024)).toBe("1 MB");
      expect(formatBytes(10 * 1024 * 1024)).toBe("10 MB");
    });
  });

  describe("validateUploadFile", () => {
    it("accepts valid PNG image", () => {
      const file = new File(["dummy png content"], "sketch.png", {
        type: "image/png",
      });
      const result = validateUploadFile(file);
      expect(result.valid).toBe(true);
    });

    it("accepts valid JPG and JPEG images", () => {
      const jpgFile = new File(["dummy jpg content"], "sketch.jpg", {
        type: "image/jpeg",
      });
      expect(validateUploadFile(jpgFile).valid).toBe(true);

      const jpegFile = new File(["dummy jpeg content"], "sketch.jpeg", {
        type: "image/jpeg",
      });
      expect(validateUploadFile(jpegFile).valid).toBe(true);
    });

    it("accepts valid WebP image", () => {
      const file = new File(["dummy webp content"], "sketch.webp", {
        type: "image/webp",
      });
      const result = validateUploadFile(file);
      expect(result.valid).toBe(true);
    });

    it("accepts valid uppercase extensions (e.g. .PNG, .JPG)", () => {
      const file = new File(["dummy content"], "SKETCH.PNG", {
        type: "image/png",
      });
      expect(validateUploadFile(file).valid).toBe(true);
    });

    it("rejects unsupported file formats (gif, svg, pdf, txt, mp4)", () => {
      const gif = new File(["dummy"], "sketch.gif", { type: "image/gif" });
      const gifResult = validateUploadFile(gif);
      expect(gifResult.valid).toBe(false);
      if (!gifResult.valid) {
        expect(gifResult.error).toContain("Unsupported file format");
      }

      const svg = new File(["<svg></svg>"], "drawing.svg", {
        type: "image/svg+xml",
      });
      expect(validateUploadFile(svg).valid).toBe(false);

      const pdf = new File(["pdf"], "doc.pdf", { type: "application/pdf" });
      expect(validateUploadFile(pdf).valid).toBe(false);

      const txt = new File(["text"], "notes.txt", { type: "text/plain" });
      expect(validateUploadFile(txt).valid).toBe(false);
    });

    it("rejects oversized file exceeding MAX_UPLOAD_SIZE_BYTES", () => {
      // Create a dummy file with size greater than 10 MB
      const oversizedFile = new File(["mock"], "large-sketch.png", {
        type: "image/png",
      });
      Object.defineProperty(oversizedFile, "size", {
        value: MAX_UPLOAD_SIZE_BYTES + 1024,
      });

      const result = validateUploadFile(oversizedFile);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("File is too large");
        expect(result.error).toContain(MAX_UPLOAD_SIZE_LABEL);
      }
    });

    it("rejects 0-byte empty file", () => {
      const emptyFile = new File([], "empty.png", { type: "image/png" });
      const result = validateUploadFile(emptyFile);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("empty");
      }
    });
  });
});
