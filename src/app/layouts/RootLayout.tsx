import { Outlet, ScrollRestoration } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";

export function RootLayout() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <AppHeader />
      <main>
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}
