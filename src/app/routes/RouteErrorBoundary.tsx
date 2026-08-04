import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function RouteErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText || "The requested page could not be loaded."
    : error instanceof Error
      ? error.message
      : "An unexpected error occurred while loading this page.";

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-brand-600 text-sm font-semibold tracking-[0.16em] uppercase">
          Something went wrong
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          DRAW2GAME could not open this view.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <Button asChild className="mt-6">
          <Link to="/">Return home</Link>
        </Button>
      </section>
    </main>
  );
}
