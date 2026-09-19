import { useEffect, useRef, useState } from "react";
import { Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectSummary } from "@/types/project";

interface ProjectRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (projectId: string, newName: string) => void;
  project: ProjectSummary | null;
}

export function ProjectRenameModal({
  isOpen,
  onClose,
  onRename,
  project,
}: ProjectRenameModalProps) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && project) {
      setName(project.name);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, project]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const finalName = name.trim();
    if (!finalName) return;
    onRename(project.id, finalName);
    onClose();
  };

  return (
    <div
      aria-labelledby="rename-project-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-slate-100 border border-slate-200 text-slate-700">
              <Edit2 className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900" id="rename-project-title">
                Rename Project
              </h2>
              <p className="text-xs text-slate-500">
                Change the display name of this workspace
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

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5" htmlFor="rename-project-input">
              Project Name
            </label>
            <input
              autoComplete="off"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              id="rename-project-input"
              onChange={(e) => setName(e.target.value)}
              ref={inputRef}
              type="text"
              value={name}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button onClick={onClose} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold"
              disabled={!name.trim()}
              type="submit"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
