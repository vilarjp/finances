import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { currentUserQueryKey } from "@entities/user";
import { signUp, signUpFormSchema } from "@features/auth";
import type { SignUpFormValues } from "@features/auth";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Account creation failed.";
}

export function SignUpPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<SignUpFormValues>({
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
    resolver: zodResolver(signUpFormSchema),
  });
  const signUpMutation = useMutation({
    mutationFn: signUp,
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user);
      void navigate("/", { replace: true });
    },
  });
  const submitSignUp = form.handleSubmit((values) => signUpMutation.mutate(values));
  const nameError = form.formState.errors.name?.message;
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;
  const signUpError = signUpMutation.isError ? getErrorMessage(signUpMutation.error) : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    void submitSignUp(event);
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <UserPlus aria-hidden="true" className="size-5" />
          </div>
          <h1 className="text-3xl font-semibold tracking-normal">Sign up</h1>
        </div>

        <form aria-label="Sign up" className="space-y-5" noValidate onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="sign-up-name">
              Name
            </label>
            <Input
              aria-describedby={nameError ? "sign-up-name-error" : undefined}
              aria-invalid={Boolean(nameError)}
              autoComplete="name"
              id="sign-up-name"
              {...form.register("name")}
            />
            {nameError ? (
              <p className="text-sm text-destructive" id="sign-up-name-error" role="alert">
                {nameError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="sign-up-email">
              Email
            </label>
            <Input
              aria-describedby={emailError ? "sign-up-email-error" : undefined}
              aria-invalid={Boolean(emailError)}
              autoComplete="email"
              id="sign-up-email"
              inputMode="email"
              {...form.register("email")}
            />
            {emailError ? (
              <p className="text-sm text-destructive" id="sign-up-email-error" role="alert">
                {emailError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="sign-up-password">
              Password
            </label>
            <Input
              aria-describedby={passwordError ? "sign-up-password-error" : undefined}
              aria-invalid={Boolean(passwordError)}
              autoComplete="new-password"
              id="sign-up-password"
              type="password"
              {...form.register("password")}
            />
            {passwordError ? (
              <p className="text-sm text-destructive" id="sign-up-password-error" role="alert">
                {passwordError}
              </p>
            ) : null}
          </div>

          {signUpError ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {signUpError}
            </p>
          ) : null}

          <Button className="w-full" disabled={signUpMutation.isPending} type="submit">
            <UserPlus aria-hidden="true" />
            Create account
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link className="font-medium text-primary hover:underline" to="/login">
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}
