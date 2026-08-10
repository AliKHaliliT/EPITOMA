// The cross-app loop, pinned with a real artifact: this fixture was produced by
// VITA's own export builder running against its demo seed, not written by hand.
// If either side of the vita-portfolio contract drifts, this suite goes red.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { installLocalStorageMock } from "@/shared/testing/localStorageMock";
import { importSnapshotFile, currentSnapshot } from "@/entities/portfolio";
import { PORTFOLIO_FORMAT, PORTFOLIO_VERSION, isPortfolioSnapshot } from "@/shared/contract";

const FIXTURE = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../../../fixtures/vita-portfolio.json"),
  "utf-8",
);

beforeEach(() => {
  installLocalStorageMock();
});

describe("a snapshot VITA actually exported", () => {
  it("satisfies the contract this side validates against", () => {
    const parsed: unknown = JSON.parse(FIXTURE);
    expect(isPortfolioSnapshot(parsed)).toBe(true);
  });

  it("imports through the real door and persists", () => {
    const snapshot = importSnapshotFile(FIXTURE);
    expect(snapshot.format).toBe(PORTFOLIO_FORMAT);
    expect(snapshot.version).toBe(PORTFOLIO_VERSION);
    expect(currentSnapshot()?.settings.name).toBe(snapshot.settings.name);
  });

  it("carries real collections rather than an empty shell", () => {
    const snapshot = importSnapshotFile(FIXTURE);
    expect(snapshot.content.experience?.length).toBeGreaterThan(0);
    expect(snapshot.content.education?.length).toBeGreaterThan(0);
    expect(snapshot.content.projects?.length).toBeGreaterThan(0);
  });

  it("carries the owner's palette so the builder chrome can follow the site", () => {
    const snapshot = importSnapshotFile(FIXTURE);
    expect(snapshot.palette?.light.background).toBeTruthy();
    expect(snapshot.palette?.dark.background).toBeTruthy();
  });
});
