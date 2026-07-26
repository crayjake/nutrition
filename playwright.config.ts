import { defineConfig, devices } from "@playwright/test";

const testBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "mobile-webkit",
      use: {
        ...devices["iPhone 13 Mini"],
        viewport: { width: 375, height: 812 }
      }
    }
  ],
  webServer: {
    command: "npm run dev",
    url: `http://localhost:3000${testBasePath}/`,
    reuseExistingServer: !process.env.CI
  }
});
