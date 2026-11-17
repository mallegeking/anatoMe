// Tiny translate helper. All user-facing text lives in en.json, and de.json holds the German texts.
export type Translate = (key: string, vars?: Record<string, string>) => string;

// A key missing from messages is looked up in fallback (English) before the key itself is returned.
export function createT(messages: Record<string, string>, fallback?: Record<string, string>): Translate {
  return (key, vars) => {
    const template = messages[key] ?? fallback?.[key];
    if (template === undefined) {
      // Show the key itself so a gap is easy to spot, and warn while developing.
      if (import.meta.env.DEV) console.warn(`Missing translation key: ${key}`);
      return key;
    }
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (whole, name: string) => vars[name] ?? whole);
  };
}
