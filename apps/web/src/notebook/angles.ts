import type { RegionBundle } from "../data/bundle";
import type { Translate } from "../i18n/t";
import type { Pose } from "../movement/roles";

// The angles of a logged pose as words, for example "the hip bent at 32 degrees, the knee bent at 33 degrees".
// Only angles this version has a word for and that are not zero. The numbers are rounded to whole degrees
// for reading only, the stored pose keeps its exact values. Empty when there is nothing to show.
// The panel and the printed summary both use this, so they always say the same.
export function formatAngles(pose: Pose, bundle: RegionBundle, t: Translate): string {
  const known = new Set(bundle.movements.map((m) => m.dof));
  return Object.entries(pose)
    .filter(([angle, value]) => value !== 0 && known.has(angle))
    .map(([angle, value]) => t("notebook.angle", { angle: t(`angle.${angle}`), value: String(Math.round(value)) }))
    .join(", ");
}
