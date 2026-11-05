import type { BundleStructure } from "../data/bundle";
import type { Translate } from "../i18n/t";

type Props = {
  t: Translate;
  results: BundleStructure[];
  onChoose: (structure: BundleStructure) => void;
};

// The list under the search field. Each row is one structure: its English name and type, with the Latin name below.
export function SearchResults({ t, results, onChoose }: Props) {
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
              <span>{s.english}</span>
              <span className="muted">{t(`type.${s.type}`)}</span>
            </span>
            {s.latin && <span className="muted">{s.latin}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
