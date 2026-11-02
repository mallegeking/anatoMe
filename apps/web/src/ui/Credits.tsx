import type { Translate } from "../i18n/t";

// The credit lines below are copies of the "Credit text" column in ATTRIBUTION.md.
// The app cannot read that file when it runs, so en.json holds the copies.
// If one changes, change the other to match.
const CREDIT_KEYS = ["credits.bodyparts3d", "credits.zanatomy", "credits.threejs", "credits.draco"];

export function Credits({ t }: { t: Translate }) {
  return (
    <details className="credits">
      <summary>{t("credits.title")}</summary>
      <ul>
        {CREDIT_KEYS.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
      <p>{t("about.educational")}</p>
    </details>
  );
}
