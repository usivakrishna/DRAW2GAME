import { useEffect } from "react";
import { FolderOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectSummary } from "@/types/project";

interface ProjectPickerProps {
  currentProjectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (projectId: string) => void;
  projects: ProjectSummary[];
}

export function ProjectPicker({
  currentProjectId,
  isOpen,
  onClose,
  onSelect,
  projects,
}: ProjectPickerProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-labelledby="project-picker-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/25 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
      role="dialog"
    >
      <section
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-brand-50 text-brand-600 grid size-10 place-items-center rounded-xl">
              <FolderOpen aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900" id="project-picker-title">
                Load a project
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Select a locally saved drawing workspace.
              </p>
            </div>
          </div>
          <Button aria-label="Close project picker" onClick={onClose} size="icon" variant="ghost">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="mt-5 max-h-80 space-y-2 overflow-y-auto pr-1">
          {projects.map((project) => {
            const isCurrentProject = project.id === currentProjectId;

            return (
              <button
                className="hover:border-brand-200 hover:bg-brand-50/50 disabled:border-brand-200 disabled:bg-brand-50 flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3 text-left transition disabled:cursor-default"
                disabled={isCurrentProject}
                key={project.id}
                onClick={() => onSelect(project.id)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {project.name}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Last updated {new Date(project.updatedAt).toLocaleString()}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-medium text-slate-500">
                  {isCurrentProject ? "Current" : "Open"}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
