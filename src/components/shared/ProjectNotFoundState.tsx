import { AlertCircle, ArrowLeft, FolderPlus, LayoutDashboard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/project-store";

interface ProjectNotFoundStateProps {
  projectId?: string;
}

export function ProjectNotFoundState({ projectId }: ProjectNotFoundStateProps) {
  const navigate = useNavigate();
  const createProject = useProjectStore((state) => state.createProject);

  const handleCreateProject = () => {
    const newProject = createProject("Untitled level");
    navigate(`/projects/${newProject.id}/studio`);
  };

  return (
    <div className="grid min-h-[calc(100svh-4rem)] place-items-center bg-slate-50 p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <AlertCircle aria-hidden="true" className="size-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Project Not Found</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {projectId
            ? `The requested project ("${projectId}") could not be found or has been removed from local storage.`
            : "This project is no longer available in local storage."}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Button asChild className="w-full gap-2">
            <Link to="/dashboard">
              <LayoutDashboard className="size-4" />
              <span>Back to Dashboard</span>
            </Link>
          </Button>

          <Button className="w-full gap-2" onClick={handleCreateProject} variant="outline">
            <FolderPlus className="size-4" />
            <span>Create New Project</span>
          </Button>

          <Button asChild className="w-full gap-2" variant="ghost">
            <Link to="/">
              <ArrowLeft className="size-4" />
              <span>Return to Home</span>
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
