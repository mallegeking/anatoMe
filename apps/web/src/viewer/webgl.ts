// three needs WebGL 2 to draw. Some browsers have it switched off, for example when hardware acceleration is off.

// Thrown when the browser has no WebGL 2, so the error boundary can show the WebGL message.
export class WebGLUnavailableError extends Error {
  constructor() {
    super("This browser has no WebGL 2");
  }
}

// Asks the browser for a WebGL 2 context on a canvas nobody sees, then hands it straight back.
export function hasWebGL(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
    // Browsers allow only a few contexts at a time, so free this one now.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

// Our own error, or the one three throws when it cannot get a context.
export function isWebGLError(error: unknown): boolean {
  if (error instanceof WebGLUnavailableError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /Error creating WebGL context|WebGL 1 is not supported/.test(message);
}
