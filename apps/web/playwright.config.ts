import { defineConfig } from "@playwright/test";

// Runs the end-to-end test against the built app, served by "vite preview".
// Run "npm run build" first, because the preview serves what is in dist/.
export default defineConfig({
  testDir: "e2e",
  // The 3D scene takes a while to load on a slow machine.
  timeout: 60_000,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4175",
    viewport: { width: 412, height: 915 },
  },
  webServer: {
    command: "npx vite preview --port 4175 --strictPort",
    url: "http://localhost:4175/",
    reuseExistingServer: false,
  },
});
