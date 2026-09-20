import { useEffect, useState } from "react";
import { FolderOpen, LayoutDashboard, Paintbrush, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { ProjectStage } from "@/types/project";

interface DetectionHeaderProps {
  currentProjectId: string;
  onOpenProjectPicker: () => void;
  onProjectNameChange: (name: string) => void;
  projectName: string;
  stage?: ProjectStage;
}

export function DetectionHeader({
  currentProjectId,
  onOpenProjectPicker,
  onProjectNameChange,
  projectName,
  stage = "draft",
}: DetectionHeaderProps) {
  const [draftName, setDraftName] = useState(projectName);

  useEffect(() => {
    setDraftName(projectName);
  }, [projectName]);

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link
              className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors"
              to="/dashboard"
            >
              <LayoutDashboard className="size-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-brand-600 font-semibold tracking-[0.14em] uppercase">
              Object Detection
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 capitalize">
              {stage}
            </span>
          </div>
          <input
            aria-label="Project name"
            className="mt-0.5 w-full max-w-sm border-0 bg-transparent p-0 text-xl font-semibold tracking-tight text-slate-950 outline-none placeholder:text-slate-400 focus:ring-0"
            onBlur={() => onProjectNameChange(draftName)}
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            value={draftName}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button onClick={onOpenProjectPicker} size="sm" variant="outline">
            <FolderOpen aria-hidden="true" className="size-4" />
            Switch Project
          </Button>

          <Button asChild size="sm" variant="outline">
            <Link to={`/projects/${currentProjectId}/upload`}>
              <UploadCloud aria-hidden="true" className="size-4" />
              Upload sketch
            </Link>
          </Button>

          <Button asChild size="sm" variant="outline">
            <Link to={`/projects/${currentProjectId}/studio`}>
              <Paintbrush aria-hidden="true" className="size-4" />
              Drawing Studio
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
