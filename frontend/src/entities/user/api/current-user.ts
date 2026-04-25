import { apiGet } from "@shared/api/http-client";

import type { CurrentUserResponse, User } from "../model/types";

export async function fetchCurrentUser(): Promise<User | null> {
  const response = await apiGet<CurrentUserResponse>("/auth/me", {
    allowedStatuses: [401, 404],
  });

  if (!response.ok) {
    return null;
  }

  return response.data.user;
}
