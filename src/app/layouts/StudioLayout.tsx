import { Outlet, useParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";

export function StudioLayout() {
  const { projectId } = useParams();

  return (
    <div>
      <div className="border-b border-slate-200 bg-slate-50">
        <PageContainer className="flex min-h-12 items-center justify-between gap-4 py-2">
          <p className="text-sm font-medium text-slate-700">Project workspace</p>
          <p className="truncate font-mono text-xs text-slate-500">{projectId ?? "new-project"}</p>
        </PageContainer>
      </div>
      <Outlet />
    </div>
  );
}
