import { LogIn, UserPlus, WalletCards } from "lucide-react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { AuthenticatedLayout } from "@app/authenticated-layout";
import { useAuth } from "@app/providers/auth-context";
import { ThemeModeToggle } from "@features/theme-toggle";
import { CategoriesAndTagsPage } from "@pages/categories-and-tags";
import { HomePage } from "@pages/home";
import { LoginPage } from "@pages/login";
import { MonthlyPage } from "@pages/monthly";
import { NotFoundPage } from "@pages/not-found";
import { SignUpPage } from "@pages/sign-up";
import { Button } from "@shared/ui/button";

function PublicNavigation() {
  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap">
        <Link className="flex items-center gap-2 font-semibold" to="/">
          <WalletCards aria-hidden="true" className="size-5 text-primary" />
          <span>Personal Finance</span>
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center justify-end gap-2">
          <ThemeModeToggle />
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

function PublicLayout() {
  return (
    <>
      <PublicNavigation />
      <Outlet />
    </>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route element={<AuthenticatedLayout />}>
          <Route element={<HomePage />} path="/" />
          <Route element={<MonthlyPage />} path="/monthly" />
          <Route element={<CategoriesAndTagsPage />} path="/categories-and-tags" />
        </Route>
      </Route>
      <Route element={<PublicLayout />}>
        <Route element={<PublicOnlyRoute />}>
          <Route element={<LoginPage />} path="/login" />
          <Route element={<SignUpPage />} path="/sign-up" />
          <Route element={<Navigate replace to="/sign-up" />} path="/signup" />
        </Route>
        <Route element={<NotFoundPage />} path="*" />
      </Route>
    </Routes>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
