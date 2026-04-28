import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  FolderKanban,
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
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@app/providers/auth-context";
import { setCurrentUserQueryData } from "@entities/user";
import { logout } from "@features/auth";
import { RecordClipboardProvider, RecordCreateController } from "@features/records";
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
  {
    icon: FolderKanban,
    label: "Categories & tags",
    to: "/categories-and-tags",
  },
];

function isNavigationItemActive(pathname: string, to: string) {
  if (to === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(to);
}

function getNavigationLinkClassName({
  collapsed,
  isActive,
}: {
  collapsed: boolean;
  isActive: boolean;
}) {
  if (collapsed) {
    return cn(
      "mx-auto size-10 max-w-10 justify-center gap-0 bg-transparent p-0 shadow-none hover:bg-sidebar-accent/35",
      isActive && "text-sidebar-primary hover:text-sidebar-primary",
    );
  }

  if (isActive) {
    return "border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground shadow-sm";
  }

  return "text-sidebar-foreground hover:border-sidebar-border hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground hover:shadow-sm";
}

function getNavigationIconClassName({
  collapsed,
  isActive,
}: {
  collapsed: boolean;
  isActive: boolean;
}) {
  if (collapsed) {
    return "bg-transparent text-current";
  }

  if (isActive) {
    return "bg-sidebar-primary/15 text-sidebar-primary";
  }

  return "text-sidebar-foreground/80 group-hover:bg-sidebar-primary/10 group-hover:text-sidebar-primary";
}

function SidebarText({
  children,
  className,
  collapsed = false,
}: {
  children: ReactNode;
  className?: string;
  collapsed?: boolean;
}) {
  return (
    <span
      aria-hidden={collapsed ? true : undefined}
      className={cn(
        "min-w-0 max-w-44 overflow-hidden truncate transition-[max-width,opacity,transform] duration-200 ease-out motion-reduce:transition-none",
        collapsed ? "max-w-0 -translate-x-1 opacity-0" : "translate-x-0 opacity-100",
        className,
      )}
    >
      {children}
    </span>
  );
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
        "flex min-w-0 items-center rounded-md transition-[background-color,border-color,padding] duration-200 ease-out motion-reduce:transition-none",
        collapsed
          ? "mx-auto w-10 max-w-10 justify-center border border-transparent bg-transparent p-0"
          : "gap-3 border border-sidebar-border bg-background/80 p-3",
      )}
    >
      <div
        className={cn(
          "grid size-10 max-w-10 shrink-0 place-items-center rounded-md text-sm font-semibold transition-[background-color,color] duration-200 ease-out motion-reduce:transition-none",
          collapsed
            ? "bg-transparent text-sidebar-primary"
            : "bg-sidebar-primary text-sidebar-primary-foreground",
        )}
      >
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
    <nav aria-label="App pages" className="grid gap-1.5">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = isNavigationItemActive(location.pathname, item.to);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            aria-label={collapsed ? item.label : undefined}
            className={cn(
              "group flex min-h-11 items-center gap-3 rounded-md border border-transparent px-2 py-2 text-sm font-medium outline-none transition-[background-color,border-color,color,box-shadow] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-sidebar-ring motion-reduce:transition-none",
              getNavigationLinkClassName({ collapsed, isActive }),
            )}
            key={item.to}
            onClick={onNavigate}
            to={item.to}
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-md transition-[background-color,color] duration-200 ease-out motion-reduce:transition-none",
                getNavigationIconClassName({ collapsed, isActive }),
              )}
            >
              <Icon aria-hidden={true} className="size-4 shrink-0" />
            </span>
            <SidebarText collapsed={collapsed}>{item.label}</SidebarText>
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
      className={cn(
        "group cursor-pointer transition-[background-color,border-color,color,box-shadow] duration-200 ease-out motion-reduce:transition-none",
        collapsed
          ? "mx-auto size-10 max-w-10 gap-0 border-transparent bg-transparent p-0 text-sidebar-primary shadow-none hover:bg-sidebar-accent/35 hover:text-sidebar-primary hover:shadow-none"
          : "w-full justify-start border border-sidebar-primary/25 bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary/90",
      )}
      onClick={onClick}
      type="button"
    >
      <Plus
        aria-hidden="true"
        className="transition-colors duration-200 ease-out motion-reduce:transition-none"
      />
      <SidebarText collapsed={collapsed}>{label}</SidebarText>
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
      setCurrentUserQueryData(queryClient, null);
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
        "min-h-screen bg-background text-foreground lg:h-screen lg:overflow-hidden",
        isSidebarCollapsed ? "lg:[--sidebar-width:5rem]" : "lg:[--sidebar-width:17rem]",
      )}
    >
      <aside
        aria-label="Authenticated navigation"
        className="hidden h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground motion-reduce:transition-none lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-[var(--sidebar-width)] lg:flex-col lg:overflow-hidden lg:transition-[width] lg:duration-300 lg:ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        <div
          className={cn(
            "flex min-h-16 items-center border-b border-sidebar-border transition-[min-height,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            isSidebarCollapsed
              ? "min-h-28 flex-col justify-center gap-3 px-2 py-3"
              : "justify-between gap-2 px-3",
          )}
        >
          <Link
            aria-label={isSidebarCollapsed ? "Personal Finance home" : undefined}
            className={cn(
              "flex min-w-0 items-center rounded-md font-semibold outline-none transition-[background-color,color] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-sidebar-ring motion-reduce:transition-none",
              isSidebarCollapsed
                ? "size-10 max-w-10 justify-center bg-transparent p-0 text-sidebar-primary hover:bg-transparent"
                : "gap-2 px-2 py-1.5 hover:bg-sidebar-accent/60",
            )}
            to="/"
          >
            <WalletCards aria-hidden="true" className="size-5 shrink-0 text-sidebar-primary" />
            <SidebarText collapsed={isSidebarCollapsed}>Personal Finance</SidebarText>
          </Link>
          <Button
            aria-expanded={!isSidebarCollapsed}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="shrink-0 cursor-pointer transition-[background-color,color] duration-200 ease-out motion-reduce:transition-none"
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

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
          <UserSummary collapsed={isSidebarCollapsed} email={user?.email} name={userName} />
          <SidebarActionButton
            collapsed={isSidebarCollapsed}
            label="New record"
            onClick={requestCreateRecord}
          />
          <NavigationLinks collapsed={isSidebarCollapsed} />
        </div>

        <div className="grid shrink-0 gap-3 border-t border-sidebar-border px-3 py-4">
          <div className={cn(isSidebarCollapsed && "flex justify-center")}>
            <ThemeModeToggle className={cn(isSidebarCollapsed && "grid w-fit grid-cols-1")} />
          </div>
          <Button
            aria-label={isSidebarCollapsed ? "Logout" : undefined}
            className={cn(
              "transition-[background-color,color] duration-200 ease-out motion-reduce:transition-none",
              isSidebarCollapsed
                ? "mx-auto size-10 max-w-10 bg-transparent p-0 text-sidebar-foreground hover:bg-sidebar-accent/35"
                : "w-full justify-start",
            )}
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

      <div className="min-w-0 motion-reduce:transition-none lg:ml-[var(--sidebar-width)] lg:h-screen lg:overflow-y-auto lg:transition-[margin-left] lg:duration-300 lg:ease-[cubic-bezier(0.22,1,0.36,1)]">
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

        {user ? (
          <RecordClipboardProvider key={user.id} userId={user.id}>
            <RecordCreateController />
            <Outlet />
          </RecordClipboardProvider>
        ) : null}
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
