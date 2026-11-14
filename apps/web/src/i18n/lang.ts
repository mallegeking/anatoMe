// The language choice. The stored choice wins, then the first of the browser's languages
// that the app has, then English. The choice is a setting, kept in localStorage.
export const LANGS = ["en", "de"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_KEY = "anatome.lang";

// The app's language for a code such as "de" or "de-AT", or null when the app does not have it.
function known(code: string | null): Lang | null {
  if (!code) return null;
  const base = code.toLowerCase().split("-")[0];
  return LANGS.find((lang) => lang === base) ?? null;
}

export function pickLanguage(stored: string | null, browser: readonly string[]): Lang {
  return known(stored) ?? browser.map(known).find((lang) => lang !== null) ?? "en";
}

// null when the browser has no localStorage or does not let the app read it.
export function readStoredLanguage(): string | null {
  try {
    return localStorage.getItem(LANG_KEY);
  } catch {
    return null;
  }
}

// A browser that does not let the app store it keeps the choice only until the page reloads.
export function storeLanguage(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Nothing to do, the app works the same without the stored choice.
  }
}
