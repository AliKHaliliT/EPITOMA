// Persistence + sync for resume/CV documents.
//
// Documents live in localStorage under `os_resumes`. They are built from an
// imported portfolio snapshot (see portfolio/source.ts) via resumeDefaults.
// "Sync" refreshes the synced content from the snapshot while preserving
// structure (custom sections, order, headings, per-entry hidden/order) and
// style. A null snapshot builds/keeps a blank document.

import { safeSetItem } from "@/shared/lib";
import { PortfolioSettings, PortfolioSnapshot } from "@/shared/contract";
import {
  DocumentKind,
  PersonalDetails,
  ResumeDocument,
  ResumeEntry,
  ResumeSection,
} from "./model";
import {
  DEFAULT_STYLE,
  buildEntries,
  buildSections,
} from "./defaults";

const STORAGE_KEY = "os_resumes";

let idSeq = 0;
const newId = (now: number) => `doc-${now}-${idSeq++}`;

/** Build the header (personal details) from the snapshot's settings. */
function buildPersonal(settings: PortfolioSettings): PersonalDetails {
  const links: PersonalDetails["links"] = [];
  const push = (label: string, url: string | undefined, icon: string) => {
    if (url) links.push({ label, url, icon });
  };
  push("Website", settings.website, "Globe");
  push("GitHub", settings.github, "Github");
  push("LinkedIn", settings.linkedin, "Linkedin");
  push("Twitter", settings.twitter, "Twitter");
  push("Scholar", settings.scholar, "GraduationCap");
  push("Medium", settings.medium, "BookOpen");
  push("ORCID", settings.orcid, "Link2");

  const extra: Record<string, string> = {};
  if (settings.nationality) extra.Nationality = settings.nationality;
  if (settings.dateOfBirth) extra["Date of Birth"] = settings.dateOfBirth;
  if (settings.availability) extra.Availability = settings.availability;
  if (settings.workMode) extra["Work Mode"] = settings.workMode;

  return {
    name: settings.name,
    title: settings.role,
    location: settings.location,
    email: settings.email,
    phone: settings.phone,
    photo: settings.avatar,
    links,
    extra,
  };
}

/** Merge freshly-built website entries into an existing synced section,
 *  preserving per-entry `hidden` flag and relative order via `sourceId`. */
function mergeEntries(existing: ResumeEntry[], fresh: ResumeEntry[]): ResumeEntry[] {
  const freshById = new Map(fresh.map((e) => [String(e.sourceId), e]));
  const seen = new Set<string>();
  const merged: ResumeEntry[] = [];

  // Keep surviving entries in their current order, refreshed with fresh data.
  for (const old of existing) {
    const key = String(old.sourceId);
    const updated = freshById.get(key);
    if (updated) {
      merged.push({ ...updated, id: old.id, hidden: old.hidden });
      seen.add(key);
    }
    // else: source removed from the website → drop it.
  }
  // Append newly-found website items (visible by default).
  for (const f of fresh) {
    if (!seen.has(String(f.sourceId))) merged.push(f);
  }
  return merged;
}

export const ResumeService = {
  list(): ResumeDocument[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load resumes", e);
    }
    return [];
  },

  saveAll(docs: ResumeDocument[]) {
    safeSetItem(STORAGE_KEY, JSON.stringify(docs));
  },

  get(id: string): ResumeDocument | undefined {
    return ResumeService.list().find((d) => d.id === id);
  },

  save(doc: ResumeDocument) {
    const docs = ResumeService.list();
    const idx = docs.findIndex((d) => d.id === doc.id);
    const next = { ...doc, updatedAt: new Date().toISOString() };
    if (idx >= 0) docs[idx] = next;
    else docs.unshift(next);
    ResumeService.saveAll(docs);
  },

  remove(id: string) {
    ResumeService.saveAll(ResumeService.list().filter((d) => d.id !== id));
  },

  /** Create a fresh document of the given kind, populated from the imported
   *  portfolio snapshot (blank when none has been imported yet). */
  createDocument(
    kind: DocumentKind,
    nowIso: string,
    snapshot: PortfolioSnapshot | null
  ): ResumeDocument {
    const now = new Date(nowIso).getTime() || 0;
    const dateLabel = new Date(nowIso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const doc: ResumeDocument = {
      id: newId(now),
      name: `${kind === "cv" ? "CV" : "Resume"}: ${dateLabel}`,
      kind,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastSyncedAt: nowIso,
      personal: buildPersonal(snapshot?.settings ?? {}),
      sections: buildSections(kind, snapshot),
      style: { ...DEFAULT_STYLE },
    };
    return doc;
  },

  /** Pure deep copy under a new id/name: no storage access. */
  cloneDocument(src: ResumeDocument, nowIso: string): ResumeDocument {
    const now = new Date(nowIso).getTime() || 0;
    return {
      ...structuredClone(src),
      id: newId(now),
      name: `${src.name} (copy)`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  },

  /** Duplicate a stored document under a new id/name and persist it. */
  duplicate(id: string, nowIso: string): ResumeDocument | undefined {
    const src = ResumeService.get(id);
    if (!src) return undefined;
    const copy = ResumeService.cloneDocument(src, nowIso);
    ResumeService.save(copy);
    return copy;
  },

  /** Refresh synced content from the portfolio snapshot; preserve structure
   *  + style. */
  syncFromPortfolio(
    doc: ResumeDocument,
    nowIso: string,
    snapshot: PortfolioSnapshot
  ): ResumeDocument {
    const sections: ResumeSection[] = doc.sections.map((section) => {
      if (section.source !== "synced") return section; // custom untouched
      const fresh = buildEntries(section.kind, snapshot);
      return { ...section, entries: mergeEntries(section.entries, fresh) };
    });
    return {
      ...doc,
      personal: buildPersonal(snapshot.settings),
      sections,
      lastSyncedAt: nowIso,
      updatedAt: nowIso,
    };
  },
};
