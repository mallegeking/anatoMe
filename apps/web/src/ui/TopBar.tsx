import { useRef, useState, type FocusEvent } from "react";
import type { BundleStructure } from "../data/bundle";
import type { Translate } from "../i18n/t";
import { SearchResults } from "../search/SearchResults";
import { searchStructures } from "../search/search";

type Props = {
  t: Translate;
  structures: BundleStructure[];
  layersOpen: boolean;
  onToggleLayers: () => void;
  onChoose: (structure: BundleStructure) => void;
  // Whether the result list shows. The app keeps this, so a tap on the model can close the list too.
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// The bar above the model: the search field and the layers button.
// The result list closes when a result is chosen, the field is emptied or the field loses focus.
export function TopBar({ t, structures, layersOpen, onToggleLayers, onChoose, open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const drop = useRef<HTMLDivElement>(null);
  const results = searchStructures(query, structures);

  function change(value: string) {
    setQuery(value);
    onOpenChange(value.trim() !== "");
  }

  function choose(structure: BundleStructure) {
    setQuery(structure.english);
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
        <input
          ref={field}
          type="search"
          className="search-field"
          value={query}
          placeholder={t("search.placeholder")}
          aria-label={t("search.label")}
          autoComplete="off"
          enterKeyHint="search"
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onOpenChange(false);
            if (e.key === "Enter" && results[0]) choose(results[0]);
          }}
        />
        <button type="button" className="layers-toggle" aria-expanded={layersOpen} onClick={onToggleLayers}>
          {t(layersOpen ? "layers.close" : "layers.open")}
        </button>
      </div>
      {open && (
        // Pressing on the list would take the focus from the field, and the blur would close the list
        // before the tap on a result arrives. Cancelling the press keeps the focus in the field.
        <div ref={drop} className="search-drop" onMouseDown={(e) => e.preventDefault()}>
          <SearchResults t={t} results={results} onChoose={choose} />
        </div>
      )}
    </header>
  );
}
