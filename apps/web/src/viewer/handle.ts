// A unit vector from the camera's target to the camera, in model space.
export type ViewDirection = readonly [number, number, number];

// The two things the app may ask of the viewer. It stays this small.
export type ViewerHandle = {
  // Frames the whole model again, as on first load, with a glide.
  resetView(): void;
  // Multiplies the camera distance. 0.8 comes closer, 1.25 moves away. The controls' limits still hold.
  zoomBy(factor: number): void;
};
