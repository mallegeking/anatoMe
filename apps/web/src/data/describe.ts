import type { BundleAction } from "./bundle";
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
