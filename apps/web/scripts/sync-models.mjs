// Copies the models from the repo's models/ folder into public/models/ so the app can serve them.
// Runs before dev and before build. public/models/ is git-ignored.
import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const from = join(here, "..", "..", "..", "models");
const to = join(here, "..", "public", "models");

rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });

const wanted = readdirSync(from).filter((name) => name.endsWith(".glb") || name === "manifest.json" || name === "LICENSE");
for (const name of wanted) cpSync(join(from, name), join(to, name));
console.log(`Copied ${wanted.length} files from models/ to apps/web/public/models/`);
