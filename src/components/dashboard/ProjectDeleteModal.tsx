import { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectSummary } from "@/types/project";

interface ProjectDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (projectId: string) => void;
  project: ProjectSummary | null;
}

export function ProjectDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  project,
}: ProjectDeleteModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  const handleDelete = () => {
    onConfirm(project.id);
    onClose();
  };

  return (
    <div
      aria-labelledby="delete-project-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900" id="delete-project-title">
                Delete Project
              </h2>
              <p className="text-xs text-slate-500">
                Permanent deletion confirmation
              </p>
            </div>
          </div>
          <Button
            aria-label="Close dialog"
            className="size-8 text-slate-400 hover:text-slate-700"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-900">"{project.name}"</span>?
          </p>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3.5 text-xs text-rose-800 leading-relaxed">
            All associated studio sketches, uploaded images, YOLO object detections,
            LevelDefinitions, and saved game states for this project will be permanently
            erased. This action cannot be undone.
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button onClick={onClose} type="button" variant="outline">
            Cancel
          </Button>
          <Button
            className="gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs"
            onClick={handleDelete}
            type="button"
          >
            <Trash2 className="size-4" />
            Delete Permanently
          </Button>
        </div>
      </div>
    </div>
  );
}
