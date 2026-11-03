import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { compileRegion } from "../src/compile.ts";

const fx = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const realDataDir = fileURLToPath(new URL("../../../data", import.meta.url));

test("normal mode drops unchecked rows", () => expect(compileRegion(fx("valid"), "hip", "normal").actions.every(a => !a.draft)).toBe(true));
test("normal mode keeps the checked row", () => expect(compileRegion(fx("valid"), "hip", "normal").actions.map(a => a.id)).toEqual(["gluteus-maximus-hip-extension"]));
test("normal mode counts pending rows per structure", () => expect(compileRegion(fx("valid"), "hip", "normal").pendingByStructure["piriformis"]).toBe(1));
test("normal mode drops review notes", () => expect(JSON.stringify(compileRegion(fx("valid"), "hip", "normal"))).not.toContain("review_note"));
test("normal mode drops unchecked attachments", () => expect(compileRegion(fx("valid"), "hip", "normal").attachments.every(a => !a.draft)).toBe(true));
test("review mode keeps drafts", () => expect(compileRegion(fx("valid"), "hip", "review").actions.some(a => a.draft)).toBe(true));
test("review mode keeps the review note", () => expect(compileRegion(fx("valid"), "hip", "review").actions.find(a => a.draft)?.review_note).toBeTruthy());
test("only used citations are included", () => expect(compileRegion(fx("valid"), "hip", "normal").citations.map(c => c.id)).toEqual(["used-source"]));
test("the real data compiles with no drafts in normal mode", () => expect(compileRegion(realDataDir, "hip", "normal").actions.some(a => a.draft)).toBe(false));
test("a dropped row's own citation is not in normal mode", () => expect(compileRegion(fx("valid"), "hip", "normal").citations.map(c => c.id)).not.toContain("draft-only-source"));
test("review mode includes the draft row's citation", () => expect(compileRegion(fx("valid"), "hip", "review").citations.map(c => c.id)).toContain("draft-only-source"));
test("normal mode keeps exactly the checked attachments", () => expect(compileRegion(fx("valid"), "hip", "normal").attachments.map(a => a.id)).toEqual(["gluteus-maximus-insertion-femur"]));
