import type { RegionBundle } from "../data/bundle";
import type { Translate } from "../i18n/t";

type Props = { bundle: RegionBundle | null; t: Translate; onOpenList: () => void };

// Sits above the model in the review build only. It takes its own space, so it never covers the model.
export function ReviewBanner({ bundle, t, onOpenList }: Props) {
  if (bundle?.mode !== "review") return null;
  return (
    <div className="review-banner" role="status">
      <span>{t("review.banner")}</span>
      <button type="button" onClick={onOpenList}>
        {t("review.list")}
      </button>
    </div>
  );
}
