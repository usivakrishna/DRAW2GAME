import { useMemo, useState } from "react";
import { FolderPlus, Gamepad2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { ProjectCreateModal } from "@/components/dashboard/ProjectCreateModal";
import { ProjectDeleteModal } from "@/components/dashboard/ProjectDeleteModal";
import { ProjectEmptyState } from "@/components/dashboard/ProjectEmptyState";
import {
  type ProjectFilterStage,
  ProjectFilters,
  type ProjectSortOption,
} from "@/components/dashboard/ProjectFilters";
import { ProjectRenameModal } from "@/components/dashboard/ProjectRenameModal";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/project-store";
import type { ProjectSummary } from "@/types/project";

export function DashboardPage() {
  const navigate = useNavigate();

  const createProject = useProjectStore((state) => state.createProject);
  const projectDetections = useProjectStore((state) => state.projectDetections);
  const projectLevels = useProjectStore((state) => state.projectLevels);
  const projects = useProjectStore((state) => state.projects);
  const projectUploads = useProjectStore((state) => state.projectUploads);
  const removeProject = useProjectStore((state) => state.removeProject);
  const renameProject = useProjectStore((state) => state.renameProject);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);

  // Search, Filter & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<ProjectFilterStage>("all");
  const [selectedSort, setSelectedSort] = useState<ProjectSortOption>("updated-desc");

  // Modal dialog states
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<ProjectSummary | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectSummary | null>(null);

  // Stage counts for filter chips
  const counts = useMemo(() => {
    return {
      all: projects.length,
      detected: projects.filter(
        (p) =>
          (projectDetections[p.id]?.length ?? 0) > 0 || p.stage === "detected",
      ).length,
      draft: projects.filter((p) => p.stage === "draft").length,
      generated: projects.filter(
        (p) => Boolean(projectLevels[p.id]) || p.stage === "generated",
      ).length,
      uploaded: projects.filter(
        (p) => Boolean(projectUploads[p.id]) || p.stage === "uploaded",
      ).length,
    };
  }, [projectDetections, projectLevels, projects, projectUploads]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Stage filter
    if (selectedStage !== "all") {
      result = result.filter((p) => {
        if (selectedStage === "generated") {
          return Boolean(projectLevels[p.id]) || p.stage === "generated";
        }
        if (selectedStage === "detected") {
          return (
            (projectDetections[p.id]?.length ?? 0) > 0 || p.stage === "detected"
          );
        }
        if (selectedStage === "uploaded") {
          return Boolean(projectUploads[p.id]) || p.stage === "uploaded";
        }
        if (selectedStage === "draft") {
          return p.stage === "draft";
        }
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (selectedSort === "updated-desc") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (selectedSort === "updated-asc") {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      if (selectedSort === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (selectedSort === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

    return result;
  }, [
    projects,
    searchQuery,
    selectedSort,
    selectedStage,
    projectLevels,
    projectDetections,
    projectUploads,
  ]);

  // Recent projects (top 3 newest)
  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  }, [projects]);

  // Handlers
  const handleCreateProject = (name: string, startingTool: "studio" | "upload") => {
    const newProject = createProject(name);
    setActiveProject(newProject.id);
    toast.success(`Project "${newProject.name}" created!`);
    navigate(`/projects/${newProject.id}/${startingTool}`);
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    renameProject(projectId, newName);
    toast.success(`Project renamed to "${newName}"`);
  };

  const handleDeleteProject = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    removeProject(projectId);
    toast.success(`Project "${target?.name ?? "Project"}" deleted`);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStage("all");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 py-8 text-slate-900">
      <PageContainer className="space-y-8">
        {/* Dashboard Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-brand-600">
              <Gamepad2 className="size-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                DRAW2GAME Dashboard
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Your Games
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create, edit, and play your generated 2D platformer games.
            </p>
          </div>

          <Button
            className="gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-sm sm:w-auto"
            onClick={() => setCreateOpen(true)}
            size="lg"
          >
            <FolderPlus className="size-4" />
            <span>New Project</span>
          </Button>
        </div>

        {/* Overview Stats */}
        <DashboardStats
          projectDetections={projectDetections}
          projectLevels={projectLevels}
          projects={projects}
        />

        {/* Recent Projects Section (if 2+ projects exist and not currently searching/filtering) */}
        {recentProjects.length >= 2 && !searchQuery && selectedStage === "all" && (
          <section aria-labelledby="recent-projects-heading" className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2
                className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
                id="recent-projects-heading"
              >
                <Sparkles className="size-3.5 text-brand-600" />
                Recent Projects
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recentProjects.map((project) => (
                <ProjectCard
                  hasDetections={(projectDetections[project.id]?.length ?? 0) > 0}
                  key={`recent-${project.id}`}
                  level={projectLevels[project.id]}
                  onDelete={setProjectToDelete}
                  onRename={setProjectToRename}
                  project={project}
                  upload={projectUploads[project.id]}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Projects Section with Search and Filters */}
        <section aria-labelledby="all-projects-heading" className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2
              className="text-base font-bold text-slate-900"
              id="all-projects-heading"
            >
              All Projects ({projects.length})
            </h2>
          </div>

          {/* Filters & Search Toolbar */}
          {projects.length > 0 && (
            <ProjectFilters
              counts={counts}
              onSearchChange={setSearchQuery}
              onSortChange={setSelectedSort}
              onStageChange={setSelectedStage}
              searchQuery={searchQuery}
              selectedSort={selectedSort}
              selectedStage={selectedStage}
            />
          )}

          {/* Project Cards Grid or Empty State */}
          {filteredAndSortedProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAndSortedProjects.map((project) => (
                <ProjectCard
                  hasDetections={(projectDetections[project.id]?.length ?? 0) > 0}
                  key={project.id}
                  level={projectLevels[project.id]}
                  onDelete={setProjectToDelete}
                  onRename={setProjectToRename}
                  project={project}
                  upload={projectUploads[project.id]}
                />
              ))}
            </div>
          ) : (
            <ProjectEmptyState
              isFiltering={Boolean(searchQuery) || selectedStage !== "all"}
              onCreateProject={() => setCreateOpen(true)}
              onResetFilters={handleResetFilters}
            />
          )}
        </section>

        {/* Modals */}
        <ProjectCreateModal
          isOpen={isCreateOpen}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreateProject}
        />

        <ProjectRenameModal
          isOpen={Boolean(projectToRename)}
          onClose={() => setProjectToRename(null)}
          onRename={handleRenameProject}
          project={projectToRename}
        />

        <ProjectDeleteModal
          isOpen={Boolean(projectToDelete)}
          onClose={() => setProjectToDelete(null)}
          onConfirm={handleDeleteProject}
          project={projectToDelete}
        />
      </PageContainer>
    </div>
  );
}
