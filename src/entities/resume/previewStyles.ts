// Maps a ResumeStyle into concrete CSS for the preview. Every Customize control
// resolves to something here so the preview reflects it live.

import { CSSProperties } from "react";
import { PAGE_DIMS, ResumeStyle } from "./model";
import { FONT_OPTIONS, fontStack } from "./defaults";

/** Opaque tint: the accent blended over WHITE, so a tinted page or heading
 *  is a solid color. A translucent tint would let the app's dark theme bleed
 *  through the sheet, which must always read as paper. */
export const tint = (hex: string, alpha = 0.08): string => {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "#f3f4f6";
  const ch = (i: number) =>
    Math.round(parseInt(hex.slice(i, i + 2), 16) * alpha + 255 * (1 - alpha))
      .toString(16)
      .padStart(2, "0");
  return `#${ch(1)}${ch(3)}${ch(5)}`;
};

const dims = (style: ResumeStyle) => {
  const d = PAGE_DIMS[style.pageFormat] ?? PAGE_DIMS.A4;
  return { width: `${d.w}mm`, minHeight: `${d.h}mm` };
};

/** Perceived lightness of a hex color, 0..1 (for flipping type on fills). */
export const luminance = (hex: string): number => {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return 1;
  const c = (i: number) => parseInt(hex.slice(i, i + 2), 16) / 255;
  return 0.299 * c(1) + 0.587 * c(3) + 0.114 * c(5);
};

/** The sidebar rail's fill and type colors. The fill doubles with the header
 *  band's control; dark fills flip the rail's ink to light. */
export function railColors(style: ResumeStyle): { bg: string; ink?: string; muted?: string } {
  const bg = style.headerFillColor || tint(style.accentColor);
  if (luminance(bg) < 0.55) {
    return { bg, ink: "#f8fafc", muted: "rgba(248,250,252,0.72)" };
  }
  return { bg };
}

/** Rail width as a fraction of the content width (between the margins). */
export const RAIL_FRAC = 0.34;

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
      return { ...base, background: tint(style.accentColor, 0.12), padding: "2px 6px", borderRadius: "3px", color: a(style, style.accentApply.headings) };
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
  // The fallback rides a CSS variable so a dark sidebar rail can lift it.
  color: a(style, style.accentApply.dates) || "var(--r-muted, #4b5563)",
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

const loadedFamilies = new Set<string>();
/** Inject a Google Fonts <link> for the chosen fonts. Cumulative: template
 *  thumbnails render many families at once, so requested fonts stay loaded. */
export function loadFonts(bodyFont: string, nameFont: string) {
  const families = [bodyFont, nameFont]
    .filter(Boolean)
    .map((label) => FONT_OPTIONS.find((f) => f.label === label)?.google)
    .filter(Boolean) as string[];
  const before = loadedFamilies.size;
  families.forEach((f) => loadedFamilies.add(f));
  if (loadedFamilies.size === before || loadedFamilies.size === 0) return;

  const id = "resume-fonts";
  let link = document.getElementById(id) as HTMLLinkElement | null;
  const href = `https://fonts.googleapis.com/css2?${[...loadedFamilies]
    .sort()
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
