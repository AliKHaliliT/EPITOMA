// Pins the export layout contract and both structural renderers to it, so a
// style setting cannot silently mean different things in different formats.

import { describe, expect, it } from "vitest";
import { sampleDocument } from "@/entities/resume/defaults";
import {
  proficiencyDots,
  resolveColors,
  resolveEntry,
  resolveGeometry,
  resolveHeading,
  sectionShape,
  splitRegions,
} from "@/entities/resume/layout";
import { documentToLatex } from "@/features/export-document/latex";
import { documentToWordHtml } from "@/features/export-document/word";

const doc = (patch: Parameters<typeof sampleDocument>[0] = {}) => sampleDocument(patch);

describe("layout contract", () => {
  it("resolves sidebar geometry consistently", () => {
    const g = resolveGeometry(doc({ columns: "sidebar", pageFormat: "A4", marginX: 16 }).style);
    expect(g.pageWmm).toBe(210);
    expect(g.contentWmm).toBe(210 - 32);
    expect(g.railWmm).toBeCloseTo((210 - 32) * 0.34, 3);
    expect(g.mainWmm).toBeCloseTo(g.contentWmm - g.railWmm - g.railGapMm, 3);
  });

  it("splits regions only in sidebar mode", () => {
    const d = doc({ columns: "sidebar" });
    const split = splitRegions(d.style, d.sections);
    expect(split.side.map((s) => s.kind)).toContain("skills");
    expect(split.main.map((s) => s.kind)).toContain("experience");
    const one = splitRegions(doc({ columns: "one" }).style, d.sections);
    expect(one.side).toHaveLength(0);
  });

  it("maps heading styles to decorations", () => {
    expect(resolveHeading(doc({ headingStyle: 1 }).style).deco).toBe("rule");
    expect(resolveHeading(doc({ headingStyle: 5 }).style).deco).toBe("fill");
    expect(resolveHeading(doc({ headingStyle: 6 }).style).deco).toBe("edge");
  });

  it("makes entry layout 3 inline and layout 1 date-right", () => {
    expect(resolveEntry(doc({ entryLayout: 3, subtitlePlacement: "next" }).style).subtitleInline).toBe(true);
    expect(resolveEntry(doc({ entryLayout: 1, subtitlePlacement: "next" }).style).subtitleInline).toBe(false);
  });

  it("derives dark-rail ink from the fill", () => {
    const dark = resolveColors(doc({ columns: "sidebar", headerFillColor: "#134e4a" }).style);
    expect(dark.railInk).toBe("#f8fafc");
    const light = resolveColors(doc({ columns: "sidebar", headerFillColor: "" }).style);
    expect(light.railInk).toBeNull();
  });

  it("shapes sections by kind + layout", () => {
    const d = doc();
    const langs = d.sections.find((s) => s.kind === "languages")!;
    expect(sectionShape(langs)).toBe("lang-list");
    expect(sectionShape({ ...langs, layout: "dots" })).toBe("lang-dots");
    const certs = d.sections.find((s) => s.kind === "certificates")!;
    expect(sectionShape(certs)).toBe("entry-rows");
  });

  it("reads proficiency words as ratings", () => {
    expect(proficiencyDots("Native")).toBe(5);
    expect(proficiencyDots("B2")).toBe(3);
    expect(proficiencyDots("A1 beginner")).toBe(1);
  });
});

describe("LaTeX renderer follows the contract", () => {
  it("carries geometry, colors, and paper", () => {
    const tex = documentToLatex(doc({ pageFormat: "Letter", marginX: 14, marginY: 12, accentColor: "#0f766e" }));
    expect(tex).toContain("letterpaper");
    expect(tex).toContain("left=14mm");
    expect(tex).toContain("top=12mm");
    expect(tex).toContain("\\definecolor{accent}{HTML}{0F766E}");
  });

  it("renders the sidebar with paracol and the rail fill", () => {
    const tex = documentToLatex(doc({ columns: "sidebar", headerFillColor: "#134e4a" }));
    expect(tex).toContain("\\usepackage{paracol}");
    expect(tex).toContain("\\backgroundcolor{c[1]}[HTML]{134E4A}");
    expect(tex).toContain("\\color{railink}");
  });

  it("renders language dots as filled and hollow bullets", () => {
    const d = doc();
    const langs = d.sections.find((s) => s.kind === "languages")!;
    langs.layout = "dots";
    const tex = documentToLatex(d);
    // Deepcant is B2 → three filled, two hollow.
    expect(tex).toContain("$\\bullet$$\\bullet$$\\bullet$$\\circ$$\\circ$");
  });

  it("composes one-line entries inline with a trailing date", () => {
    const tex = documentToLatex(doc({ entryLayout: 3 }));
    expect(tex).toMatch(/Guild Artificer.*·.*Artificers' Guild.*·.*Cinderfen.*---/s);
  });

  it("uppercases headings when the style says so", () => {
    const tex = documentToLatex(doc({ headingCase: "uppercase" }));
    expect(tex).toContain("\\ressection{EXPERIENCE}");
  });

  it("never emits an \\href with a placeholder or raw-# target", () => {
    // The sample's links use "#": a raw # inside \href is a compile error
    // ("Illegal parameter number"). Placeholders must render as plain text.
    const tex = documentToLatex(doc({}));
    expect(tex).not.toContain("\\href{#}");
    expect(tex).not.toMatch(/\\href\{[^}]*(?<!\\)#/);
  });
});

describe("Word renderer follows the contract", () => {
  it("sets the page geometry and fonts", () => {
    const html = documentToWordHtml(doc({ pageFormat: "A5", marginX: 10, marginY: 10, bodyFont: "Lato" }));
    expect(html).toContain("margin: 10mm 10mm");
    expect(html).toContain("'Lato'");
    // A5: 148 × 210 mm → pt
    expect(html).toContain(`size: ${(148 * 2.8346).toFixed(1)}pt ${(210 * 2.8346).toFixed(1)}pt`);
  });

  it("builds the sidebar as a shaded table rail", () => {
    const html = documentToWordHtml(doc({ columns: "sidebar", headerFillColor: "#134e4a" }));
    expect(html).toContain("background:#134e4a");
    expect(html).toContain("color:#f8fafc");
    expect(html).toMatch(/<td[^>]*width="34%"/);
  });

  it("renders dates right via tables, not flexbox", () => {
    const html = documentToWordHtml(doc({ entryLayout: 1 }));
    expect(html).toContain('align="right"');
    expect(html).not.toContain("display:flex");
  });

  it("emits the mso footer with page number fields", () => {
    const html = documentToWordHtml(doc({ footerText: "Refs on request", showPageNumbers: true }));
    expect(html).toContain("mso-element:footer");
    expect(html).toContain("mso-field-code:PAGE");
    expect(html).toContain("Refs on request");
  });

  it("paints the header band with flipped ink when dark", () => {
    const html = documentToWordHtml(doc({ colorScope: "header", headerFillColor: "#111827" }));
    expect(html).toContain("background:#111827");
    expect(html).toContain("color:#f8fafc");
  });
});
