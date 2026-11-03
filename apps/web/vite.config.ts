import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

// three's Draco loader points at its own copy of the decoder by default, and Vite would copy those files into the build.
// We always use the copy in public/draco/, so this plugin blanks the default paths and the build stays free of unused decoders.
// It finds the paths by their text. If a three update changes that text, the build warns instead of quietly doing nothing.
function skipThreeDracoDefaults(): Plugin {
  return {
    name: "skip-three-draco-defaults",
    enforce: "pre",
    transform(code, id) {
      if (!id.replaceAll("\\", "/").endsWith("three/examples/jsm/loaders/DRACOLoader.js")) return null;
      let replaced = 0;
      const result = code.replace(/new URL\(\s*'\.\.\/libs\/draco\/[^']+',\s*import\.meta\.url\s*\)\.toString\(\)/g, () => {
        replaced++;
        return "''";
      });
      if (replaced === 0) {
        this.warn("Found no default Draco decoder paths in three's DRACOLoader.js. three may have changed the file, so check this plugin and the build for copied decoders.");
      }
      return result;
    },
  };
}

// base "./" makes the build work from any folder on any host.
export default defineConfig({
  base: "./",
  plugins: [react(), skipThreeDracoDefaults()],
  build: {
    // Writes the licence texts of every npm library inside the bundle to dist/third-party-licenses.txt.
    // The Credits screen links to it. A .txt name lets every web server show it as plain text.
    license: { fileName: "third-party-licenses.txt" },
    // The 3D chunk (three.js and the scene) is about 1 MB and arrives after the first screen, see src/viewer/Viewer.tsx.
    // The limit sits just above it, so the build still warns if a chunk grows past that.
    chunkSizeWarningLimit: 1100,
  },
  test: {
    environment: "jsdom",
    // The e2e folder belongs to Playwright, not vitest.
    exclude: ["e2e/**", "node_modules/**", "dist/**", "dist-review/**"],
  },
});
