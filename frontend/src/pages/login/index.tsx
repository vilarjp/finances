import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogIn } from "lucide-react";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { currentUserQueryKey } from "@entities/user";
import { getAuthRedirectPath, login, loginFormSchema } from "@features/auth";
import type { LoginFormValues } from "@features/auth";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Login failed.";
}

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginFormSchema),
  });
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
      void navigate(getAuthRedirectPath(location.state), { replace: true });
    },
  });
  const submitLogin = form.handleSubmit((values) => loginMutation.mutate(values));
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;
  const loginError = loginMutation.isError ? getErrorMessage(loginMutation.error) : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    void submitLogin(event);
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LogIn aria-hidden="true" className="size-5" />
          </div>
          <h1 className="text-3xl font-semibold tracking-normal">Login</h1>
        </div>

        <form aria-label="Login" className="space-y-5" noValidate onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="login-email">
              Email
            </label>
            <Input
              aria-describedby={emailError ? "login-email-error" : undefined}
              aria-invalid={Boolean(emailError)}
              autoComplete="email"
              id="login-email"
              inputMode="email"
              {...form.register("email")}
            />
            {emailError ? (
              <p className="text-sm text-destructive" id="login-email-error" role="alert">
                {emailError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="login-password">
              Password
            </label>
            <Input
              aria-describedby={passwordError ? "login-password-error" : undefined}
              aria-invalid={Boolean(passwordError)}
              autoComplete="current-password"
              id="login-password"
              type="password"
              {...form.register("password")}
            />
            {passwordError ? (
              <p className="text-sm text-destructive" id="login-password-error" role="alert">
                {passwordError}
              </p>
            ) : null}
          </div>

          {loginError ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {loginError}
            </p>
          ) : null}

          <Button className="w-full" disabled={loginMutation.isPending} type="submit">
            <LogIn aria-hidden="true" />
            Login
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link className="font-medium text-primary hover:underline" to="/sign-up">
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}
