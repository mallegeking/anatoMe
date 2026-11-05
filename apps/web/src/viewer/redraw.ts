// The canvas only draws when asked (frameloop "demand"). Two things can leave it blank with nobody asking:
// the browser takes the WebGL context away and gives it back (Android does this to tabs in the background),
// or the page comes back from a background tab. In both cases we ask for one frame.
// Returns a function that removes the listeners again.
export function redrawWhenBack(canvas: HTMLCanvasElement, invalidate: () => void): () => void {
  const redraw = () => invalidate();
  const redrawIfShown = () => {
    if (!document.hidden) invalidate();
  };
  canvas.addEventListener("webglcontextrestored", redraw);
  document.addEventListener("visibilitychange", redrawIfShown);
  return () => {
    canvas.removeEventListener("webglcontextrestored", redraw);
    document.removeEventListener("visibilitychange", redrawIfShown);
  };
}
