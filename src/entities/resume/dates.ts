// Date display for resume documents (preview + exports).
//
// Parsed by string-splitting, NOT `new Date()`: Date parses "YYYY-MM"/"YYYY-MM-DD"
// as UTC midnight, which renders the previous month/day for viewers west of UTC
// ("2023-09" → "Aug 2023" in Calgary). Same rule as the site's date helper.

/** BCP 47 locale for each document language the Customize panel offers. */
const LOCALES: Record<string, string> = {
  "English": "en",
  "English (UK)": "en-GB",
  "French": "fr",
  "German": "de",
  "Spanish": "es",
  "Turkish": "tr",
  "Azerbaijani": "az",
};

export const languageLocale = (language?: string): string =>
  LOCALES[language ?? ""] ?? "en";

/** The word a resume uses for an open-ended date range. */
const PRESENT: Record<string, string> = {
  en: "Present",
  "en-GB": "Present",
  fr: "Présent",
  de: "Heute",
  es: "Presente",
  tr: "Halen",
  az: "Hazırda",
};

export const presentWord = (language?: string): string =>
  PRESENT[languageLocale(language)] ?? "Present";

// Month abbreviations come from the browser's own locale data; computed once
// per locale, with English as the fallback if a locale is missing.
const monthCache = new Map<string, string[]>();
function months(locale: string): string[] {
  const cached = monthCache.get(locale);
  if (cached) return cached;
  let names: string[];
  try {
    const fmt = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
    names = Array.from({ length: 12 }, (_, i) =>
      fmt.format(new Date(Date.UTC(2020, i, 15)))
    );
  } catch {
    names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  }
  monthCache.set(locale, names);
  return names;
}

/** Honours the document's `style.dateFormat` (MMM YYYY / MMM DD, YYYY /
 *  MM/YYYY / YYYY) in the document's language. */
export function fmtResumeDate(d: string | undefined, fmt: string, language?: string): string {
  if (!d) return "";
  const [y, m, day] = d.split("T")[0].split("-");
  const month = m ? parseInt(m, 10) : undefined;
  if (!y || !month || month < 1 || month > 12) return d;
  const mon = months(languageLocale(language))[month - 1];
  switch (fmt) {
    case "MMM DD, YYYY":
      return day ? `${mon} ${parseInt(day, 10)}, ${y}` : `${mon} ${y}`;
    case "MM/YYYY":
      return `${String(month).padStart(2, "0")}/${y}`;
    case "YYYY":
      return y;
    default:
      return `${mon} ${y}`;
  }
}
