import {
  Calendar,
  Compass,
  Edit2,
  FileCode2,
  Gamepad2,
  Layers,
  MoreVertical,
  Pencil,
  Play,
  ScanSearch,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { LevelDefinition } from "@/json/level-schema";
import type { ProjectSummary } from "@/types/project";
import type { UploadedImageMetadata } from "@/types/upload";

interface ProjectCardProps {
  hasDetections: boolean;
  level?: LevelDefinition | undefined;
  onDelete: (project: ProjectSummary) => void;
  onRename: (project: ProjectSummary) => void;
  project: ProjectSummary;
  upload?: UploadedImageMetadata | undefined;
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "Recently";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "Recently";
  }
}

export function ProjectCard({
  hasDetections,
  level,
  onDelete,
  onRename,
  project,
  upload,
}: ProjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isPlayable = Boolean(level) || project.stage === "generated";

  const getStageBadge = () => {
    if (isPlayable) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <Gamepad2 className="size-3" />
          Ready to Play
        </span>
      );
    }
    if (hasDetections || project.stage === "detected") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
          <ScanSearch className="size-3" />
          Detected
        </span>
      );
    }
    if (upload || project.stage === "uploaded") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
          <UploadCloud className="size-3" />
          Uploaded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
        <Pencil className="size-3" />
        Draft
      </span>
    );
  };

  return (
    <article
      aria-label={`Project: ${project.name}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md"
    >
      {/* Top row: Name, Stage badge & Context Menu */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className="text-base font-bold text-slate-900 truncate"
                title={project.name}
              >
                {project.name}
              </h3>
              {getStageBadge()}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar className="size-3" />
              <span>Updated {formatDate(project.updatedAt)}</span>
            </div>
          </div>

          {/* Options / Action Menu */}
          <div className="relative shrink-0">
            <Button
              aria-label="Project options"
              className="size-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              size="icon"
              variant="ghost"
            >
              <MoreVertical className="size-4" />
            </Button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-9 z-30 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95">
                  <button
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRename(project);
                    }}
                    type="button"
                  >
                    <Edit2 className="size-3.5 text-slate-500" />
                    Rename
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDelete(project);
                    }}
                    type="button"
                  >
                    <Trash2 className="size-3.5 text-rose-500" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Level Stats or Stage Status Preview */}
        <div className="my-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-600">
          {level ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Level Metrics
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 capitalize">
                  <Compass className="size-2.5" />
                  {level.gameMode}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-white p-1.5 border border-slate-100 shadow-2xs">
                  <span className="font-mono text-sm font-bold text-slate-800">
                    {level.platforms.length}
                  </span>
                  <span className="block text-[10px] text-slate-400">Platforms</span>
                </div>
                <div className="rounded-lg bg-white p-1.5 border border-slate-100 shadow-2xs">
                  <span className="font-mono text-sm font-bold text-amber-600">
                    {level.coins.length}
                  </span>
                  <span className="block text-[10px] text-slate-400">Coins</span>
                </div>
                <div className="rounded-lg bg-white p-1.5 border border-slate-100 shadow-2xs">
                  <span className="font-mono text-sm font-bold text-rose-600">
                    {level.enemies.length}
                  </span>
                  <span className="block text-[10px] text-slate-400">Enemies</span>
                </div>
                <div className="rounded-lg bg-white p-1.5 border border-slate-100 shadow-2xs">
                  <span className="font-mono text-sm font-bold text-slate-600">
                    {level.spikes.length}
                  </span>
                  <span className="block text-[10px] text-slate-400">Spikes</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 py-1 text-slate-500">
              <Layers className="size-4 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">
                  Game not generated yet
                </p>
                <p className="text-[11px] text-slate-400">
                  {upload
                    ? "Sketch uploaded. Run detection to generate game."
                    : "Draw in studio or upload a sketch to begin."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Quick Actions & Primary CTA */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        {/* Quick workflow navigation icons */}
        <div className="flex items-center justify-between gap-1 text-slate-400">
          <div className="flex items-center gap-1">
            <Button
              asChild
              className="size-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              size="icon"
              title="Drawing Studio"
              variant="ghost"
            >
              <Link to={`/projects/${project.id}/studio`}>
                <Pencil className="size-3.5" />
              </Link>
            </Button>
            <Button
              asChild
              className="size-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              size="icon"
              title="Upload Module"
              variant="ghost"
            >
              <Link to={`/projects/${project.id}/upload`}>
                <UploadCloud className="size-3.5" />
              </Link>
            </Button>
            <Button
              asChild
              className="size-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              size="icon"
              title="Detection"
              variant="ghost"
            >
              <Link to={`/projects/${project.id}/detect`}>
                <ScanSearch className="size-3.5" />
              </Link>
            </Button>
            <Button
              asChild
              className="size-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              size="icon"
              title="Level JSON"
              variant="ghost"
            >
              <Link to={`/projects/${project.id}/json`}>
                <FileCode2 className="size-3.5" />
              </Link>
            </Button>
            {isPlayable && (
              <Button
                asChild
                className="size-7 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                size="icon"
                title="AI Game Editor"
                variant="ghost"
              >
                <Link to={`/projects/${project.id}/play`}>
                  <Sparkles className="size-3.5" />
                </Link>
              </Button>
            )}
          </div>

          {/* Primary Action Button */}
          {isPlayable ? (
            <Button
              asChild
              className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold shadow-xs"
              size="sm"
            >
              <Link to={`/projects/${project.id}/play`}>
                <Play className="size-3 fill-current" />
                Play Game
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              className="gap-1.5 text-xs font-medium"
              size="sm"
              variant="outline"
            >
              <Link to={`/projects/${project.id}/studio`}>
                <Pencil className="size-3" />
                Open Studio
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
