import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { makeBundle } from "../ui/fixture";
import { ModelErrorBoundary } from "../viewer/ModelErrorBoundary";
import { clearRegionDataCache, forgetFailedRegionData, normalizeBundle, useRegionData } from "./useRegionData";

const t = createT(en);

beforeEach(clearRegionDataCache);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function Show() {
  return <p>{useRegionData("hip").region}</p>;
}

function tree(key = 0) {
  return (
    <ModelErrorBoundary key={key} t={t}>
      <Suspense fallback={<p>loading</p>}>
        <Show />
      </Suspense>
    </ModelErrorBoundary>
  );
}

function setup() {
  return render(tree());
}

test("loads the bundle after waiting", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(makeBundle()))));
  setup();
  expect(screen.getByText("loading")).toBeTruthy();
  await waitFor(() => expect(screen.getByText("hip")).toBeTruthy());
});

test("a missing data file ends in the readable load error", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
  setup();
  await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(en["error.modelLoad"]));
});

test("a broken data file ends in the readable load error", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(async () => new Response("not json")));
  setup();
  await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(en["error.modelLoad"]));
});

test("after forgetFailedRegionData a failed region is fetched again", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const fetch = vi.fn(async () => new Response(JSON.stringify(makeBundle())));
  fetch.mockImplementationOnce(async () => new Response("", { status: 404 }));
  vi.stubGlobal("fetch", fetch);
  const { rerender } = setup();
  await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  act(() => forgetFailedRegionData());
  rerender(tree(1));
  await waitFor(() => expect(screen.getByText("hip")).toBeTruthy());
  expect(fetch).toHaveBeenCalledTimes(2);
});

test("forgetFailedRegionData leaves loaded regions alone", async () => {
  const fetch = vi.fn(async () => new Response(JSON.stringify(makeBundle())));
  vi.stubGlobal("fetch", fetch);
  const { rerender } = setup();
  await waitFor(() => expect(screen.getByText("hip")).toBeTruthy());
  forgetFailedRegionData();
  rerender(tree(1));
  expect(screen.getByText("hip")).toBeTruthy();
  expect(fetch).toHaveBeenCalledTimes(1);
});

test("normalizeBundle fills what an old bundle lacks", () => {
  const old = { region: "hip", mode: "normal" as const, structures: [{ id: "femur", type: "bone", english: "Femur", depth: 4 }], movements: [], attachments: [], actions: [], citations: [], pendingByStructure: {} };
  const b = normalizeBundle(old as never);
  expect(b.exercises).toEqual([]);
  expect(b.pendingByMovement).toEqual({});
  expect(b.pendingExercises).toBe(0);
  expect(b.structures[0].paired).toBe(true);
});
