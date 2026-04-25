import { Home, LogIn, UserPlus } from "lucide-react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "@app/providers/auth-context";
import { HomePage } from "@pages/home";
import { LoginPage } from "@pages/login";
import { NotFoundPage } from "@pages/not-found";
import { SignUpPage } from "@pages/sign-up";
import { Button } from "@shared/ui/button";

function PublicNavigation() {
  const { user, isBootstrapping } = useAuth();
  const userLabel = isBootstrapping ? "Loading" : (user?.name ?? "Signed out");

  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link className="flex items-center gap-2 font-semibold" to="/">
          <Home aria-hidden="true" className="size-5 text-primary" />
          <span>Personal Finance</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">{userLabel}</span>
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

export function AppRoutes() {
  return (
    <>
      <PublicNavigation />
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<SignUpPage />} path="/sign-up" />
        <Route element={<Navigate replace to="/sign-up" />} path="/signup" />
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
