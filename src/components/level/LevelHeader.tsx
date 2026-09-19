import { useEffect, useState } from "react";
import { Cpu, FolderOpen, Paintbrush, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { ProjectStage } from "@/types/project";

interface LevelHeaderProps {
  currentProjectId: string;
  onOpenProjectPicker: () => void;
  onProjectNameChange: (name: string) => void;
  projectName: string;
  stage?: ProjectStage;
}

export function LevelHeader({
  currentProjectId,
  onOpenProjectPicker,
  onProjectNameChange,
  projectName,
  stage = "draft",
}: LevelHeaderProps) {
  const [draftName, setDraftName] = useState(projectName);

  useEffect(() => {
    setDraftName(projectName);
  }, [projectName]);

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-brand-600 text-xs font-semibold tracking-[0.14em] uppercase">
              Level JSON &middot; Phase 5
            </p>
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
            <Link to={`/projects/${currentProjectId}/detect`}>
              <Cpu aria-hidden="true" className="size-4" />
              Object Detection
            </Link>
          </Button>

          <Button asChild size="sm" variant="outline">
            <Link to={`/projects/${currentProjectId}/upload`}>
              <UploadCloud aria-hidden="true" className="size-4" />
              Upload Sketch
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
