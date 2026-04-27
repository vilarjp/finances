import { defineConfig, devices } from "@playwright/test";

const frontendPort = 4174;
const backendPort = 3100;
const frontendOrigin = `http://127.0.0.1:${frontendPort}`;
const backendApiBaseUrl = `http://127.0.0.1:${backendPort}/api`;

export default defineConfig({
  testDir: "./src/shared/testing/e2e",
  testMatch: /full-stack-smoke\.spec\.ts/u,
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: frontendOrigin,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "corepack pnpm --filter @finances/backend test:e2e:server",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: `http://127.0.0.1:${backendPort}/health`,
    },
    {
      command: `VITE_API_BASE_URL=${backendApiBaseUrl} corepack pnpm build && corepack pnpm preview --host 127.0.0.1 --port ${frontendPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: frontendOrigin,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
