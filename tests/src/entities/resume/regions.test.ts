import { describe, expect, it } from "vitest";
import {
  FIELD_OVERLAYS,
  REGION_PRESETS,
  SIGNATURE_SECTION_ID,
  applyField,
  applyRegion,
} from "@/entities/resume/regions";
import { DEFAULT_STYLE } from "@/entities/resume/defaults";
import { ResumeDocument, ResumeSection } from "@/entities/resume/model";

const preset = (key: string) => REGION_PRESETS.find((p) => p.key === key)!;
const overlay = (key: string) => FIELD_OVERLAYS.find((o) => o.key === key)!;

const section = (kind: ResumeSection["kind"], count: number, heading: string = kind): ResumeSection => ({
  id: `sec-${kind}`,
  kind,
  heading,
  visible: true,
  source: "synced",
  entries: Array.from({ length: count }, (_, i) => ({ id: `${kind}-${i}` })),
});

const doc = (over: Partial<ResumeDocument> = {}): ResumeDocument => ({
  id: "d",
  name: "Doc",
  kind: "resume",
  createdAt: "",
  updatedAt: "",
  lastSyncedAt: "",
  personal: { name: "Test", extra: { "Date of Birth": "1990-01", Nationality: "Tester", Availability: "Now" } },
  sections: [section("summary", 1), section("experience", 6), section("publications", 5, "Selected Publications")],
  style: { ...DEFAULT_STYLE, showPhoto: true, pageFormat: "A4" },
  ...over,
});

describe("applyRegion", () => {
  it("drops protected chips and turns the photo off for Canada, on Letter", () => {
    const out = applyRegion(doc(), preset("canada"));
    expect(out.style.pageFormat).toBe("Letter");
    expect(out.style.showPhoto).toBe(false);
    expect(out.style.region).toBe("canada");
    expect(Object.keys(out.personal.extra!)).toEqual(["Availability"]);
  });

  it("adds Germany's expected chips empty, keeps existing values, and appends one signature block", () => {
    const out = applyRegion(doc({ personal: { name: "Test", extra: { Availability: "Now" } } }), preset("germany"));
    expect(out.personal.extra).toEqual({ Availability: "Now", "Date of Birth": "", Nationality: "" });
    expect(out.style.showPhoto).toBe(true);
    expect(out.style.language).toBe("German");
    expect(out.sections.filter((s) => s.id === SIGNATURE_SECTION_ID)).toHaveLength(1);
    const again = applyRegion(out, preset("germany"));
    expect(again.sections.filter((s) => s.id === SIGNATURE_SECTION_ID)).toHaveLength(1);
  });

  it("removes the signature block when a region without one follows", () => {
    const german = applyRegion(doc(), preset("germany"));
    const british = applyRegion(german, preset("united-kingdom"));
    expect(british.sections.some((s) => s.id === SIGNATURE_SECTION_ID)).toBe(false);
    expect(british.style.language).toBe("English (UK)");
  });

  it("never mutates the input", () => {
    const input = doc();
    applyRegion(input, preset("canada"));
    expect(input.personal.extra).toHaveProperty("Nationality");
    expect(input.style.showPhoto).toBe(true);
  });
});

describe("applyField", () => {
  it("academic puts education before experience, lifts limits, and renames publications", () => {
    const input = doc({
      sections: [
        section("experience", 6),
        section("education", 4),
        { ...section("publications", 5, "Selected Publications"), entries: [{ id: "p0" }, { id: "p1", hidden: true }] },
      ],
    });
    const out = applyField(input, overlay("academic"));
    expect(out.sections.map((s) => s.kind)).toEqual(["education", "experience", "publications"]);
    expect(out.sections[2].heading).toBe("Publications");
    expect(out.sections[2].entries.every((e) => e.hidden === false)).toBe(true);
    expect(out.style.field).toBe("academic");
  });

  it("industry leads with experience and re-applies the résumé limits", () => {
    const out = applyField(doc({ sections: [section("education", 5), section("experience", 6), section("skills", 1)] }), overlay("industry"));
    expect(out.sections.map((s) => s.kind)).toEqual(["experience", "skills", "education"]);
    const experience = out.sections[0].entries;
    expect(experience.filter((e) => !e.hidden)).toHaveLength(4);
    expect(out.sections[2].entries.filter((e) => !e.hidden)).toHaveLength(3);
  });

  it("keeps unlisted kinds in their relative order after the listed ones", () => {
    const out = applyField(doc({ sections: [section("custom", 1), section("summary", 1)] }), overlay("industry"));
    expect(out.sections.map((s) => s.kind)).toEqual(["summary", "custom"]);
  });
});
