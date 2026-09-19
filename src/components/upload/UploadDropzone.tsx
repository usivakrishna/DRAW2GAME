import { useCallback, useRef, useState } from "react";
import { AlertCircle, FileUp, Image as ImageIcon, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCEPTED_FILE_EXTENSIONS, MAX_UPLOAD_SIZE_LABEL } from "@/types/upload";

interface UploadDropzoneProps {
  disabled?: boolean;
  errorMessage?: string | null;
  isProcessing?: boolean;
  onClearError?: () => void;
  onFileSelected: (file: File) => void;
}

export function UploadDropzone({
  disabled = false,
  errorMessage,
  isProcessing = false,
  onClearError,
  onFileSelected,
}: UploadDropzoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (disabled || isProcessing) return;
      setIsDraggingOver(true);
    },
    [disabled, isProcessing],
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDraggingOver(false);
    },
    [],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDraggingOver(false);

      if (disabled || isProcessing) return;

      const file = event.dataTransfer.files?.[0];
      if (file) {
        onFileSelected(file);
      }
    },
    [disabled, isProcessing, onFileSelected],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onFileSelected(file);
      }
      // Reset input value so re-uploading the same file works
      event.target.value = "";
    },
    [onFileSelected],
  );

  const handleClickBrowse = useCallback(() => {
    if (disabled || isProcessing) return;
    fileInputRef.current?.click();
  }, [disabled, isProcessing]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {errorMessage && (
        <div
          aria-live="assertive"
          className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 animate-in fade-in duration-200"
          role="alert"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle aria-hidden="true" className="size-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Upload failed</p>
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

      <div
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer select-none ${
          isDraggingOver
            ? "border-brand-500 bg-brand-50/50 scale-[1.01] shadow-lg shadow-brand-500/10"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-sm"
        } ${disabled || isProcessing ? "opacity-60 pointer-events-none" : ""}`}
        onClick={handleClickBrowse}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
      >
        <input
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={disabled || isProcessing}
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />

        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-4 ring-8 ring-brand-50/50">
          {isDraggingOver ? (
            <FileUp aria-hidden="true" className="size-8 animate-bounce" />
          ) : (
            <UploadCloud aria-hidden="true" className="size-8" />
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Upload your sketch
        </h3>
        <p className="mt-1.5 text-sm text-slate-500 max-w-sm">
          Drag and drop your hand-drawn level sketch here, or browse from your computer.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button
            className="gap-2 pointer-events-none"
            disabled={disabled || isProcessing}
            size="sm"
            type="button"
          >
            <ImageIcon aria-hidden="true" className="size-4" />
            Browse Image
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400">
          <span>
            Accepted formats:{" "}
            <strong className="text-slate-600 font-medium uppercase">
              {ACCEPTED_FILE_EXTENSIONS.map((e) => e.replace(".", "")).join(", ")}
            </strong>
          </span>
          <span>•</span>
          <span>
            Maximum file size:{" "}
            <strong className="text-slate-600 font-medium">{MAX_UPLOAD_SIZE_LABEL}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
