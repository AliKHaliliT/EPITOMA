// Date display for resume documents (preview + exports).
//
// Parsed by string-splitting, NOT `new Date()`: Date parses "YYYY-MM"/"YYYY-MM-DD"
// as UTC midnight, which renders the previous month/day for viewers west of UTC
// ("2023-09" → "Aug 2023" in Calgary). Same rule as src/lib/dates.ts.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Honours the document's `style.dateFormat` (MMM YYYY / MMM DD, YYYY / MM/YYYY / YYYY). */
export function fmtResumeDate(d: string | undefined, fmt: string): string {
  if (!d) return "";
  const [y, m, day] = d.split("T")[0].split("-");
  const month = m ? parseInt(m, 10) : undefined;
  if (!y || !month || month < 1 || month > 12) return d;
  const mon = MONTHS[month - 1];
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
