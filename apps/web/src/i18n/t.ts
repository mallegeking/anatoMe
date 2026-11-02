// Tiny translate helper. All user-facing text lives in en.json.
export type Translate = (key: string, vars?: Record<string, string>) => string;

export function createT(messages: Record<string, string>): Translate {
  return (key, vars) => {
    const template = messages[key];
    if (template === undefined) {
      // Show the key itself so a gap is easy to spot, and warn while developing.
      if (import.meta.env.DEV) console.warn(`Missing translation key: ${key}`);
      return key;
    }
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (whole, name: string) => vars[name] ?? whole);
  };
}
