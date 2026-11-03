import { useState } from "react";
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
};

// The bar above the model: the search field and the layers button.
// The result list closes when a result is chosen or the field is emptied.
export function TopBar({ t, structures, layersOpen, onToggleLayers, onChoose }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = searchStructures(query, structures);

  function change(value: string) {
    setQuery(value);
    setOpen(value.trim() !== "");
  }

  function choose(structure: BundleStructure) {
    setQuery(structure.english);
    setOpen(false);
    onChoose(structure);
  }

  return (
    <header className="top-bar">
      <div className="top-bar-row">
        <input
          type="search"
          className="search-field"
          value={query}
          placeholder={t("search.placeholder")}
          aria-label={t("search.label")}
          autoComplete="off"
          enterKeyHint="search"
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && results[0]) choose(results[0]);
          }}
        />
        <button type="button" className="layers-toggle" aria-expanded={layersOpen} onClick={onToggleLayers}>
          {t(layersOpen ? "layers.close" : "layers.open")}
        </button>
      </div>
      {open && (
        <div className="search-drop">
          <SearchResults t={t} results={results} onChoose={choose} />
        </div>
      )}
    </header>
  );
}
