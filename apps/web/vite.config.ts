import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// base "./" makes the build work from any folder on any host.
export default defineConfig({
  base: "./",
  plugins: [react()],
  test: {
    environment: "jsdom",
  },
});
