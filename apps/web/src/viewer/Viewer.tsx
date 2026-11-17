import { lazy, Suspense, useCallback, useMemo, useRef, useState, type ComponentType } from "react";
import type { Translate } from "../i18n/t";
import type { ModelFiles } from "./manifest";
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import type { SceneProps } from "./Scene";
import { useLoadWatchdog } from "./useLoadWatchdog";
import { hasWebGL, WebGLUnavailableError } from "./webgl";

type SceneModule = typeof import("./Scene");

type Props = Omit<SceneProps, "onLoaded" | "urls"> & {
  t: Translate;
  files: ModelFiles;
  // "Try again" after a load error. The app reads the manifest again here if that is what failed.
  onRetry: () => void;
};

export function Viewer({ t, onRetry, ...sceneProps }: Props) {
  // Each attempt gets its own lazy scene, because React keeps a failed download of the 3D code for good.
  const [attempt, setAttempt] = useState(0);
  // The 3D code, once it has arrived. "Try again" needs it to clear the loader's cache.
  const sceneModule = useRef<SceneModule | null>(null);
  const Scene = useMemo(
    () =>
      // The 3D scene and three.js arrive as a separate download, so the rest of the first screen shows without waiting for them.
      lazy(() =>
        import("./Scene").then((m) => {
          sceneModule.current = m;
          return m;
        }),
      ),
    // A new attempt number is what asks for a fresh lazy scene.
    [attempt],
  );

  // Three things remember a failure: the manifest in the app, the loader's cache (with the decoder)
  // and the lazy 3D code. This clears all three. It runs in the click, so the boundary shows the new attempt straight away.
  function retry() {
    const { files } = sceneProps;
    if (files && "urls" in files) sceneModule.current?.forgetModelFiles(files.urls);
    setAttempt((n) => n + 1);
    onRetry();
  }

  return (
    <ModelErrorBoundary t={t} onRetry={retry}>
      {/* A fresh scene for each attempt, with its own loading text and time limit. */}
      <WatchedScene key={attempt} t={t} Scene={Scene} {...sceneProps} />
    </ModelErrorBoundary>
  );
}

type WatchedProps = Omit<Props, "onRetry"> & { Scene: ComponentType<SceneProps> };

// Shows the loading text until the model files are in, and keeps an eye on the time.
function WatchedScene({ t, files, Scene, ...sceneProps }: WatchedProps) {
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
  // A manifest that could not be read is a model load failure, so the boundary shows the same message.
  if (files && "error" in files) throw files.error;

  return (
    <>
      {!loaded && (
        <p className="model-loading" role="status">
          {t("loading.model")}
        </p>
      )}
      <Suspense fallback={null}>
        <Scene {...sceneProps} urls={files?.urls ?? null} onLoaded={markLoaded} />
      </Suspense>
    </>
  );
}
