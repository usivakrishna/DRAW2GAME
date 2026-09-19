import { FolderPlus, Gamepad2, Plus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectEmptyStateProps {
  isFiltering: boolean;
  onCreateProject: () => void;
  onResetFilters: () => void;
}

export function ProjectEmptyState({
  isFiltering,
  onCreateProject,
  onResetFilters,
}: ProjectEmptyStateProps) {
  if (isFiltering) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center shadow-2xs">
        <div className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
          <SearchX className="size-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No matching projects</h3>
        <p className="mt-1.5 max-w-sm text-xs text-slate-500 leading-relaxed">
          No projects found matching your search query or selected stage filter. Try adjusting your filters or search terms.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={onResetFilters} size="sm" variant="outline">
            Clear Filters
          </Button>
          <Button className="gap-1.5 bg-brand-600 hover:bg-brand-500 text-white" onClick={onCreateProject} size="sm">
            <Plus className="size-3.5" />
            New Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-xs">
      <div className="grid size-16 place-items-center rounded-3xl bg-brand-50 border border-brand-100 text-brand-600 mb-4 shadow-sm">
        <Gamepad2 className="size-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">No projects yet</h3>
      <p className="mt-1.5 max-w-md text-sm text-slate-500 leading-relaxed">
        Create your first game from a sketch or uploaded image. Draw custom platforms, coins, and enemies, then play your game instantly in the browser.
      </p>
      <div className="mt-6">
        <Button
          className="gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-sm px-5 py-2.5 text-sm"
          onClick={onCreateProject}
          size="lg"
        >
          <FolderPlus className="size-4" />
          Create New Project
        </Button>
      </div>
    </div>
  );
}
