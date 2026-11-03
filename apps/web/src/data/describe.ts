import type { BundleAction, BundleMovement } from "./bundle";
import type { Translate } from "../i18n/t";

// Turns an angle range list into a sentence piece like "with the hip bent between 0 and 45 degrees".
// Several ranges are joined with the "when.and" text. No condition gives empty text.
export function describeCondition(when: BundleAction["when"], t: Translate): string {
  if (!when || when.length === 0) return "";
  return when
    .map((range) =>
      t("when.between", {
        angle: t(`angle.${range.angle}`),
        min: String(range.min),
        max: String(range.max),
      }),
    )
    .reduce((first, second) => t("when.and", { first, second }));
}

export function loadWord(load: BundleAction["load"], t: Translate): string {
  return t(`load.${load}`);
}

export function roleWord(role: NonNullable<BundleAction["role"]>, t: Translate): string {
  return t(`role.${role}`);
}

// The whole claim of an action row in words, for example "works (main), with the hip bent between 0 and 45 degrees".
// The info panel and the review list both use this, so they always say the same. The punctuation lives in en.json.
export function describeAction(action: BundleAction, t: Translate): string {
  const load = loadWord(action.load, t);
  const withRole = action.role ? t("info.actionRole", { load, role: roleWord(action.role, t) }) : load;
  const when = describeCondition(action.when, t);
  return when ? t("info.actionWhen", { text: withRole, when }) : withRole;
}

// The joint a movement belongs to, from the start of its dof. "knee.flexion" gives "knee".
export function jointOf(movement: BundleMovement): string {
  return movement.dof.split(".")[0];
}
