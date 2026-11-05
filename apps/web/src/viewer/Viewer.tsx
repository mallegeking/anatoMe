import { lazy, Suspense, useCallback, useRef, useState } from "react";
import type { Translate } from "../i18n/t";
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import type { SceneProps } from "./Scene";
import { useLoadWatchdog } from "./useLoadWatchdog";
import { hasWebGL, WebGLUnavailableError } from "./webgl";

// The 3D scene and three.js arrive as a separate download, so the rest of the first screen shows without waiting for them.
const Scene = lazy(() => import("./Scene"));

type Props = Omit<SceneProps, "onLoaded"> & { t: Translate };

export function Viewer({ t, ...sceneProps }: Props) {
  return (
    <ModelErrorBoundary t={t}>
      <WatchedScene t={t} {...sceneProps} />
    </ModelErrorBoundary>
  );
}

// Shows the loading text until the model files are in, and keeps an eye on the time.
function WatchedScene({ t, ...sceneProps }: Props) {
  // Checked once. Without WebGL there is no point in downloading three.js.
  const [webgl] = useState(hasWebGL);
  const [loaded, setLoaded] = useState(false);
  const ready = useRef(false);
  const isReady = useCallback(() => ready.current, []);
  const markLoaded = useCallback(() => {
    ready.current = true;
    setLoaded(true);
  }, []);

  // If the model is still not loaded after about 20 s, show the load error instead of a blank screen.
  // This also covers the download of the 3D code itself.
  useLoadWatchdog(isReady);

  if (!webgl) throw new WebGLUnavailableError();

  return (
    <>
      {!loaded && (
        <p className="model-loading" role="status">
          {t("loading.model")}
        </p>
      )}
      <Suspense fallback={null}>
        <Scene {...sceneProps} onLoaded={markLoaded} />
      </Suspense>
    </>
  );
}
