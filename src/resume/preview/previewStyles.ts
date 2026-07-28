// Maps a ResumeStyle into concrete CSS for the preview. Every Customize control
// resolves to something here so the preview reflects it live.

import { CSSProperties } from "react";
import { ResumeStyle } from "@/resume/types/resume";
import { FONT_OPTIONS, fontStack } from "@/resume/lib/resumeDefaults";

/** 8%-opacity tint of a #rrggbb accent over white (for page/heading fills). */
const tint = (hex: string, alpha = "14"): string =>
  /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alpha}` : "#f3f4f6";

const dims = (style: ResumeStyle) =>
  style.pageFormat === "Letter"
    ? { width: "216mm", minHeight: "279mm" }
    : { width: "210mm", minHeight: "297mm" };

/** Root page style incl. CSS custom properties used by descendants. */
export function pageStyle(style: ResumeStyle): CSSProperties {
  const background =
    style.palette === "image" && style.backgroundImage
      ? `#fff url(${style.backgroundImage}) center/cover`
      : style.colorScope === "page"
      ? tint(style.accentColor)
      : "#ffffff";

  return {
    ...dims(style),
    padding: `${style.marginY}mm ${style.marginX}mm`,
    fontFamily: fontStack(style.bodyFont),
    fontSize: `${style.baseFontSize}pt`,
    lineHeight: style.lineHeight,
    color: "#1f2937",
    background,
    borderLeft: style.colorScope === "border" ? `4px solid ${style.accentColor}` : undefined,
    ["--r-accent" as string]: style.accentColor,
    ["--r-name-size" as string]: `${style.baseFontSize + style.nameFontSize}pt`,
    ["--r-heading-size" as string]: `${style.baseFontSize + style.headingFontSize}pt`,
    ["--r-entry-size" as string]: `${style.baseFontSize + style.entryHeaderFontSize}pt`,
    ["--r-gap" as string]: `${style.elementSpacing}px`,
  } as CSSProperties;
}

const a = (style: ResumeStyle, on: boolean): string | undefined =>
  on ? style.accentColor : undefined;

export const nameStyle = (style: ResumeStyle): CSSProperties => ({
  fontSize: "var(--r-name-size)",
  fontWeight: 700,
  fontFamily: style.nameFont ? fontStack(style.nameFont) : undefined,
  color: a(style, style.accentApply.name),
  lineHeight: 1.1,
});

export const jobTitleStyle = (style: ResumeStyle): CSSProperties => ({
  color: a(style, style.accentApply.jobTitle),
});

/** Section heading (h2): combines case, accent, and the 6 decoration variants. */
export function headingStyle(style: ResumeStyle): CSSProperties {
  const lineColor = style.accentApply.headingsLine ? style.accentColor : "#cbd5e1";
  const base: CSSProperties = {
    fontSize: "var(--r-heading-size)",
    fontWeight: 700,
    textTransform: style.headingCase === "uppercase" ? "uppercase" : "capitalize",
    letterSpacing: style.headingCase === "uppercase" ? "0.04em" : undefined,
    color: a(style, style.accentApply.headings),
    marginBottom: "4px",
    display: "block",
  };
  switch (style.headingStyle) {
    case 1:
      return { ...base, borderBottom: `1.5px solid ${lineColor}`, paddingBottom: "2px" };
    case 2:
      return { ...base, display: "inline-block", borderBottom: `2px solid ${lineColor}`, paddingBottom: "1px" };
    case 3:
      return base; // plain
    case 4:
      return { ...base, borderTop: `1px solid ${lineColor}`, borderBottom: `1px solid ${lineColor}`, padding: "2px 0" };
    case 5:
      return { ...base, background: tint(style.accentColor, "1f"), padding: "2px 6px", borderRadius: "3px", color: a(style, style.accentApply.headings) };
    case 6:
      return { ...base, borderLeft: `3px solid ${style.accentColor}`, paddingLeft: "6px" };
    default:
      return base;
  }
}

export const subtitleStyle = (style: ResumeStyle): CSSProperties => ({
  fontWeight: style.subtitleStyle === "bold" ? 600 : 400,
  fontStyle: style.subtitleStyle === "italic" ? "italic" : "normal",
  color: a(style, style.accentApply.subtitle),
});

export const dateStyle = (style: ResumeStyle): CSSProperties => ({
  color: a(style, style.accentApply.dates) || "#4b5563",
  fontSize: "0.85em",
  whiteSpace: "nowrap",
});

export const entryHeaderStyle = (_style: ResumeStyle): CSSProperties => ({
  fontSize: "var(--r-entry-size)",
  fontWeight: 600,
});

export const linkStyle = (style: ResumeStyle): CSSProperties => ({
  color: style.linkColored ? style.accentColor : "inherit",
  textDecoration: style.linkUnderline ? "underline" : "none",
});

export const descriptionClass = (style: ResumeStyle): string =>
  `resume-prose${style.listStyle === "hyphen" ? " list-hyphen" : ""}`;

export const descriptionStyle = (style: ResumeStyle): CSSProperties => ({
  marginLeft: style.indentBody ? "0.9em" : undefined,
});

/** Body wrapper: implements one / two / mix columns. */
export function bodyStyle(style: ResumeStyle): CSSProperties {
  if (style.columns === "one") return {};
  return {
    columnCount: 2,
    columnGap: "10mm",
  };
}

export const sectionStyle = (_style: ResumeStyle): CSSProperties => ({
  marginBottom: "var(--r-gap)",
  breakInside: "avoid",
});

let loadedFonts = "";
/** Inject a Google Fonts <link> for the chosen body/name fonts (once). */
export function loadFonts(bodyFont: string, nameFont: string) {
  const families = [bodyFont, nameFont]
    .filter(Boolean)
    .map((label) => FONT_OPTIONS.find((f) => f.label === label)?.google)
    .filter(Boolean) as string[];
  if (families.length === 0) return;
  const key = families.sort().join("|");
  if (key === loadedFonts) return;
  loadedFonts = key;

  const id = "resume-fonts";
  let link = document.getElementById(id) as HTMLLinkElement | null;
  const href = `https://fonts.googleapis.com/css2?${families
    .map((f) => `family=${f}`)
    .join("&")}&display=swap`;
  if (!link) {
    link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = href;
}
