import { useState } from "react";
import { Gamepad2, Menu, PencilLine, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    label: "Studio",
    to: "/studio",
  },
  {
    label: "Dashboard",
    to: "/dashboard",
  },
] as const;

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <PageContainer className="flex h-16 items-center justify-between gap-4">
        <Link
          aria-label="DRAW2GAME home"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-slate-950"
          to="/"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
            <Gamepad2 aria-hidden="true" className="size-4" />
          </span>
          <span className="font-bold tracking-tight">DRAW2GAME</span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 sm:flex">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )
              }
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link to="/studio">
              <PencilLine aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Start drawing</span>
              <span className="sm:hidden">Studio</span>
            </Link>
          </Button>

          <button
            aria-label="Toggle navigation menu"
            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 sm:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </PageContainer>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
          <nav className="flex flex-col gap-1">
            <NavLink
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-base font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )
              }
              onClick={() => setMobileMenuOpen(false)}
              to="/"
            >
              Home
            </NavLink>
            {navigationItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-base font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  )
                }
                key={item.to}
                onClick={() => setMobileMenuOpen(false)}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

