import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { RegionBundle } from "../data/bundle";
import de from "../i18n/de.json";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { makeBundle } from "./fixture";
import { InfoPanel } from "./InfoPanel";

const t = createT(en);
afterEach(cleanup);

// The heading over a joint's rows, for example "What it does at the hip".
const does = (joint: string) => t("info.does", { joint: t(`joint.${joint}`) });

function show(sid: string, side: "l" | "r" | "" = "", mode: "normal" | "review" = "normal", onSwitchSide = () => {}, onOverUnder = () => {}) {
  render(<InfoPanel selection={{ sid, side }} bundle={makeBundle(mode)} t={t} lang="en" onSwitchSide={onSwitchSide} onHide={() => {}} onOpenMovement={() => {}} onOverUnder={onOverUnder} />);
}

test("shows English and Latin names", () => {
  show("piriformis");
  expect(screen.getByText("Piriformis")).toBeTruthy();
  expect(screen.getByText("Latin: Musculus piriformis")).toBeTruthy();
});

test("groups checked rows by movement with load and role words", () => {
  show("piriformis");
  expect(screen.getByText("Hip external rotation")).toBeTruthy();
  expect(screen.getByText(/works/)).toBeTruthy();
  expect(screen.getByText(/main/)).toBeTruthy();
});

test("attachment sentence uses the lower case bone name", () => {
  show("piriformis");
  expect(screen.getByText("Starts at: anterior surface of the sacrum")).toBeTruthy();
});

test("shows the waiting line when rows are pending", () => {
  show("piriformis");
  expect(screen.getByText(en["info.pending"])).toBeTruthy();
});

test("a bone with no rows shows no does-heading and no waiting line", () => {
  show("femur");
  expect(screen.queryByText(does("hip"))).toBeNull();
  expect(screen.queryByText(does("knee"))).toBeNull();
  expect(screen.queryByText(en["info.pending"])).toBeNull();
});

test("shows the type of the structure", () => {
  show("piriformis");
  expect(screen.getByText(t("info.type", { type: en["type.muscle"] }))).toBeTruthy();
});

// A bundle where rectus femoris has a hip row and a knee row, and piriformis only hip rows.
function withKneeRow(): RegionBundle {
  const bundle = makeBundle();
  bundle.movements.push(
    { id: "hip-flexion", english: "Hip flexion", dof: "hip.flexion", direction: "positive" },
    { id: "knee-extension", english: "Knee extension", dof: "knee.flexion", direction: "negative" },
  );
  const row = { load: "working" as const, role: "primary" as const, confidence: "high" as const, citations: [], draft: false };
  bundle.actions.push(
    { id: "rf-hip", structure: "rectus-femoris", movement: "hip-flexion", ...row },
    { id: "rf-knee", structure: "rectus-femoris", movement: "knee-extension", ...row },
  );
  return bundle;
}

test("rows are grouped under the joint they move", () => {
  render(<InfoPanel selection={{ sid: "rectus-femoris", side: "l" }} bundle={withKneeRow()} t={t} lang="en" onSwitchSide={() => {}} onHide={() => {}} onOpenMovement={() => {}} onOverUnder={() => {}} />);
  const hip = screen.getByRole("heading", { name: does("hip") }).parentElement!;
  const knee = screen.getByRole("heading", { name: does("knee") }).parentElement!;
  expect(within(hip).getByText("Hip flexion")).toBeTruthy();
  expect(within(hip).queryByText("Knee extension")).toBeNull();
  expect(within(knee).getByText("Knee extension")).toBeTruthy();
  expect(within(knee).queryByText("Hip flexion")).toBeNull();
});

test("a joint without rows gets no heading", () => {
  render(<InfoPanel selection={{ sid: "piriformis", side: "l" }} bundle={withKneeRow()} t={t} lang="en" onSwitchSide={() => {}} onHide={() => {}} onOpenMovement={() => {}} onOverUnder={() => {}} />);
  expect(screen.getByRole("heading", { name: does("hip") })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: does("knee") })).toBeNull();
});

test("unpaired structure has no side switch", () => {
  show("sacrum");
  expect(screen.queryByText(en["info.switchSide"])).toBeNull();
});

test("paired structure switch calls onSwitchSide", () => {
  const onSwitchSide = vi.fn();
  show("piriformis", "l", "normal", onSwitchSide);
  fireEvent.click(screen.getByText(en["info.switchSide"]));
  expect(onSwitchSide).toHaveBeenCalledTimes(1);
});

test("sources open on tap and mark quote or summary", () => {
  show("piriformis");
  expect(screen.queryByText(en["source.quote"] + ":")).toBeNull();
  fireEvent.click(screen.getAllByText(en["info.sources"])[1]);
  expect(screen.getByText(en["source.quote"] + ":")).toBeTruthy();
});

test("a structure with a gap shows its line from the language file", () => {
  show("rectus-femoris");
  expect(screen.getByText(en["gap.quadriceps-tendon"])).toBeTruthy();
});

test("each gap shows its own line and a structure without one shows none", () => {
  const bundle = makeBundle();
  bundle.structures.push({ id: "psoas-major", type: "muscle", english: "Psoas major", depth: 2, paired: true, gap: "psoas-origin" });
  render(<InfoPanel selection={{ sid: "psoas-major", side: "l" }} bundle={bundle} t={t} lang="en" onSwitchSide={() => {}} onHide={() => {}} onOpenMovement={() => {}} onOverUnder={() => {}} />);
  expect(screen.getByText(en["gap.psoas-origin"])).toBeTruthy();
  expect(screen.queryByText(en["gap.quadriceps-tendon"])).toBeNull();
  cleanup();
  show("piriformis");
  expect(screen.queryByText(en["gap.quadriceps-tendon"])).toBeNull();
  expect(screen.queryByText(en["gap.psoas-origin"])).toBeNull();
});

test("the joint heading is built from the joint name", () => {
  render(<InfoPanel selection={{ sid: "rectus-femoris", side: "l" }} bundle={withKneeRow()} t={t} lang="en" onSwitchSide={() => {}} onHide={() => {}} onOpenMovement={() => {}} onOverUnder={() => {}} />);
  expect(screen.getByRole("heading", { name: "What it does at the hip" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "What it does at the knee" })).toBeTruthy();
});

test("an open source shows its link, which opens in a new tab, and its licence", () => {
  show("piriformis");
  fireEvent.click(screen.getAllByText(en["info.sources"])[1]);
  expect(screen.getByText("Smith (2020). Hip anatomy")).toBeTruthy();
  const link = screen.getByRole("link", { name: en["source.link"] });
  expect(link.getAttribute("href")).toBe("https://example.org");
  expect(link.getAttribute("target")).toBe("_blank");
  expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  expect(screen.getByText(t("source.licence", { license: "CC-BY" }))).toBeTruthy();
  expect(screen.getByText(t("source.where", { locator: "p. 4" }))).toBeTruthy();
});

test("normal bundle never renders a review note", () => {
  show("piriformis", "", "normal");
  expect(screen.queryByText("Check the angle")).toBeNull();
});

test("review bundle renders the review note", () => {
  show("piriformis", "", "review");
  expect(screen.getByText(t("review.note", { note: "Check the angle" }))).toBeTruthy();
});

test("an unknown structure shows its file label and no data sections", () => {
  render(<InfoPanel selection={{ sid: "mystery", side: "" }} bundle={makeBundle()} t={t} lang="en" fallbackLabel="Mystery part" onSwitchSide={() => {}} onHide={() => {}} onOpenMovement={() => {}} onOverUnder={() => {}} />);
  expect(screen.getByText("Mystery part")).toBeTruthy();
  expect(screen.queryByText(en["info.pending"])).toBeNull();
});

test("the punctuation around the action words comes from the text file", () => {
  const custom = createT({ ...en, "info.actionRole": "{load} [{role}]", "info.actionWhen": "{text} / {when}", "source.label": "{kind} >" });
  render(<InfoPanel selection={{ sid: "piriformis", side: "" }} bundle={makeBundle()} t={custom} lang="en" onSwitchSide={() => {}} onHide={() => {}} onOpenMovement={() => {}} onOverUnder={() => {}} />);
  expect(screen.getByText("works [main] / with the hip bent between 0 and 60 degrees")).toBeTruthy();
  fireEvent.click(screen.getAllByText(en["info.sources"])[1]);
  expect(screen.getByText(en["source.quote"] + " >")).toBeTruthy();
});

test("a movement heading opens that movement", () => {
  const onOpenMovement = vi.fn();
  render(<InfoPanel selection={{ sid: "piriformis", side: "l" }} bundle={makeBundle()} t={t} lang="en" onSwitchSide={() => {}} onHide={() => {}} onOpenMovement={onOpenMovement} onOverUnder={() => {}} />);
  const heading = screen.getByRole("heading", { name: "Hip external rotation", level: 4 });
  fireEvent.click(within(heading).getByRole("button", { name: "Hip external rotation" }));
  expect(onOpenMovement).toHaveBeenCalledWith("hip-ext-rot");
});

test("the over and under button reports the request", () => {
  const onOverUnder = vi.fn();
  show("piriformis", "l", "normal", () => {}, onOverUnder);
  fireEvent.click(screen.getByRole("button", { name: en["info.overUnder"] }));
  expect(onOverUnder).toHaveBeenCalledTimes(1);
});

test("in German the names are German, the bone keeps its capital, and a name without German stays English", () => {
  const bundle = makeBundle();
  bundle.structures = bundle.structures.map((s) => (s.id === "sacrum" ? { ...s, german: "Kreuzbein" } : s));
  bundle.movements = bundle.movements.map((m) => ({ ...m, german: "Außenrotation im Hüftgelenk" }));
  const tDe = createT(de, en);
  render(<InfoPanel selection={{ sid: "piriformis", side: "l" }} bundle={bundle} t={tDe} lang="de" onSwitchSide={() => {}} onHide={() => {}} onOpenMovement={() => {}} onOverUnder={() => {}} />);
  // Piriformis has no German name in this bundle, so it shows the English one.
  expect(screen.getByRole("heading", { name: tDe("side.left", { label: "Piriformis" }) })).toBeTruthy();
  expect(screen.getByText(tDe("info.origin", { landmark: "anterior surface", bone: "Kreuzbein" }))).toBeTruthy();
  expect(screen.getByRole("button", { name: "Außenrotation im Hüftgelenk" })).toBeTruthy();
});
