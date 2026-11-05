import { afterEach, expect, test, vi } from "vitest";
import { redrawWhenBack } from "./redraw";

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event("visibilitychange"));
}

afterEach(() => {
  // jsdom's own value lives on the prototype, so removing ours brings it back.
  delete (document as { hidden?: boolean }).hidden;
});

test("a restored WebGL context asks for a frame", () => {
  const canvas = document.createElement("canvas");
  const invalidate = vi.fn();
  redrawWhenBack(canvas, invalidate);
  canvas.dispatchEvent(new Event("webglcontextrestored"));
  expect(invalidate).toHaveBeenCalledTimes(1);
});

test("the page becoming visible asks for a frame, hiding it does not", () => {
  const invalidate = vi.fn();
  redrawWhenBack(document.createElement("canvas"), invalidate);
  setHidden(true);
  expect(invalidate).not.toHaveBeenCalled();
  setHidden(false);
  expect(invalidate).toHaveBeenCalledTimes(1);
});

test("stopping removes both listeners", () => {
  const canvas = document.createElement("canvas");
  const invalidate = vi.fn();
  const stop = redrawWhenBack(canvas, invalidate);
  stop();
  canvas.dispatchEvent(new Event("webglcontextrestored"));
  setHidden(false);
  expect(invalidate).not.toHaveBeenCalled();
});
