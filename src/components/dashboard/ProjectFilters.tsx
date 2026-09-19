import { ArrowUpDown, Search, X } from "lucide-react";

export type ProjectFilterStage = "all" | "draft" | "uploaded" | "detected" | "generated";
export type ProjectSortOption = "updated-desc" | "updated-asc" | "name-asc" | "name-desc";

interface ProjectFiltersProps {
  counts: {
    all: number;
    detected: number;
    draft: number;
    generated: number;
    uploaded: number;
  };
  onSearchChange: (search: string) => void;
  onSortChange: (sort: ProjectSortOption) => void;
  onStageChange: (stage: ProjectFilterStage) => void;
  searchQuery: string;
  selectedSort: ProjectSortOption;
  selectedStage: ProjectFilterStage;
}

export function ProjectFilters({
  counts,
  onSearchChange,
  onSortChange,
  onStageChange,
  searchQuery,
  selectedSort,
  selectedStage,
}: ProjectFiltersProps) {
  const filterPills: { id: ProjectFilterStage; label: string; count: number }[] = [
    { count: counts.all, id: "all", label: "All Projects" },
    { count: counts.generated, id: "generated", label: "Ready to Play" },
    { count: counts.detected, id: "detected", label: "Detected" },
    { count: counts.uploaded, id: "uploaded", label: "Uploaded" },
    { count: counts.draft, id: "draft", label: "Drafts" },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Stage filter pills */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        {filterPills.map((pill) => (
          <button
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              selectedStage === pill.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
            }`}
            key={pill.id}
            onClick={() => onStageChange(pill.id)}
            type="button"
          >
            <span>{pill.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                selectedStage === pill.id
                  ? "bg-slate-700 text-slate-200"
                  : "bg-slate-200/70 text-slate-600"
              }`}
            >
              {pill.count}
            </span>
          </button>
        ))}
      </div>

      {/* Right: Search Input & Sort Dropdown */}
      <div className="flex items-center gap-2">
        {/* Search bar */}
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
          <input
            aria-label="Search projects by name"
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects..."
            type="text"
            value={searchQuery}
          />
          {searchQuery && (
            <button
              aria-label="Clear search"
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              onClick={() => onSearchChange("")}
              type="button"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
          <ArrowUpDown className="size-3 text-slate-400 shrink-0" />
          <select
            aria-label="Sort projects"
            className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer pr-1"
            onChange={(e) => onSortChange(e.target.value as ProjectSortOption)}
            value={selectedSort}
          >
            <option value="updated-desc">Recently Updated</option>
            <option value="updated-asc">Oldest First</option>
            <option value="name-asc">Name (A–Z)</option>
            <option value="name-desc">Name (Z–A)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
