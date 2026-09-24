// Characterization tests for ResumeService: pins document creation from a
// portfolio snapshot, the sync/merge semantics (preserve structure, style,
// per-entry hidden/order), blank creation, and duplication.
// It also pins which stores a read refuses and when the refusal is forgotten.

import { beforeEach, describe, expect, it } from "vitest";
import { installLocalStorageMock } from "@/shared/testing/localStorageMock";
import { ResumeService } from "@/entities/resume/store";
import { ResumeDocument, ResumeSection } from "@/entities/resume/model";
import {
  PORTFOLIO_FORMAT,
  PORTFOLIO_VERSION,
  PortfolioSnapshot,
} from "@/shared/contract/portfolio";

const NOW = "2026-07-06T12:00:00.000Z";

const SNAPSHOT: PortfolioSnapshot = {
  format: PORTFOLIO_FORMAT,
  version: PORTFOLIO_VERSION,
  exportedAt: NOW,
  settings: {
    name: "Test Person",
    role: "Engineer",
    location: "Calgary",
    email: "t@example.com",
    website: "https://example.com",
    github: "https://github.com/test",
    nationality: "Canadian",
    workMode: "Remote",
  },
  content: {
    experience: [
      { id: "e1", title: "Role A", company: "Acme", startDate: "2020-01", body: "Did things" },
      { id: "e2", title: "Role B", company: "Beta", startDate: "2022-01" },
      { id: "e3", title: "Role C", company: "Gamma", startDate: "2024-01" },
    ],
  },
};

let store: Map<string, string>;

// Storage the browser will not open, as a disabled or sandboxed store behaves.
function installUnreadableStorage() {
  const denied = () => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: denied,
      setItem: denied,
      removeItem: denied,
      clear: denied,
      key: denied,
      get length() {
        return denied();
      },
    },
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  store = installLocalStorageMock();
});

describe("createDocument", () => {
  it("builds personal details from the snapshot: only present links, only present extras", () => {
    const doc = ResumeService.createDocument("resume", NOW, SNAPSHOT);
    expect(doc.personal.name).toBe("Test Person");
    expect(doc.personal.title).toBe("Engineer");
    expect(doc.personal.links!.map((l) => l.label)).toEqual([
      "Website",
      "GitHub",
    ]);
    expect(doc.personal.extra).toEqual({
      Nationality: "Canadian",
      "Work Mode": "Remote",
    });
  });

  it("populates synced sections from the snapshot's collections", () => {
    const doc = ResumeService.createDocument("resume", NOW, SNAPSHOT);
    const exp = doc.sections.find((s) => s.kind === "experience")!;
    expect(exp.entries.map((e) => String(e.sourceId))).toEqual(["e1", "e2", "e3"]);
    expect(exp.entries[0].subtitle).toBe("Acme");
  });

  it("a null snapshot yields a blank document (no entries, blank personal)", () => {
    const doc = ResumeService.createDocument("cv", NOW, null);
    expect(doc.sections.length).toBeGreaterThan(0);
    expect(doc.sections.every((s) => s.entries.length === 0)).toBe(true);
    expect(doc.personal.name).toBeUndefined();
    expect(doc.personal.links).toEqual([]);
  });

  it("resume and cv kinds differ in their default section lists", () => {
    const resume = ResumeService.createDocument("resume", NOW, SNAPSHOT);
    const cv = ResumeService.createDocument("cv", NOW, SNAPSHOT);
    const kinds = (d: ResumeDocument) => d.sections.map((s) => s.kind);
    expect(kinds(resume)).not.toEqual(kinds(cv));
    // Both are fully synced at creation.
    expect(resume.sections.every((s) => s.source === "synced")).toBe(true);
  });

  it("stamps created/updated/lastSynced with the provided time", () => {
    const doc = ResumeService.createDocument("resume", NOW, SNAPSHOT);
    expect(doc.createdAt).toBe(NOW);
    expect(doc.updatedAt).toBe(NOW);
    expect(doc.lastSyncedAt).toBe(NOW);
  });
});

describe("syncFromPortfolio", () => {
  const findSynced = (doc: ResumeDocument): ResumeSection =>
    doc.sections.find((s) => s.source === "synced" && s.entries.length > 0)!;

  it("preserves style, custom sections, per-entry hidden flags, and entry order", () => {
    const doc = ResumeService.createDocument("cv", NOW, SNAPSHOT);
    const section = findSynced(doc);
    expect(section).toBeTruthy();

    // Mutate: hide the first entry, reverse order, restyle, add custom section.
    section.entries = [...section.entries].reverse();
    section.entries[section.entries.length - 1] = {
      ...section.entries[section.entries.length - 1],
      hidden: true,
    };
    const hiddenSourceId = String(
      section.entries[section.entries.length - 1].sourceId
    );
    const orderBefore = section.entries.map((e) => String(e.sourceId));
    doc.style = { ...doc.style, accentColor: "#123456" };
    const custom: ResumeSection = {
      id: "custom-1",
      kind: "custom",
      heading: "My Custom",
      visible: true,
      source: "custom",
      entries: [{ id: "c1", title: "Kept" }],
    };
    doc.sections = [...doc.sections, custom];

    const synced = ResumeService.syncFromPortfolio(doc, NOW, SNAPSHOT);

    expect(synced.style.accentColor).toBe("#123456");
    const customAfter = synced.sections.find((s) => s.id === "custom-1")!;
    expect(customAfter).toEqual(custom);

    const sectionAfter = synced.sections.find((s) => s.id === section.id)!;
    expect(sectionAfter.entries.map((e) => String(e.sourceId))).toEqual(
      orderBefore
    );
    const hiddenAfter = sectionAfter.entries.find(
      (e) => String(e.sourceId) === hiddenSourceId
    )!;
    expect(hiddenAfter.hidden).toBe(true);
  });

  it("drops entries removed from the portfolio and appends new ones visible", () => {
    const doc = ResumeService.createDocument("resume", NOW, SNAPSHOT);
    const next: PortfolioSnapshot = {
      ...SNAPSHOT,
      content: {
        experience: [
          { id: "e2", title: "Role B (promoted)", company: "Beta" },
          { id: "e4", title: "Role D", company: "Delta" },
        ],
      },
    };
    const synced = ResumeService.syncFromPortfolio(doc, NOW, next);
    const exp = synced.sections.find((s) => s.kind === "experience")!;
    expect(exp.entries.map((e) => String(e.sourceId))).toEqual(["e2", "e4"]);
    expect(exp.entries[0].title).toBe("Role B (promoted)");
    expect(exp.entries[1].hidden).toBeUndefined();
  });

  it("refreshes personal details from the snapshot's settings", () => {
    const doc = ResumeService.createDocument("resume", NOW, SNAPSHOT);
    const renamed: PortfolioSnapshot = {
      ...SNAPSHOT,
      settings: { ...SNAPSHOT.settings, name: "Renamed Person" },
    };
    const synced = ResumeService.syncFromPortfolio(doc, NOW, renamed);
    expect(synced.personal.name).toBe("Renamed Person");
    expect(synced.lastSyncedAt).toBe(NOW);
  });
});

describe("persistence + duplicate", () => {
  it("save/list/get round-trip via os_resumes", () => {
    const doc = ResumeService.createDocument("resume", NOW, SNAPSHOT);
    ResumeService.save(doc);
    expect(store.has("os_resumes")).toBe(true);
    expect(ResumeService.get(doc.id)!.id).toBe(doc.id);
    expect(ResumeService.list()).toHaveLength(1);
  });

  it("duplicate deep-copies under a new id and '(copy)' name and persists it", () => {
    const doc = ResumeService.createDocument("resume", NOW, SNAPSHOT);
    ResumeService.save(doc);
    const copy = ResumeService.duplicate(doc.id, NOW)!;
    expect(copy.id).not.toBe(doc.id);
    expect(copy.name).toBe(`${doc.name} (copy)`);
    expect(copy.sections).toEqual(doc.sections);
    expect(ResumeService.list()).toHaveLength(2);
    // Deep copy: mutating the copy must not touch the original.
    copy.sections[0].heading = "changed";
    expect(ResumeService.get(doc.id)!.sections[0].heading).not.toBe("changed");
  });
});

describe("list and refused", () => {
  it("names a store that does not parse, with its key and the parser's reason", () => {
    store.set("os_resumes", "{not json");
    expect(ResumeService.list()).toEqual([]);
    expect(ResumeService.refused()).toEqual([
      { key: "os_resumes", reason: expect.stringMatching(/JSON/) },
    ]);
  });

  it("names a store that parses to something other than a list", () => {
    store.set("os_resumes", "{}");
    expect(ResumeService.list()).toEqual([]);
    expect(ResumeService.refused()).toEqual([
      { key: "os_resumes", reason: "The saved store is not a list of documents." },
    ]);
  });

  it("forgets the refusal once the store reads cleanly", () => {
    store.set("os_resumes", "{not json");
    ResumeService.list();
    store.set("os_resumes", "[]");
    ResumeService.list();
    expect(ResumeService.refused()).toEqual([]);
  });

  it("forgets the refusal once the store is emptied", () => {
    store.set("os_resumes", "{not json");
    ResumeService.list();
    store.delete("os_resumes");
    expect(ResumeService.list()).toEqual([]);
    expect(ResumeService.refused()).toEqual([]);
  });

  it("forgets the refusal once the whole collection is saved over it", () => {
    store.set("os_resumes", "{not json");
    ResumeService.list();
    ResumeService.saveAll([]);
    expect(store.get("os_resumes")).toBe("[]");
    expect(ResumeService.refused()).toEqual([]);
  });

  it("reads storage it cannot open as no documents and names nothing", () => {
    installUnreadableStorage();
    expect(ResumeService.list()).toEqual([]);
    expect(ResumeService.refused()).toEqual([]);
  });
});
