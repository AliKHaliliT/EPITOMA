/**
 * The month names the builder's own month control offers, in calendar order.
 *
 * They are abbreviated because the control sits in a half width column beside the
 * year, and because it is the form the document itself prints a date in.
 */
export const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** A month value split into the two parts a person picks, empty where unset. */
export interface MonthParts {
  /** The four digit year, or the empty string when no year is chosen. */
  year: string;
  /** The month as "01" through "12", or the empty string when no month is chosen. */
  month: string;
}

/**
 * Splits a stored "YYYY-MM" value into the year and month a person picks.
 *
 * Anything that is not a well formed "YYYY-MM" reads as fully unset, so a value
 * arriving from an imported document or an older record cannot put the control
 * into a state its own selects could not have produced.
 *
 * @param value - The stored value, normally "YYYY-MM" or the empty string.
 * @returns The two parts, each empty where the value did not supply it.
 */
export const splitMonthValue = (value: string | undefined): MonthParts => {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value ?? "");
  return match ? { year: match[1], month: match[2] } : { year: "", month: "" };
};

/**
 * Joins a picked year and month back into the stored "YYYY-MM" value.
 *
 * A half filled pair stores nothing, because "a year with no month" is not a
 * value the document model has a rendering for. The control keeps the half
 * choice on screen so the person can complete it.
 *
 * @param parts - The year and month currently picked.
 * @returns The "YYYY-MM" value, or the empty string while either part is unset.
 */
export const joinMonthValue = ({ year, month }: MonthParts): string =>
  year && month ? `${year}-${month}` : "";

/**
 * Builds the year list the control offers, newest first.
 *
 * The range runs a few years ahead for an expected graduation and far enough
 * back to cover a full career. A year already stored outside the range is added
 * rather than dropped, so opening an old document never silently loses a date.
 *
 * @param stored - A year already on the entry, included even when out of range.
 * @param today - The date the range is measured from, injectable for the suite.
 * @returns The selectable years, descending and without duplicates.
 */
export const yearChoices = (stored = "", today = new Date()): string[] => {
  const now = today.getFullYear();
  const years = [];
  for (let y = now + 5; y >= now - 60; y -= 1) years.push(String(y));
  if (stored && !years.includes(stored)) {
    years.push(stored);
    years.sort((a, b) => Number(b) - Number(a));
  }
  return years;
};
