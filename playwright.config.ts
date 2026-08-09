import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3005);
// Clerk development instance は 127.0.0.1 だと rewrite 先が壊れやすいので localhost を既定にする
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;
const base = new URL(baseURL);
const listenHost = base.hostname;
const listenPort = base.port || String(port);

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // `pnpm test:e2e` が先に build する。ここでは start のみ（port は dev の 3000 と分離）
    command: `pnpm exec next start --hostname ${listenHost} --port ${listenPort}`,
    url: new URL("/api/health", baseURL).toString(),
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
