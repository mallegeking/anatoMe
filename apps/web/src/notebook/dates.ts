import type { Lang } from "../i18n/lang";

const LOCALE: Record<Lang, string> = { en: "en-GB", de: "de-DE" };

// "2026-11-14" as "14 Nov 2026" in English and "14.11.2026" in German. The stored day does not change.
// The day is built in UTC and shown in UTC, so no time zone can move it. Anything that is not a real day comes back as it is.
export function formatDate(isoDay: string, lang: Lang): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDay);
  if (!match) return isoDay;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return isoDay;
  return new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: "medium", timeZone: "UTC" }).format(date);
}
