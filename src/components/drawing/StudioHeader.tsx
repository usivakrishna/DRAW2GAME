import { useEffect, useState } from "react";
import { Download, FileJson, FolderOpen, LayoutDashboard, Save, Trash2, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface StudioHeaderProps {
  canAct: boolean;
  onClear: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
  onLoad: () => void;
  onProjectNameChange: (name: string) => void;
  onSave: () => void;
  onUpload?: () => void;
  projectName: string;
}

export function StudioHeader({
  canAct,
  onClear,
  onExportJson,
  onExportPng,
  onLoad,
  onProjectNameChange,
  onSave,
  onUpload,
  projectName,
}: StudioHeaderProps) {
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
              Drawing Studio
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
          {onUpload && (
            <Button onClick={onUpload} size="sm" variant="outline">
              <UploadCloud aria-hidden="true" className="size-4" />
              Upload sketch
            </Button>
          )}
          <Button disabled={!canAct} onClick={onLoad} size="sm" variant="outline">
            <FolderOpen aria-hidden="true" className="size-4" />
            Load
          </Button>
          <Button disabled={!canAct} onClick={onSave} size="sm">
            <Save aria-hidden="true" className="size-4" />
            Save
          </Button>
          <Button disabled={!canAct} onClick={onExportPng} size="sm" variant="outline">
            <Download aria-hidden="true" className="size-4" />
            PNG
          </Button>
          <Button disabled={!canAct} onClick={onExportJson} size="sm" variant="outline">
            <FileJson aria-hidden="true" className="size-4" />
            JSON
          </Button>
          <Button
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            disabled={!canAct}
            onClick={onClear}
            size="sm"
            variant="ghost"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Clear
          </Button>
        </div>
      </div>
    </header>
  );
}
