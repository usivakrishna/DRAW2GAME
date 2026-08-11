import { useEffect, useState } from "react";
import { Download, FileJson, FolderOpen, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudioHeaderProps {
  canAct: boolean;
  onClear: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
  onLoad: () => void;
  onProjectNameChange: (name: string) => void;
  onSave: () => void;
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
          <p className="text-brand-600 text-xs font-semibold tracking-[0.14em] uppercase">
            Drawing Studio
          </p>
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
