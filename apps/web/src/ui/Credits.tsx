import { CORRECTION_URL, REPO_URL } from "../config";
import type { Translate } from "../i18n/t";

// The credit lines below are copies of the "Credit text" column in ATTRIBUTION.md.
// The app cannot read that file when it runs, so en.json holds the copies.
// If one changes, change the other to match.
// licence is the key of the link text and the address of the licence deed, for the credits that need one.
const CREDITS: { key: string; licence?: { key: string; href: string } }[] = [
  {
    key: "credits.bodyparts3d",
    licence: { key: "credits.licenceCcBy", href: "https://creativecommons.org/licenses/by/4.0/" },
  },
  {
    key: "credits.zanatomy",
    licence: { key: "credits.licenceCcBySa", href: "https://creativecommons.org/licenses/by-sa/4.0/" },
  },
  { key: "credits.threejs" },
  { key: "credits.draco" },
];

// The build writes this file with the licence texts of every library inside the app, see vite.config.ts.
const LIBRARY_LICENCES = `${import.meta.env.BASE_URL}third-party-licenses.txt`;

// The educational line. The app pins it at the top of the panel, outside the part that scrolls,
// so a long info panel can never push it out of view. It sits below the model, so it never covers it.
export function EducationalLine({ t }: { t: Translate }) {
  return <p className="educational">{t("about.educational")}</p>;
}

// The credit, then the licence link, with the text around them taken from en.json.
function withLicence(t: Translate, key: string, licence: { key: string; href: string }) {
  const [before, after] = t("credits.withLicence").split("{licence}");
  return (
    <>
      {before.replace("{credit}", t(key))}
      <a href={licence.href} target="_blank" rel="noopener noreferrer">{t(licence.key)}</a>
      {after}
    </>
  );
}

export function Credits({ t }: { t: Translate }) {
  return (
    <>
      <details className="credits">
        <summary>{t("credits.title")}</summary>
        <ul>
          {CREDITS.map(({ key, licence }) => (
            <li key={key}>
              {licence ? withLicence(t, key, licence) : t(key)}
            </li>
          ))}
        </ul>
        <p>{t("credits.modified")}</p>
        <p>
          {t("credits.libraries")}{" "}
          <a href={LIBRARY_LICENCES} target="_blank" rel="noopener noreferrer">
            {t("credits.librariesLink")}
          </a>
        </p>
        <p>{t("about.version", { version: __APP_VERSION__ })}</p>
        <p>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">{t("about.source")}</a>
          {" · "}
          <a href={CORRECTION_URL} target="_blank" rel="noopener noreferrer">{t("about.report")}</a>
        </p>
      </details>
    </>
  );
}
