// Pins the portfolio import contract: validation, storage round-trip, and
// rejection of malformed files.

import { beforeEach, describe, expect, it } from "vitest";
import { installLocalStorageMock } from "@/resume/test/localStorageMock";
import { clearImportedSnapshot, currentSnapshot, importSnapshotFile } from "./source";
import {
  PORTFOLIO_FORMAT,
  PORTFOLIO_VERSION,
  isPortfolioSnapshot,
} from "@/resume/types/portfolio";

const VALID = {
  format: PORTFOLIO_FORMAT,
  version: PORTFOLIO_VERSION,
  exportedAt: "2026-07-18T00:00:00.000Z",
  settings: { name: "Test Person" },
  content: { experience: [{ id: "e1", title: "Role A" }] },
};

beforeEach(() => {
  installLocalStorageMock();
});

describe("isPortfolioSnapshot", () => {
  it("accepts the export shape and rejects near-misses", () => {
    expect(isPortfolioSnapshot(VALID)).toBe(true);
    expect(isPortfolioSnapshot({ ...VALID, format: "other" })).toBe(false);
    expect(isPortfolioSnapshot({ ...VALID, settings: null })).toBe(false);
    expect(isPortfolioSnapshot({ ...VALID, content: undefined })).toBe(false);
    expect(isPortfolioSnapshot(null)).toBe(false);
  });
});

describe("import / current / clear", () => {
  it("round-trips an imported file through localStorage", () => {
    expect(currentSnapshot()).toBeNull();
    const snap = importSnapshotFile(JSON.stringify(VALID));
    expect(snap.settings.name).toBe("Test Person");
    expect(currentSnapshot()?.content.experience).toHaveLength(1);
    clearImportedSnapshot();
    expect(currentSnapshot()).toBeNull();
  });

  it("throws readable errors for invalid JSON and wrong formats", () => {
    expect(() => importSnapshotFile("{nope")).toThrow(/valid JSON/);
    expect(() => importSnapshotFile(JSON.stringify({ hello: 1 }))).toThrow(
      /portfolio export/
    );
    expect(currentSnapshot()).toBeNull();
  });

  it("ignores a malformed stored payload instead of throwing", () => {
    localStorage.setItem("os_resume_portfolio", "{not json");
    expect(currentSnapshot()).toBeNull();
    localStorage.setItem("os_resume_portfolio", JSON.stringify({ format: "x" }));
    expect(currentSnapshot()).toBeNull();
  });
});
