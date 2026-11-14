import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, expect, test, vi } from "vitest";
import de from "../i18n/de.json";
import en from "../i18n/en.json";
import type { Lang } from "../i18n/lang";
import { createT } from "../i18n/t";
import type { RegionBundle } from "../data/bundle";
import { makeMovementBundle } from "../movement/fixture";
import { toBackup } from "./backup";
import { NotebookPanel } from "./NotebookPanel";
import { openNotebook, type NotebookStore } from "./store";
import type { NotebookEntry } from "./types";

const t = createT(en);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// A note the tests change where they need to.
const entry = (over: Partial<NotebookEntry> = {}): NotebookEntry => ({
  id: "e1",
  createdAt: 1,
  date: "2026-11-13",
  pick: { kind: "movement", id: "hip-external-rotation" },
  pose: { "hip.flexion": 30, "hip.rotation": 0 },
  feeling: "painful",
  side: "l",
  note: "",
  ...over,
});

async function storeWith(entries: NotebookEntry[]): Promise<NotebookStore> {
  const store = await openNotebook(new IDBFactory());
  if (entries.length > 0) await store.putMany(entries);
  return store;
}

type Options = { store?: NotebookStore | null; storeError?: boolean; showComparison?: boolean; lang?: Lang; bundle?: RegionBundle };

function show({ store = null, storeError = false, showComparison = true, lang = "en", bundle = makeMovementBundle() }: Options = {}) {
  const onFocusStructure = vi.fn();
  const onPrint = vi.fn();
  render(
    <NotebookPanel
      t={lang === "de" ? createT(de, en) : t}
      lang={lang}
      bundle={bundle}
      store={store}
      storeError={storeError}
      showComparison={showComparison}
      onFocusStructure={onFocusStructure}
      onPrint={onPrint}
    />,
  );
  return { onFocusStructure, onPrint };
}

// Shows the panel over a store with these notes and waits until the list is in.
async function showWith(entries: NotebookEntry[], options: Omit<Options, "store"> = {}) {
  const store = await storeWith(entries);
  const result = show({ ...options, store });
  await screen.findByRole("heading", { name: en["notebook.entries"] });
  return { ...result, store };
}

const fileInput = () => screen.getByLabelText(en["notebook.loadBackup"]) as HTMLInputElement;
const upload = (text: string) => fireEvent.change(fileInput(), { target: { files: [new File([text], "backup.json", { type: "application/json" })] } });
const listItems = () => within(screen.getByRole("heading", { name: en["notebook.entries"] }).nextElementSibling as HTMLElement).getAllByRole("listitem");

test("always shows the disclaimer and the privacy line", () => {
  show();
  expect(screen.getByRole("heading", { name: en["notebook.title"], level: 2 })).toBeTruthy();
  expect(screen.getByText(en["notebook.disclaimer"])).toBeTruthy();
  expect(screen.getByText(en["notebook.private"])).toBeTruthy();
});

test("without storage it shows the unavailable line and no buttons", () => {
  show({ storeError: true });
  expect(screen.getByText(en["notebook.unavailable"])).toBeTruthy();
  expect(screen.getByText(en["notebook.disclaimer"])).toBeTruthy();
  expect(screen.queryAllByRole("button")).toEqual([]);
});

test("a store that cannot list shows the unavailable line", async () => {
  const store: NotebookStore = {
    list: () => Promise.reject(new Error("no")),
    put: () => Promise.resolve(),
    putMany: () => Promise.resolve(),
    remove: () => Promise.resolve(),
  };
  show({ store });
  expect(await screen.findByText(en["notebook.unavailable"])).toBeTruthy();
  expect(screen.queryAllByRole("button")).toEqual([]);
});

test("with no notes it shows the empty line", async () => {
  show({ store: await storeWith([]) });
  expect(await screen.findByText(en["notebook.empty"])).toBeTruthy();
  expect(screen.getByRole("button", { name: en["notebook.loadBackup"] })).toBeTruthy();
  expect(screen.queryByRole("button", { name: en["notebook.print"] })).toBeNull();
  expect(screen.queryByRole("heading", { name: en["notebook.lookInto"] })).toBeNull();
});

test("lists a note with date, movement, feeling, side and angle", async () => {
  await showWith([entry()]);
  expect(screen.getByText(en["notebook.backupHint"])).toBeTruthy();
  expect(screen.getByText("2026-11-13: Hip external rotation, It hurts, Left")).toBeTruthy();
  expect(screen.getByText("Logged with the hip bent at 30 degrees")).toBeTruthy();
});

test("lists the newest note first and an exercise with its phase", async () => {
  await showWith([
    entry({ id: "old", createdAt: 1, feeling: "fine", side: "both" }),
    entry({ id: "new", createdAt: 2, date: "2026-11-14", pick: { kind: "exercise", id: "squat", phase: "lowering" }, pose: { "hip.flexion": 50, "knee.flexion": 55 } }),
  ]);
  expect(listItems().map((li) => li.firstElementChild!.textContent)).toEqual([
    "2026-11-14: Bodyweight squat, Lowering, It hurts, Left",
    "2026-11-13: Hip external rotation, It feels fine, Both",
  ]);
  expect(screen.getByText("Logged with the hip bent at 50 degrees, the knee bent at 55 degrees")).toBeTruthy();
});

test("an exercise logged part way through shows its angles in whole degrees", async () => {
  await showWith([entry({ pick: { kind: "exercise", id: "squat", phase: "lowering" }, pose: { "hip.flexion": 31.604999999999997, "hip.rotation": 0, "knee.flexion": 32.9 } })]);
  expect(screen.getByText("Logged with the hip bent at 32 degrees, the knee bent at 33 degrees")).toBeTruthy();
});

test("a note for a movement the bundle lacks is listed as unknown", async () => {
  await showWith([entry({ pick: { kind: "movement", id: "shoulder-shrug" } })]);
  expect(screen.getByText((text) => text.includes(en["notebook.unknown"]))).toBeTruthy();
  // It is left out of the comparison, so there is nothing painful to compare.
  expect(screen.getByText(en["notebook.needPainful"])).toBeTruthy();
});

test("a note with HTML shows it as text", async () => {
  const note = "<img src=x onerror=alert(1)>";
  await showWith([entry({ note })]);
  expect(screen.getByText(note)).toBeTruthy();
  expect(document.querySelector("img")).toBeNull();
});

test("shows structures to look into for the left side", async () => {
  const { onFocusStructure } = await showWith([entry()]);
  expect(screen.getByRole("heading", { name: en["notebook.lookInto"] })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Left side" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Right side" })).toBeNull();
  const button = screen.getByRole("button", { name: /^Piriformis: loaded in 1 of 1/ });
  expect(button.textContent).toBe("Piriformis: loaded in 1 of 1 movements you marked as hurting, and in none you marked as fine");
  expect(screen.getByText(en["notebook.needFine"])).toBeTruthy();
  fireEvent.click(button);
  expect(onFocusStructure).toHaveBeenCalledWith({ sid: "piriformis", side: "l" });
});

test("the candidates keep the order of the comparison, by name", async () => {
  await showWith([entry()]);
  const names = screen.getAllByRole("button", { name: /: loaded in/ }).map((b) => b.textContent!.split(":")[0]);
  expect(names).toEqual(["Gluteus maximus", "Obturator externus", "Piriformis"]);
});

test("the disclaimer shows again right under the look-into heading", async () => {
  await showWith([entry()]);
  const heading = screen.getByRole("heading", { name: en["notebook.lookInto"] });
  expect(heading.nextElementSibling?.textContent).toBe(en["notebook.disclaimer"]);
});

test("a fine note on the same side rules structures out and names them", async () => {
  await showWith([entry(), entry({ id: "e2", createdAt: 2, feeling: "fine", pick: { kind: "movement", id: "hip-extension" } })]);
  expect(screen.getByText("Also loaded by movements that feel fine: Gluteus maximus")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /^Gluteus maximus: loaded/ })).toBeNull();
  expect(screen.queryByText(en["notebook.needFine"])).toBeNull();
});

test("with only fine notes it asks for a painful one", async () => {
  await showWith([entry({ feeling: "fine" })]);
  expect(screen.getByText(en["notebook.needPainful"])).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Left side" })).toBeNull();
});

test("with no rows for the logged movement it says so", async () => {
  await showWith([entry({ pick: { kind: "movement", id: "knee-extension" } })]);
  expect(screen.getByText(en["notebook.noRows"])).toBeTruthy();
});

test("a movement with rows waiting for review says the list may be incomplete", async () => {
  await showWith([entry({ pick: { kind: "movement", id: "knee-flexion" } })]);
  expect(screen.getByText(en["notebook.incomplete"])).toBeTruthy();
});

test("loading a damaged backup changes nothing and says why", async () => {
  const { store } = await showWith([entry()]);
  const bad = JSON.stringify({ format: "anatome-notebook", version: 1, exportedAt: "2026-11-13T00:00:00.000Z", entries: [{ id: "x" }] });
  upload(bad);
  expect(await screen.findByText(en["notebook.loadError.bad-entry"])).toBeTruthy();
  expect(screen.getByRole("status").textContent).toBe(en["notebook.loadError.bad-entry"]);
  expect(listItems()).toHaveLength(1);
  expect((await store.list()).map((e) => e.id)).toEqual(["e1"]);
});

test("loading a file that is not JSON says so", async () => {
  await showWith([entry()]);
  upload("hello");
  expect(await screen.findByText(en["notebook.loadError.not-json"])).toBeTruthy();
});

test("a file over the size limit is refused without reading it", async () => {
  await showWith([entry()]);
  const file = new File(["{}"], "big.json", { type: "application/json" });
  Object.defineProperty(file, "size", { value: 1_000_001 });
  const text = vi.spyOn(file, "text");
  fireEvent.change(fileInput(), { target: { files: [file] } });
  expect(await screen.findByText(en["notebook.loadError.too-large"])).toBeTruthy();
  expect(text).not.toHaveBeenCalled();
});

test("loading a good backup adds the new notes", async () => {
  const { store } = await showWith([entry()]);
  const backup = toBackup([entry(), entry({ id: "e2", createdAt: 2, feeling: "fine" })], new Date(2026, 10, 13));
  upload(backup);
  expect(await screen.findByText(t("notebook.loaded", { added: "1", skipped: "1" }))).toBeTruthy();
  await waitFor(() => expect(listItems()).toHaveLength(2));
  expect((await store.list()).map((e) => e.id)).toEqual(["e2", "e1"]);
});

test("a backup loaded into an empty notebook shows the notes", async () => {
  show({ store: await storeWith([]) });
  await screen.findByText(en["notebook.empty"]);
  upload(toBackup([entry()], new Date(2026, 10, 13)));
  expect(await screen.findByText(t("notebook.loaded", { added: "1", skipped: "0" }))).toBeTruthy();
  expect(await screen.findByText("2026-11-13: Hip external rotation, It hurts, Left")).toBeTruthy();
});

test("deleting asks first", async () => {
  const { store } = await showWith([entry()]);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  fireEvent.click(screen.getByRole("button", { name: en["notebook.delete"] }));
  expect(confirm).toHaveBeenCalledWith(en["notebook.deleteConfirm"]);
  expect(screen.getByText("2026-11-13: Hip external rotation, It hurts, Left")).toBeTruthy();
  expect(await store.list()).toHaveLength(1);
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: en["notebook.delete"] }));
  expect(await screen.findByText(en["notebook.empty"])).toBeTruthy();
  expect(await store.list()).toEqual([]);
});

test("a store that fails to delete says so and keeps the note", async () => {
  const store = await storeWith([entry()]);
  store.remove = () => Promise.reject(new Error("no"));
  show({ store });
  await screen.findByRole("heading", { name: en["notebook.entries"] });
  vi.spyOn(window, "confirm").mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: en["notebook.delete"] }));
  expect(await screen.findByText(en["notebook.unavailable"])).toBeTruthy();
  expect(screen.getByText("2026-11-13: Hip external rotation, It hurts, Left")).toBeTruthy();
});

test("the print button hands over the notes", async () => {
  const { onPrint } = await showWith([entry()]);
  fireEvent.click(screen.getByRole("button", { name: en["notebook.print"] }));
  expect(onPrint).toHaveBeenCalledWith([entry()]);
});

test("saving a backup downloads a file named after the day", async () => {
  await showWith([entry()]);
  // jsdom has no object URLs, so the test lends the two functions and puts the old ones back.
  const before = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  const createObjectURL = vi.fn(() => "blob:backup");
  const revokeObjectURL = vi.fn();
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  try {
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });
    fireEvent.click(screen.getByRole("button", { name: en["notebook.saveBackup"] }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clicked).toHaveLength(1);
    expect(clicked[0].href).toBe("blob:backup");
    expect(clicked[0].download).toMatch(/^anatome-notebook-\d{4}-\d{2}-\d{2}\.json$/);
    expect(clicked[0].isConnected).toBe(false);
    // The object URL is let go a second after the click.
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith("blob:backup"), { timeout: 2500 });
  } finally {
    URL.createObjectURL = before.create;
    URL.revokeObjectURL = before.revoke;
  }
});

test("with the comparison off no look-into heading shows", async () => {
  await showWith([entry()], { showComparison: false });
  expect(screen.queryByRole("heading", { name: en["notebook.lookInto"] })).toBeNull();
  expect(screen.queryByText(en["notebook.needFine"])).toBeNull();
  expect(screen.queryByRole("button", { name: /: loaded in/ })).toBeNull();
});

test("each Delete button points at the line of its own note", async () => {
  await showWith([entry(), entry({ id: "e2", createdAt: 2, note: "second" })]);
  const items = listItems();
  for (const item of items) {
    const id = within(item).getByRole("button", { name: en["notebook.delete"] }).getAttribute("aria-describedby");
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)).toBe(item.querySelector("p"));
  }
  expect(new Set(items.map((i) => i.querySelector("button")!.getAttribute("aria-describedby"))).size).toBe(2);
});

test("a note logged in English reads in German after the switch", async () => {
  // The same store, with a note saved while the app was in English. The note keeps only the movement's id.
  const store = await storeWith([entry()]);
  const bundle = makeMovementBundle();
  bundle.movements = bundle.movements.map((m) => (m.id === "hip-external-rotation" ? { ...m, german: "Außenrotation im Hüftgelenk" } : m));
  show({ store, bundle, lang: "en" });
  expect(await screen.findByText("2026-11-13: Hip external rotation, It hurts, Left")).toBeTruthy();
  cleanup();
  show({ store, bundle, lang: "de" });
  expect(await screen.findByText(`2026-11-13: Außenrotation im Hüftgelenk, ${de["notebook.painful"]}, ${de["notebook.side.l"]}`)).toBeTruthy();
  // And back to English, from the same note.
  cleanup();
  show({ store, bundle, lang: "en" });
  expect(await screen.findByText("2026-11-13: Hip external rotation, It hurts, Left")).toBeTruthy();
});

test("the status line shown in English reads in German after the language changes", async () => {
  const store = await storeWith([entry()]);
  const bundle = makeMovementBundle();
  const panel = (lang: Lang) => (
    <NotebookPanel t={lang === "de" ? createT(de, en) : t} lang={lang} bundle={bundle} store={store} storeError={false} showComparison onFocusStructure={vi.fn()} onPrint={vi.fn()} />
  );
  const { rerender } = render(panel("en"));
  await screen.findByRole("heading", { name: en["notebook.entries"] });
  upload(toBackup([entry(), entry({ id: "e2", createdAt: 2 })], new Date(2026, 10, 13)));
  expect(await screen.findByText(t("notebook.loaded", { added: "1", skipped: "1" }))).toBeTruthy();
  rerender(panel("de"));
  expect(screen.getByRole("status").textContent).toBe(createT(de)("notebook.loaded", { added: "1", skipped: "1" }));
});
