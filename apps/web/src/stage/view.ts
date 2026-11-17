import type { ViewDirection } from "../viewer/handle";

export type ViewName = "front" | "back" | "left" | "right" | "top" | "bottom";

// The body faces +z, its head is at +y and its left side is at +x. This was checked in the hip model:
// the meshes marked side "l" lie at positive x, rectus femoris is in front of gluteus maximus (larger z),
// and the sacrum is above the femur (larger y).

// The view whose axis is nearest to the camera direction. On a tie z wins over x, and x over y.
// A direction that is all zero or not finite counts as the front view.
export function viewOf(direction: ViewDirection): ViewName {
  const [x, y, z] = direction;
  if (![x, y, z].every(Number.isFinite)) return "front";
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const az = Math.abs(z);
  if (ax === 0 && ay === 0 && az === 0) return "front";
  if (az >= ax && az >= ay) return z > 0 ? "front" : "back";
  if (ax >= ay) return x > 0 ? "left" : "right";
  return y > 0 ? "top" : "bottom";
}

// Which body side is at the left and at the right edge of the screen.
// null when the view is not from the front or back, because then one side hides the other.
export function markersOf(view: ViewName): { screenLeft: "l" | "r"; screenRight: "l" | "r" } | null {
  // Seen from the front, the body's right is on the viewer's left, as in a mirror.
  if (view === "front") return { screenLeft: "r", screenRight: "l" };
  if (view === "back") return { screenLeft: "l", screenRight: "r" };
  return null;
}
