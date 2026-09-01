import { describe, expect, it } from "vitest";
import { localizeHeading, placeDateLine, relocalizeSections, setDocumentLanguage } from "@/entities/resume/headings";
import { REGION_PRESETS, applyRegion } from "@/entities/resume/regions";
import { DEFAULT_STYLE, SECTION_CATALOG } from "@/entities/resume/defaults";
import { ResumeDocument, ResumeSection } from "@/entities/resume/model";

const section = (heading: string): ResumeSection => ({
  id: `sec-${heading}`,
  kind: "experience",
  heading,
  visible: true,
  source: "synced",
  entries: [],
});

const doc = (sections: ResumeSection[], language = "English"): ResumeDocument => ({
  id: "d",
  name: "Doc",
  kind: "resume",
  createdAt: "",
  updatedAt: "",
  lastSyncedAt: "",
  personal: { name: "Test" },
  sections,
  style: { ...DEFAULT_STYLE, language },
});

describe("localizeHeading", () => {
  it("translates every catalog default into every supported language and back", () => {
    const languages = ["German", "French", "Spanish", "Turkish", "Azerbaijani"];
    for (const meta of Object.values(SECTION_CATALOG)) {
      for (const language of languages) {
        // Some forms coincide across languages (French "Notes"), so the
        // round trip is the invariant, not the change of text.
        const translated = localizeHeading(meta.defaultHeading, language);
        expect(localizeHeading(translated, "English"), `${meta.defaultHeading} via ${language}`).toBe(meta.defaultHeading);
      }
    }
  });

  it("reads both Englishes as the same English", () => {
    expect(localizeHeading("Berufserfahrung", "English (UK)")).toBe("Experience");
    expect(localizeHeading("Experience", "English (UK)")).toBe("Experience");
  });

  it("carries a translation straight to a third language", () => {
    expect(localizeHeading("Ausbildung", "French")).toBe("Formation");
  });

  it("leaves an owner's own heading alone", () => {
    expect(localizeHeading("Things I Am Proud Of", "German")).toBe("Things I Am Proud Of");
  });

  it("knows the field overlays' variants", () => {
    expect(localizeHeading("Research Projects", "Spanish")).toBe("Proyectos de investigación");
    expect(localizeHeading("Selected Publications", "Turkish")).toBe("Seçilmiş Yayınlar");
  });
});

describe("setDocumentLanguage and relocalizeSections", () => {
  it("translates known headings and keeps custom ones, without mutating", () => {
    const input = doc([section("Experience"), section("My Own Heading")]);
    const out = setDocumentLanguage(input, "German");
    expect(out.style.language).toBe("German");
    expect(out.sections.map((s) => s.heading)).toEqual(["Berufserfahrung", "My Own Heading"]);
    expect(input.sections[0].heading).toBe("Experience");
  });

  it("returns the same section object when nothing changes", () => {
    const [s] = relocalizeSections([section("Custom")], "French");
    expect(s.heading).toBe("Custom");
  });
});

describe("regions carry headings with their language", () => {
  it("Germany translates the headings and writes a German signature block", () => {
    const out = applyRegion(doc([section("Experience")]), REGION_PRESETS.find((p) => p.key === "germany")!);
    expect(out.sections[0].heading).toBe("Berufserfahrung");
    const signature = out.sections[out.sections.length - 1];
    expect(signature.heading).toBe("Unterschrift");
    expect(signature.entries[0].description).toContain(placeDateLine("German"));
  });

  it("Canada brings German headings back to English", () => {
    const german = doc([section("Berufserfahrung")], "German");
    const out = applyRegion(german, REGION_PRESETS.find((p) => p.key === "canada")!);
    expect(out.sections[0].heading).toBe("Experience");
  });
});

describe("field overlays respect the document language", () => {
  it("writes the overlay's headings in the document's language", async () => {
    const { FIELD_OVERLAYS, applyField } = await import("@/entities/resume/regions");
    const german = doc([{ ...section("Ausgewählte Projekte"), kind: "projects" }], "German");
    const out = applyField(german, FIELD_OVERLAYS.find((o) => o.key === "academic")!);
    expect(out.sections[0].heading).toBe("Forschungsprojekte");
  });
});
