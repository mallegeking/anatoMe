import { IDBFactory } from "fake-indexeddb";
import { expect, test } from "vitest";
import { openNotebook } from "./store";
import { makeEntry, type NotebookEntry } from "./types";

const entry = (id: string, createdAt: number): NotebookEntry => ({
  id,
  createdAt,
  date: "2026-11-13",
  pick: { kind: "movement", id: "hip-flexion" },
  pose: { "hip.flexion": 30 },
  feeling: "painful",
  side: "l",
  note: "",
});

const input = {
  pick: { kind: "movement", id: "hip-flexion" } as const,
  pose: { "hip.flexion": 30 },
  feeling: "painful" as const,
  side: "l" as const,
  note: "",
};

test("entries come back newest first", async () => {
  const store = await openNotebook(new IDBFactory());
  await store.put(entry("a", 1));
  await store.put(entry("b", 2));
  expect((await store.list()).map((e) => e.id)).toEqual(["b", "a"]);
});

test("putting the same id again replaces the entry", async () => {
  const store = await openNotebook(new IDBFactory());
  await store.put(entry("a", 1));
  await store.put({ ...entry("a", 1), feeling: "fine", note: "better" });
  const all = await store.list();
  expect(all).toHaveLength(1);
  expect(all[0].feeling).toBe("fine");
  expect(all[0].note).toBe("better");
});

test("remove deletes one entry", async () => {
  const store = await openNotebook(new IDBFactory());
  await store.put(entry("a", 1));
  await store.put(entry("b", 2));
  await store.remove("a");
  expect((await store.list()).map((e) => e.id)).toEqual(["b"]);
});

test("putMany stores all of them", async () => {
  const store = await openNotebook(new IDBFactory());
  await store.putMany([entry("a", 1), entry("b", 3), entry("c", 2)]);
  expect((await store.list()).map((e) => e.id)).toEqual(["b", "c", "a"]);
});

test("entries survive closing and opening again", async () => {
  const factory = new IDBFactory();
  const first = await openNotebook(factory);
  await first.put(entry("a", 1));
  await first.put(entry("b", 2));
  const second = await openNotebook(factory);
  expect((await second.list()).map((e) => e.id)).toEqual(["b", "a"]);
});

test("opening without IndexedDB rejects", async () => {
  await expect(openNotebook(undefined)).rejects.toThrow();
});

test("makeEntry trims the note and cuts it at 500 characters", () => {
  expect(makeEntry({ ...input, note: "  " + "x".repeat(600) }, new Date(2026, 10, 13), "id1").note).toHaveLength(500);
});

test("makeEntry writes the local date", () => {
  expect(makeEntry(input, new Date(2026, 10, 13, 23, 30), "id1").date).toBe("2026-11-13");
});
