import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const server = setupServer(
  http.get("*/api/auth/me", () =>
    HttpResponse.json({ message: "Unauthenticated" }, { status: 401 }),
  ),
  http.get("*/api/auth/csrf", () => HttpResponse.json({ csrfToken: "test-csrf-token" })),
  http.post("*/api/auth/logout", () => new HttpResponse(null, { status: 204 })),
  http.get("*/api/categories", () => HttpResponse.json({ categories: [] })),
  http.get("*/api/recurring-tags", () => HttpResponse.json({ recurringTags: [] })),
);
