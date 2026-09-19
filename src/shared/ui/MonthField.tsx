import { useState } from "react";
import {
  MONTH_NAMES,
  MonthParts,
  joinMonthValue,
  splitMonthValue,
  yearChoices,
} from "../lib/monthValue";

interface MonthFieldProps {
  /** The stored value, "YYYY-MM" or the empty string. */
  value: string;
  /** Called with the new stored value once both parts are set, or with "". */
  onChange: (value: string) => void;
  /** What the pair of selects is called, for assistive technology. */
  label: string;
}

const selectCls =
  "w-full min-w-0 px-2 py-2 bg-well border border-line rounded-lg text-sm text-ink";

/**
 * A month and year chooser built from two selects rather than a native month input.
 *
 * The platform control puts every year in one scrolling list inside a popup the
 * page can neither style nor size, which is what made a distant year impractical
 * to reach. Two selects make the year an ordinary list, and the stored value keeps
 * the same "YYYY-MM" shape the document model already reads.
 *
 * The picked parts are held here rather than read back from the value, because a
 * half filled pair stores nothing; a fully controlled pair would therefore drop
 * the first choice before the second could be made.
 *
 * @example
 * ```tsx
 * <MonthField label="Start date" value={entry.startDate || ""} onChange={(v) => set({ startDate: v })} />
 * ```
 */
export const MonthField = ({ value, onChange, label }: MonthFieldProps) => {
  const [parts, setParts] = useState<MonthParts>(() => splitMonthValue(value));
  const [lastValue, setLastValue] = useState(value);

  // An empty value this control just produced is a half filled pair still being
  // completed, so the parts stay on screen. Any other change is the document
  // speaking, and it replaces them.
  if (value !== lastValue) {
    setLastValue(value);
    if (value !== "" || joinMonthValue(parts) !== "") setParts(splitMonthValue(value));
  }

  const pick = (next: Partial<MonthParts>) => {
    const merged = { ...parts, ...next };
    setParts(merged);
    onChange(joinMonthValue(merged));
  };

  return (
    <div className="flex gap-2">
      <select
        className={selectCls}
        value={parts.month}
        onChange={(e) => pick({ month: e.target.value })}
        aria-label={`${label}, month`}
      >
        <option value="">Month</option>
        {MONTH_NAMES.map((name, i) => (
          <option key={name} value={String(i + 1).padStart(2, "0")}>
            {name}
          </option>
        ))}
      </select>
      <select
        className={selectCls}
        value={parts.year}
        onChange={(e) => pick({ year: e.target.value })}
        aria-label={`${label}, year`}
      >
        <option value="">Year</option>
        {yearChoices(parts.year).map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
};
