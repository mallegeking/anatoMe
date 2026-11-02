import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import en from "../i18n/en.json";
import { createT } from "../i18n/t";
import { ModelErrorBoundary } from "./ModelErrorBoundary";

const t = createT(en);

function Thrower(): never {
  throw new Error("boom");
}

test("shows the load error message when a child throws", () => {
  // React logs the caught error, so keep the test output quiet.
  vi.spyOn(console, "error").mockImplementation(() => {});
  render(
    <ModelErrorBoundary t={t}>
      <Thrower />
    </ModelErrorBoundary>,
  );
  expect(screen.getByText(en["error.modelLoad"])).toBeTruthy();
});
