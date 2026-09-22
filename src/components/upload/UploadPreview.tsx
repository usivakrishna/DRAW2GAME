import { useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Image as ImageIcon,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { UploadedImageMetadata } from "@/types/upload";
import { formatBytes } from "@/utils/upload-validation";

interface UploadPreviewProps {
  blobUrl: string;
  errorMessage?: string | null;
  isReplacing?: boolean;
  metadata: UploadedImageMetadata;
  onClearError?: () => void;
  onRemove: () => void;
  onReplace: (file: File) => void;
  projectId?: string;
}

export function UploadPreview({
  blobUrl,
  errorMessage,
  isReplacing = false,
  metadata,
  onClearError,
  onRemove,
  onReplace,
  projectId,
}: UploadPreviewProps) {
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onReplace(file);
    }
    event.target.value = "";
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {errorMessage && (
        <div
          aria-live="assertive"
          className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 animate-in fade-in duration-200"
          role="alert"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle aria-hidden="true" className="size-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Replacement failed</p>
              <p className="mt-0.5 text-rose-700">{errorMessage}</p>
            </div>
          </div>
          {onClearError && (
            <button
              aria-label="Dismiss error"
              className="text-xs font-medium text-rose-600 hover:text-rose-800 underline"
              onClick={onClearError}
              type="button"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Main Preview Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Top Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
              <ImageIcon aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 truncate" title={metadata.fileName}>
                {metadata.fileName}
              </h4>
              <p className="text-xs text-slate-500">
                {metadata.dimensions.width} × {metadata.dimensions.height} px • {formatBytes(metadata.fileSize)} • {metadata.mimeType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={isReplacing}
              onChange={handleFileChange}
              ref={replaceInputRef}
              type="file"
            />
            <Button
              className="gap-1.5"
              disabled={isReplacing}
              onClick={() => replaceInputRef.current?.click()}
              size="sm"
              variant="outline"
            >
              <FileUp aria-hidden="true" className="size-4" />
              Replace sketch
            </Button>
            <Button
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              disabled={isReplacing}
              onClick={onRemove}
              size="sm"
              variant="ghost"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Remove
            </Button>
          </div>
        </div>

        {/* Image Display Frame */}
        <div className="relative flex items-center justify-center p-4 sm:p-6 bg-slate-900/5 min-h-[360px] max-h-[580px] overflow-hidden">
          <div className="relative max-h-[520px] max-w-full flex items-center justify-center rounded-xl overflow-hidden shadow-sm border border-slate-200/80 bg-white">
            <img
              alt={`Uploaded sketch: ${metadata.fileName}`}
              className="max-h-[500px] w-auto max-w-full object-contain select-none"
              src={blobUrl}
            />
          </div>
        </div>

        {/* Phase 4 Preparation Status Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-white p-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 aria-hidden="true" className="size-3.5" />
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Sketch ready for game pipeline
              </p>
              <p className="text-xs text-slate-500">
                Stored under project. OpenCV preprocessing, YOLOv8n detection, and Universal Game Engine generation ready.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {projectId ? (
              <Button
                asChild
                className="gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm hover:from-brand-700 hover:to-indigo-700"
                size="sm"
              >
                <Link to={`/projects/${projectId}/detect`}>
                  <Sparkles aria-hidden="true" className="size-4" />
                  Analyze Sketch & Detect
                </Link>
              </Button>
            ) : (
              <Button
                className="gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm"
                size="sm"
              >
                <Sparkles aria-hidden="true" className="size-4" />
                Analyze Sketch & Detect
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
