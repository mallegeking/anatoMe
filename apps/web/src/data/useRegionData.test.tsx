import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { makeBundle } from "../ui/fixture";
import { ModelErrorBoundary } from "../viewer/ModelErrorBoundary";
import { clearRegionDataCache, useRegionData } from "./useRegionData";

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

function setup() {
  render(
    <ModelErrorBoundary t={t}>
      <Suspense fallback={<p>loading</p>}>
        <Show />
      </Suspense>
    </ModelErrorBoundary>,
  );
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
