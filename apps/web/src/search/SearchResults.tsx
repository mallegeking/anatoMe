import type { BundleStructure } from "../data/bundle";
import type { Lang } from "../i18n/lang";
import { nameOf } from "../i18n/names";
import type { Translate } from "../i18n/t";

type Props = {
  t: Translate;
  lang: Lang;
  results: BundleStructure[];
  onChoose: (structure: BundleStructure) => void;
};

// The list under the search field. Each row is one structure: its name in the language shown and its type,
// with the Latin name below.
export function SearchResults({ t, lang, results, onChoose }: Props) {
  if (results.length === 0) {
    return (
      <p className="search-none" role="status">
        {t("search.none")}
      </p>
    );
  }
  return (
    <ul className="search-results" data-testid="search-results">
      {results.map((s) => (
        <li key={s.id}>
          <button type="button" onClick={() => onChoose(s)}>
            <span className="search-result-top">
              <span>{nameOf(s, lang)}</span>
              <span className="muted">{t(`type.${s.type}`)}</span>
            </span>
            {s.latin && <span className="muted">{s.latin}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
