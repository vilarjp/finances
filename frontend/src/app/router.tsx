import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Home, LogIn, LogOut, UserPlus } from "lucide-react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "@app/providers/auth-context";
import { currentUserQueryKey } from "@entities/user";
import { logout } from "@features/auth";
import { ThemeModeToggle } from "@features/theme-toggle";
import { HomePage } from "@pages/home";
import { LoginPage } from "@pages/login";
import { MonthlyPage } from "@pages/monthly";
import { NotFoundPage } from "@pages/not-found";
import { SignUpPage } from "@pages/sign-up";
import { Button } from "@shared/ui/button";

function AppNavigation() {
  const { user, isBootstrapping } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userLabel = isBootstrapping ? "Loading" : (user?.name ?? "Signed out");
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.setQueryData(currentUserQueryKey, null);
      void navigate("/login", { replace: true });
    },
  });

  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap">
        <Link className="flex items-center gap-2 font-semibold" to="/">
          <Home aria-hidden="true" className="size-5 text-primary" />
          <span>Personal Finance</span>
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center justify-end gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">{userLabel}</span>
          <ThemeModeToggle />
          {user ? (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link to="/monthly">
                  <CalendarDays aria-hidden="true" />
                  Monthly
                </Link>
              </Button>
              <Button
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
                size="sm"
                type="button"
                variant="ghost"
              >
                <LogOut aria-hidden="true" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link to="/login">
                  <LogIn aria-hidden="true" />
                  Login
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/sign-up">
                  <UserPlus aria-hidden="true" />
                  Sign up
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function RouteLoadingState() {
  return (
    <main
      aria-busy="true"
      className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center px-4 py-10"
    >
      <p className="text-sm text-muted-foreground">Loading</p>
    </main>
  );
}

function RequireAuth() {
  const { isBootstrapping, user } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <RouteLoadingState />;
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}

function PublicOnlyRoute() {
  const { isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return <RouteLoadingState />;
  }

  if (user) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}

export function AppRoutes() {
  return (
    <>
      <AppNavigation />
      <Routes>
        <Route element={<RequireAuth />}>
          <Route element={<HomePage />} path="/" />
          <Route element={<MonthlyPage />} path="/monthly" />
        </Route>
        <Route element={<PublicOnlyRoute />}>
          <Route element={<LoginPage />} path="/login" />
          <Route element={<SignUpPage />} path="/sign-up" />
          <Route element={<Navigate replace to="/sign-up" />} path="/signup" />
        </Route>
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
