import { defineConfig } from "@playwright/test";

// Runs the end-to-end test against the built app, served by "vite preview".
// Run "npm run build" first. scripts/e2e-prepare.mjs then copies dist/ to dist-e2e/ with the
// test-only data from e2e/data/, and the preview serves that copy.
export default defineConfig({
  testDir: "e2e",
  // The 3D scene takes a while to load on a slow machine.
  timeout: 60_000,
  // A test.only left in by mistake would skip every other test, so CI refuses it.
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4175",
    viewport: { width: 412, height: 915 },
  },
  webServer: {
    command: "node scripts/e2e-prepare.mjs && npx vite preview --outDir dist-e2e --port 4175 --strictPort",
    url: "http://localhost:4175/",
    reuseExistingServer: false,
  },
});
