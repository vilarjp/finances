import { http, HttpResponse } from "msw";

import { server } from "@shared/testing/test-server";

import { apiGet, apiPost, clearApiSession } from "./http-client";

afterEach(() => {
  clearApiSession({ broadcast: false });
});

it("coordinates concurrent refresh attempts and retries unauthorized requests once", async () => {
  let protectedRequests = 0;
  let refreshRequests = 0;

  server.use(
    http.get("*/api/protected", () => {
      protectedRequests += 1;

      if (protectedRequests <= 2) {
        return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      return HttpResponse.json({ ok: true });
    }),
    http.post("*/api/auth/refresh", () => {
      refreshRequests += 1;

      return HttpResponse.json({
        user: {
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
        },
      });
    }),
    http.get("*/api/auth/csrf", () => HttpResponse.json({ csrfToken: "fresh-csrf-token" })),
  );

  const [firstResponse, secondResponse] = await Promise.all([
    apiGet<{ ok: boolean }>("/protected"),
    apiGet<{ ok: boolean }>("/protected"),
  ]);

  expect(firstResponse).toEqual({ data: { ok: true }, ok: true });
  expect(secondResponse).toEqual({ data: { ok: true }, ok: true });
  expect(refreshRequests).toBe(1);
});

it("sends the CSRF token on authenticated mutating requests", async () => {
  let csrfHeader: string | null = null;

  server.use(
    http.get("*/api/auth/csrf", () => HttpResponse.json({ csrfToken: "fresh-csrf-token" })),
    http.post("*/api/protected", ({ request }) => {
      csrfHeader = request.headers.get("x-csrf-token");

      return HttpResponse.json({ ok: true });
    }),
  );

  const response = await apiPost<{ ok: boolean }>("/protected", { value: "saved" });

  expect(response).toEqual({ data: { ok: true }, ok: true });
  expect(csrfHeader).toBe("fresh-csrf-token");
});

it("refreshes before fetching CSRF for a mutating request when the access session expired", async () => {
  let csrfRequests = 0;
  let refreshRequests = 0;
  let csrfHeader: string | null = null;

  server.use(
    http.get("*/api/auth/csrf", () => {
      csrfRequests += 1;

      if (csrfRequests === 1) {
        return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      return HttpResponse.json({ csrfToken: "csrf-after-refresh" });
    }),
    http.post("*/api/auth/refresh", () => {
      refreshRequests += 1;

      return HttpResponse.json({
        user: {
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
        },
      });
    }),
    http.post("*/api/protected", ({ request }) => {
      csrfHeader = request.headers.get("x-csrf-token");

      return HttpResponse.json({ ok: true });
    }),
  );

  const response = await apiPost<{ ok: boolean }>("/protected", { value: "saved" });

  expect(response).toEqual({ data: { ok: true }, ok: true });
  expect(refreshRequests).toBe(1);
  expect(csrfRequests).toBe(2);
  expect(csrfHeader).toBe("csrf-after-refresh");
});
