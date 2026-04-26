import type { User } from "@entities/user";
import { apiPost, clearApiSession, fetchCsrfToken } from "@shared/api/http-client";

import type { LoginFormValues, SignUpFormValues } from "../model/forms";

type AuthResponse = {
  user: User;
};

export async function login(values: LoginFormValues) {
  const response = await apiPost<AuthResponse>("/auth/login", values, {
    skipCsrf: true,
    skipRefresh: true,
  });

  if (!response.ok) {
    throw new Error("Login did not return a user.");
  }

  await fetchCsrfToken();

  return response.data.user;
}

export async function signUp(values: SignUpFormValues) {
  const response = await apiPost<AuthResponse>("/auth/signup", values, {
    skipCsrf: true,
    skipRefresh: true,
  });

  if (!response.ok) {
    throw new Error("Sign-up did not return a user.");
  }

  await fetchCsrfToken();

  return response.data.user;
}

export async function logout() {
  try {
    await apiPost<void>("/auth/logout", undefined, {
      expectJson: false,
    });
  } finally {
    clearApiSession();
  }
}
