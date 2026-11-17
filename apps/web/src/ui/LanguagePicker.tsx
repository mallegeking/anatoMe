import { LANGS, type Lang } from "../i18n/lang";
import type { Translate } from "../i18n/t";

// The language switch. Each language keeps its own name, the same in every language file.
// With showLabel the word "Language" shows next to it, otherwise it is only the field's accessible name.
export function LanguagePicker({ t, lang, onLang, showLabel }: { t: Translate; lang: Lang; onLang: (lang: Lang) => void; showLabel: boolean }) {
  return (
    <label className="lang-switch">
      {showLabel && <span>{t("lang.label")}</span>}
      <select
        className="field lang-picker"
        aria-label={showLabel ? undefined : t("lang.label")}
        value={lang}
        onChange={(e) => onLang(e.target.value as Lang)}
      >
        {LANGS.map((id) => (
          <option key={id} value={id}>
            {t(`lang.${id}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
