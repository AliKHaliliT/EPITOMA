import { describe, expect, it } from "vitest";
import { joinMonthValue, splitMonthValue, yearChoices } from "@/shared/lib";

describe("splitMonthValue", () => {
  it("splits a well formed value", () => {
    expect(splitMonthValue("2020-03")).toEqual({ year: "2020", month: "03" });
  });

  it("reads anything malformed as fully unset", () => {
    for (const bad of ["", undefined, "2020", "2020-3", "2020-13", "2020-00", "20-03", "not a date"]) {
      expect(splitMonthValue(bad)).toEqual({ year: "", month: "" });
    }
  });
});

describe("joinMonthValue", () => {
  it("round trips a complete value", () => {
    expect(joinMonthValue(splitMonthValue("1998-11"))).toBe("1998-11");
  });

  it("stores nothing while either part is missing", () => {
    expect(joinMonthValue({ year: "2020", month: "" })).toBe("");
    expect(joinMonthValue({ year: "", month: "03" })).toBe("");
    expect(joinMonthValue({ year: "", month: "" })).toBe("");
  });
});

describe("yearChoices", () => {
  const today = new Date("2026-09-19T00:00:00Z");

  it("runs from five years ahead back over a career, newest first", () => {
    const years = yearChoices("", today);
    expect(years[0]).toBe("2031");
    expect(years[years.length - 1]).toBe("1966");
    expect(years).toEqual([...years].sort((a, b) => Number(b) - Number(a)));
  });

  it("keeps a stored year that falls outside the range", () => {
    const years = yearChoices("1940", today);
    expect(years).toContain("1940");
    expect(years[years.length - 1]).toBe("1940");
  });

  it("does not duplicate a stored year already in range", () => {
    expect(yearChoices("2020", today).filter((y) => y === "2020")).toHaveLength(1);
  });
});
