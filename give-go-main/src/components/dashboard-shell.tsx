import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Heart, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/notification-center";
import { useRealtime } from "@/hooks/use-realtime";
import { useAuth, dashboardPathFor, type AppRole } from "@/lib/auth";

export interface DashboardTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Shared dashboard chrome + role guard.
 * Renders children only when the signed-in user holds `allow`.
 */
export function DashboardShell({
  allow,
  title,
  subtitle,
  tabs,
  active,
  onSelect,
  children,
}: {
  allow: AppRole;
  title: string;
  subtitle: string;
  tabs: DashboardTab[];
  active: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
}) {
  const { session, role, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useRealtime(`dash-${allow}`, [
    "donations",
    "donation_events",
    "volunteer_locations",
    "volunteers",
    "profiles",
  ]);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      void navigate({ to: "/auth", replace: true });
    } else if (role && role !== allow) {
      void navigate({ to: dashboardPathFor(role), replace: true });
    }
  }, [loading, session, role, allow, navigate]);

  if (loading || !session || role !== allow) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-8">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar p-4 transition-transform lg:static lg:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link to="/" className="flex items-center gap-2 px-2 py-1">
          <span className="gradient-primary flex size-9 items-center justify-center rounded-xl text-primary-foreground">
            <Heart className="size-4.5" />
          </span>
          <span className="text-lg font-semibold">ShareAt</span>
        </Link>
        <p className="mt-4 px-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {allow} panel
        </p>
        <nav className="mt-2 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onSelect(t.id);
                setNavOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active === t.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="mt-6 border-t border-sidebar-border pt-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      </aside>

      {navOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-foreground/30 lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold">{title}</h1>
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{profile?.full_name || "Member"}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
            <span className="gradient-primary flex size-9 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground">
              {(profile?.full_name || profile?.email || "?").charAt(0).toUpperCase()}
            </span>
          </div>
        </header>
        <main key={pathname} className="mx-auto max-w-6xl p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
