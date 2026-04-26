import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Home,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  WalletCards,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@app/providers/auth-context";
import { currentUserQueryKey } from "@entities/user";
import { logout } from "@features/auth";
import { ThemeModeToggle } from "@features/theme-toggle";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";

type NavigationItem = {
  icon: LucideIcon;
  label: string;
  to: string;
};

const navigationItems: NavigationItem[] = [
  {
    icon: Home,
    label: "Home",
    to: "/",
  },
  {
    icon: CalendarDays,
    label: "Monthly",
    to: "/monthly",
  },
];

function isNavigationItemActive(pathname: string, to: string) {
  if (to === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(to);
}

function UserSummary({
  collapsed = false,
  email,
  name,
}: {
  collapsed?: boolean;
  email?: string;
  name: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-md border border-sidebar-border bg-background/80 p-3",
        collapsed && "justify-center px-2",
      )}
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
        {name.slice(0, 1).toUpperCase()}
      </div>
      <div className={cn("min-w-0", collapsed && "sr-only")}>
        <p className="truncate text-sm font-medium">{name}</p>
        {email ? <p className="truncate text-xs text-muted-foreground">{email}</p> : null}
      </div>
    </div>
  );
}

function NavigationLinks({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();

  return (
    <nav aria-label="App pages" className="grid gap-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = isNavigationItemActive(location.pathname, item.to);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            aria-label={collapsed ? item.label : undefined}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-2",
            )}
            key={item.to}
            onClick={onNavigate}
            to={item.to}
          >
            <Icon aria-hidden={true} className="size-4 shrink-0" />
            <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarActionButton({
  collapsed = false,
  label,
  onClick,
}: {
  collapsed?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      aria-label={collapsed ? label : undefined}
      className={cn("w-full", collapsed ? "px-0" : "justify-start")}
      onClick={onClick}
      type="button"
    >
      <Plus aria-hidden="true" />
      <span className={cn(collapsed && "sr-only")}>{label}</span>
    </Button>
  );
}

export function AuthenticatedLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);
  const userName = user?.name ?? "Signed in";

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.setQueryData(currentUserQueryKey, null);
      void navigate("/login", { replace: true });
    },
  });

  const requestCreateRecord = () => {
    setMobileSidebarOpen(false);
    void navigate("/", {
      state: {
        createRecordRequestId: Date.now(),
      },
    });
  };

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return;
    }

    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    mobileCloseButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus();
      }
    };
  }, [isMobileSidebarOpen]);

  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground lg:grid",
        isSidebarCollapsed
          ? "lg:grid-cols-[5rem_minmax(0,1fr)]"
          : "lg:grid-cols-[17rem_minmax(0,1fr)]",
      )}
    >
      <aside
        aria-label="Authenticated navigation"
        className="hidden min-h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:flex lg:flex-col"
      >
        <div className="flex min-h-16 items-center justify-between gap-2 border-b border-sidebar-border px-3">
          <Link
            className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            to="/"
          >
            <WalletCards aria-hidden="true" className="size-5 shrink-0 text-sidebar-primary" />
            <span className={cn("truncate", isSidebarCollapsed && "sr-only")}>
              Personal Finance
            </span>
          </Link>
          <Button
            aria-expanded={!isSidebarCollapsed}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((value) => !value)}
            size="icon"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            type="button"
            variant="ghost"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <PanelLeftClose aria-hidden="true" />
            )}
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-4 px-3 py-4">
          <UserSummary collapsed={isSidebarCollapsed} email={user?.email} name={userName} />
          <SidebarActionButton
            collapsed={isSidebarCollapsed}
            label="New record"
            onClick={requestCreateRecord}
          />
          <NavigationLinks collapsed={isSidebarCollapsed} />
        </div>

        <div className="grid gap-3 border-t border-sidebar-border px-3 py-4">
          <div className={cn(isSidebarCollapsed && "flex justify-center")}>
            <ThemeModeToggle className={cn(isSidebarCollapsed && "grid w-fit grid-cols-1")} />
          </div>
          <Button
            aria-label={isSidebarCollapsed ? "Logout" : undefined}
            className={cn("w-full", isSidebarCollapsed ? "px-0" : "justify-start")}
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
            type="button"
            variant="ghost"
          >
            <LogOut aria-hidden="true" />
            <span className={cn(isSidebarCollapsed && "sr-only")}>Logout</span>
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b px-4 backdrop-blur lg:hidden">
          <Button
            aria-label="Open navigation menu"
            onClick={() => setMobileSidebarOpen(true)}
            ref={mobileMenuButtonRef}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Menu aria-hidden="true" />
          </Button>
          <Link className="flex min-w-0 items-center gap-2 font-semibold" to="/">
            <WalletCards aria-hidden="true" className="size-5 shrink-0 text-primary" />
            <span className="truncate">Personal Finance</span>
          </Link>
          <ThemeModeToggle />
        </header>

        <Outlet />
      </div>

      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div
            aria-labelledby="mobile-navigation-title"
            aria-modal="true"
            className="absolute inset-y-0 left-0 grid w-[min(20rem,calc(100vw-2rem))] grid-rows-[auto_1fr_auto] gap-4 border-r bg-sidebar p-4 text-sidebar-foreground shadow-xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-sidebar-primary">Signed in</p>
                <h2 className="mt-1 text-xl font-semibold" id="mobile-navigation-title">
                  Navigation menu
                </h2>
              </div>
              <Button
                aria-label="Close navigation menu"
                onClick={() => setMobileSidebarOpen(false)}
                ref={mobileCloseButtonRef}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            <div className="grid content-start gap-4">
              <UserSummary email={user?.email} name={userName} />
              <SidebarActionButton label="New record" onClick={requestCreateRecord} />
              <NavigationLinks onNavigate={() => setMobileSidebarOpen(false)} />
            </div>

            <Button
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
              type="button"
              variant="ghost"
            >
              <LogOut aria-hidden="true" />
              Logout
            </Button>
          </div>
        </div>
      ) : null}

      <Button
        aria-label="New record from mobile shortcut"
        className="fixed bottom-5 right-5 z-30 h-12 rounded-full px-5 shadow-lg lg:hidden"
        onClick={requestCreateRecord}
        type="button"
      >
        <Plus aria-hidden="true" />
        New
      </Button>
    </div>
  );
}
