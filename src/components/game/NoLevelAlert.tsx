import { AlertCircle, ArrowRight, Compass, LayoutDashboard, Paintbrush, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface NoLevelAlertProps {
  projectId: string;
  projectName: string;
}

export function NoLevelAlert({ projectId, projectName }: NoLevelAlertProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-5">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <AlertCircle className="size-7" />
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {projectName}
          </span>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            No Generated Game Available
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            A Game Definition is required to run this game in the Universal Game Engine.
            Run detection and generation on your sketch to build a playable level.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Button asChild className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
            <Link to={`/projects/${projectId}/detect`}>
              <Compass className="size-4" />
              <span>Go to Detection & Generation</span>
              <ArrowRight className="size-4 ml-auto" />
            </Link>
          </Button>

          <Button asChild className="w-full gap-2" variant="outline">
            <Link to={`/projects/${projectId}/studio`}>
              <Paintbrush className="size-4" />
              <span>Open Drawing Studio</span>
            </Link>
          </Button>

          <Button asChild className="w-full gap-2" variant="outline">
            <Link to="/dashboard">
              <LayoutDashboard className="size-4" />
              <span>Back to Dashboard</span>
            </Link>
          </Button>

          <Button asChild className="w-full gap-2" variant="ghost">
            <Link to={`/projects/${projectId}/upload`}>
              <UploadCloud className="size-4" />
              <span>Upload Sketch</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
