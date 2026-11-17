import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { QuietBoundary } from "./QuietBoundary";

afterEach(cleanup);

function Boom(): never {
  throw new Error("boom");
}

test("a failure shows the fallback when there is one, and nothing otherwise", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const { container, rerender } = render(
    <QuietBoundary fallback={<p>fallback line</p>}>
      <Boom />
    </QuietBoundary>,
  );
  expect(screen.getByText("fallback line")).toBeTruthy();
  rerender(
    <QuietBoundary key="b">
      <Boom />
    </QuietBoundary>,
  );
  expect(container.textContent).toBe("");
});
