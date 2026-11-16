import { CORRECTION_URL, REPO_URL } from "../config";
import { LANGS, type Lang } from "../i18n/lang";
import type { Translate } from "../i18n/t";

// The credit lines below are copies of the "Credit text" column in ATTRIBUTION.md.
// The app cannot read that file when it runs, so en.json and de.json hold the copies.
// The licences prescribe this wording, so de.json keeps the English lines word for word.
// If one changes, change the others to match.
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

// The credit and the licence link, in the order and with the text around them that the language file gives.
function withLicence(t: Translate, key: string, licence: { key: string; href: string }) {
  const [before, after] = t("credits.withLicence").split("{licence}");
  return (
    <>
      {before.replace("{credit}", t(key))}
      <a href={licence.href} target="_blank" rel="noopener noreferrer">{t(licence.key)}</a>
      {after.replace("{credit}", t(key))}
    </>
  );
}

// The language switch sits below the credits, outside the closed part, so it is easy to find.
// Each language keeps its own name, the same in every language file.
export function Credits({ t, lang, onLang }: { t: Translate; lang: Lang; onLang: (lang: Lang) => void }) {
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
      <p className="lang-switch">
        <select className="lang-picker" aria-label={t("lang.label")} value={lang} onChange={(e) => onLang(e.target.value as Lang)}>
          {LANGS.map((id) => (
            <option key={id} value={id}>
              {t(`lang.${id}`)}
            </option>
          ))}
        </select>
      </p>
    </>
  );
}
