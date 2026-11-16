import { useRef, useState, type FocusEvent } from "react";
import type { BundleStructure } from "../data/bundle";
import type { Lang } from "../i18n/lang";
import { nameOf } from "../i18n/names";
import type { Translate } from "../i18n/t";
import { SearchResults } from "../search/SearchResults";
import { searchStructures } from "../search/search";

type Props = {
  t: Translate;
  // The search finds and shows names in this language, and in English and Latin too.
  lang: Lang;
  structures: BundleStructure[];
  onChoose: (structure: BundleStructure) => void;
  // Whether the result list shows. The app keeps this, so a tap on the model can close the list too.
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // The body regions in the model manifest, the one shown, and what to call when the person picks another.
  regions: string[];
  region: string;
  onRegion: (id: string) => void;
};

// The bar above the model: the app name, the search field and, when there is more than one, the region picker.
// The result list closes when a result is chosen, the field is emptied or the field loses focus.
export function TopBar({ t, lang, structures, onChoose, open, onOpenChange, regions, region, onRegion }: Props) {
  const [query, setQuery] = useState("");
  // Another region has other structures, so the typed text goes. State set while rendering is the React way to reset on a change.
  const [queryRegion, setQueryRegion] = useState(region);
  if (queryRegion !== region) {
    setQueryRegion(region);
    setQuery("");
  }
  const field = useRef<HTMLInputElement>(null);
  const drop = useRef<HTMLDivElement>(null);
  const results = searchStructures(query, structures, lang);

  function change(value: string) {
    setQuery(value);
    onOpenChange(value.trim() !== "");
  }

  function choose(structure: BundleStructure) {
    setQuery(nameOf(structure, lang));
    onOpenChange(false);
    // The field kept the focus during the tap, so let go of it now. On a phone this closes the keyboard.
    field.current?.blur();
    onChoose(structure);
  }

  // Focus leaving the search closes the list. Focus moving between the field and the results
  // (with the Tab key, for example) keeps it open.
  function leave(event: FocusEvent<HTMLElement>) {
    const next = event.relatedTarget as Node | null;
    if (next && (next === field.current || drop.current?.contains(next))) return;
    onOpenChange(false);
  }

  return (
    <header className="top-bar" onBlur={leave}>
      <div className="top-bar-row">
        <h1 className="app-name">{t("app.name")}</h1>
        <input
          ref={field}
          type="search"
          className="field search-field"
          value={query}
          placeholder={t("search.placeholder")}
          aria-label={t("search.label")}
          autoComplete="off"
          enterKeyHint="search"
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onOpenChange(false);
            if (e.key === "Enter" && open && results[0]) choose(results[0]);
          }}
        />
        {regions.length > 1 && (
          <select className="field region-picker" aria-label={t("region.label")} value={region} onChange={(e) => onRegion(e.target.value)}>
            {regions.map((id) => (
              <option key={id} value={id}>
                {t(`region.${id}`)}
              </option>
            ))}
          </select>
        )}
      </div>
      {open && (
        // Pressing on the list would take the focus from the field, and the blur would close the list
        // before the tap on a result arrives. Cancelling the press keeps the focus in the field.
        <div ref={drop} className="search-drop" onMouseDown={(e) => e.preventDefault()}>
          <SearchResults t={t} lang={lang} results={results} onChoose={choose} />
        </div>
      )}
    </header>
  );
}
