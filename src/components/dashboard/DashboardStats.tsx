import { FolderKanban, Gamepad2, Layers, Sparkles } from "lucide-react";
import type { LevelDefinition } from "@/json/level-schema";
import type { DetectionPrediction } from "@/types/detection";
import type { ProjectSummary } from "@/types/project";

interface DashboardStatsProps {
  projectDetections: Record<string, DetectionPrediction[]>;
  projectLevels: Record<string, LevelDefinition>;
  projects: ProjectSummary[];
}

export function DashboardStats({
  projectDetections,
  projectLevels,
  projects,
}: DashboardStatsProps) {
  const totalProjects = projects.length;
  const playableGames = projects.filter(
    (p) => Boolean(projectLevels[p.id]) || p.stage === "generated",
  ).length;
  const detectedProjects = projects.filter(
    (p) =>
      (projectDetections[p.id]?.length ?? 0) > 0 || p.stage === "detected",
  ).length;
  const draftsInProgress = projects.filter(
    (p) => p.stage === "draft" || p.stage === "uploaded",
  ).length;

  const stats = [
    {
      description: "Total created workspaces",
      icon: FolderKanban,
      iconBg: "bg-blue-500/10 text-blue-600 border-blue-200",
      label: "Total Projects",
      value: totalProjects,
    },
    {
      description: "Playable Phaser levels",
      icon: Gamepad2,
      iconBg: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      label: "Ready to Play",
      value: playableGames,
    },
    {
      description: "YOLO detection complete",
      icon: Layers,
      iconBg: "bg-purple-500/10 text-purple-600 border-purple-200",
      label: "Detected",
      value: detectedProjects,
    },
    {
      description: "Sketches & uploads in progress",
      icon: Sparkles,
      iconBg: "bg-amber-500/10 text-amber-600 border-amber-200",
      label: "In Progress",
      value: draftsInProgress,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <div
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition hover:border-slate-300"
            key={item.label}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500">{item.label}</span>
              <div
                className={`grid size-8 place-items-center rounded-xl border ${item.iconBg}`}
              >
                <Icon className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-mono text-2xl font-bold tracking-tight text-slate-900">
                {item.value}
              </span>
              <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
