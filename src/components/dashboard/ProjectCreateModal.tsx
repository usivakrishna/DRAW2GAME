import { useEffect, useRef, useState } from "react";
import { FolderPlus, Pencil, Sparkles, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, startingTool: "studio" | "upload") => void;
}

export function ProjectCreateModal({
  isOpen,
  onClose,
  onCreate,
}: ProjectCreateModalProps) {
  const [name, setName] = useState("");
  const [startingTool, setStartingTool] = useState<"studio" | "upload">("studio");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setStartingTool("studio");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const finalName = name.trim() || "Untitled level";
    onCreate(finalName, startingTool);
    onClose();
  };

  return (
    <div
      aria-labelledby="create-project-title"
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
            <div className="grid size-10 place-items-center rounded-2xl bg-brand-50 border border-brand-200 text-brand-600">
              <FolderPlus className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900" id="create-project-title">
                Create New Project
              </h2>
              <p className="text-xs text-slate-500">
                Start a new 2D platformer workspace
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
            <label className="text-xs font-semibold text-slate-700 block mb-1.5" htmlFor="project-name-input">
              Project Name
            </label>
            <input
              autoComplete="off"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              id="project-name-input"
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cyber Runner Level 1"
              ref={inputRef}
              type="text"
              value={name}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Where would you like to start?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                  startingTool === "studio"
                    ? "border-brand-600 bg-brand-50/60 ring-1 ring-brand-500"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                }`}
                onClick={() => setStartingTool("studio")}
                type="button"
              >
                <div className="flex items-center gap-2">
                  <Pencil className="size-4 text-brand-600" />
                  <span className="text-xs font-bold text-slate-900">Drawing Studio</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Draw platforms, coins and player with vector tools
                </p>
              </button>

              <button
                className={`flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                  startingTool === "upload"
                    ? "border-brand-600 bg-brand-50/60 ring-1 ring-brand-500"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-100"
                }`}
                onClick={() => setStartingTool("upload")}
                type="button"
              >
                <div className="flex items-center gap-2">
                  <UploadCloud className="size-4 text-brand-600" />
                  <span className="text-xs font-bold text-slate-900">Upload Sketch</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Upload an existing paper drawing or diagram
                </p>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button onClick={onClose} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              className="gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold"
              type="submit"
            >
              <Sparkles className="size-4" />
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
