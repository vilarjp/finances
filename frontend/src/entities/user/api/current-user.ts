import { apiGet, clearApiSession, fetchCsrfToken } from "@shared/api/http-client";

import type { CurrentUserResponse, User } from "../model/types";

export const currentUserQueryKey = ["auth", "current-user"] as const;

export async function fetchCurrentUser(): Promise<User | null> {
  const response = await apiGet<CurrentUserResponse>("/auth/me", {
    allowedStatuses: [401, 404],
  });

  if (!response.ok) {
    clearApiSession({ broadcast: false });
    return null;
  }

  await fetchCsrfToken();

  return response.data.user;
}
