import { useState } from "react";
import { Check, Copy, Download, FileCode, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { LevelDefinition } from "@/json/level-schema";
import { downloadTextFile } from "@/utils/download";

interface LevelJsonViewerProps {
  level: LevelDefinition;
  onLoadDemoLevel?: () => void;
  onRegenerate: () => void;
  onResetToTemplate: () => void;
  projectName: string;
}

export function LevelJsonViewer({
  level,
  onLoadDemoLevel,
  onRegenerate,
  onResetToTemplate,
  projectName,
}: LevelJsonViewerProps) {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(level, null, 2);
  const lineCount = jsonString.split("\n").length;
  const byteSize = new Blob([jsonString]).size;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast.success("Level JSON copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy JSON to clipboard");
    }
  };

  const handleExport = () => {
    const filename = `${projectName.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}.level.json`;
    downloadTextFile(filename, jsonString, "application/json");
    toast.success(`Exported ${filename}`);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-950 text-slate-100 shadow-sm overflow-hidden">
      {/* Viewer Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileCode className="size-4 text-brand-400" />
          <span className="text-xs font-semibold text-slate-200">
            Canonical Level JSON
          </span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            {lineCount} lines &middot; {(byteSize / 1024).toFixed(1)} KB
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="h-8 gap-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={onRegenerate}
            size="sm"
            variant="ghost"
          >
            <RefreshCw className="size-3.5" />
            Regenerate
          </Button>

          <Button
            className="h-8 gap-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={onResetToTemplate}
            size="sm"
            variant="ghost"
          >
            Reset Template
          </Button>

          {onLoadDemoLevel && (
            <Button
              className="h-8 gap-1.5 text-xs text-amber-300 hover:text-amber-200 hover:bg-slate-800 font-medium"
              onClick={onLoadDemoLevel}
              size="sm"
              variant="ghost"
            >
              <Sparkles className="size-3.5 text-amber-400" />
              Demo Level
            </Button>
          )}

          <Button
            className="h-8 gap-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={handleCopy}
            size="sm"
            variant="ghost"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>

          <Button
            className="h-8 gap-1.5 bg-brand-600 text-xs text-white hover:bg-brand-500"
            onClick={handleExport}
            size="sm"
          >
            <Download className="size-3.5" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Code Block Container */}
      <div className="relative flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
        <pre className="text-slate-300">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
}
