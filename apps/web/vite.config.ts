import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

// three's Draco loader points at its own copy of the decoder by default, and Vite would copy those files into the build.
// We always use the copy in public/draco/, so this plugin blanks the default paths and the build stays free of unused decoders.
function skipThreeDracoDefaults(): Plugin {
  return {
    name: "skip-three-draco-defaults",
    enforce: "pre",
    transform(code, id) {
      if (!id.replaceAll("\\", "/").endsWith("three/examples/jsm/loaders/DRACOLoader.js")) return null;
      return code.replace(/new URL\(\s*'\.\.\/libs\/draco\/[^']+',\s*import\.meta\.url\s*\)\.toString\(\)/g, "''");
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
  },
  test: {
    environment: "jsdom",
  },
});
