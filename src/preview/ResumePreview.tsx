// Live page preview of a resume document, fully driven by doc.style.

import { useEffect, useRef, useState } from "react";
import {
  Mail, Phone, MapPin, Globe, Github, Linkedin, Twitter, GraduationCap,
  BookOpen, Link2, ExternalLink, type LucideIcon,
} from "lucide-react";
import { PAGE_DIMS, ResumeDocument, ResumeEntry, ResumeSection, ResumeStyle } from "@/types/resume";
import { fmtResumeDate, languageLocale, presentWord } from "@/lib/resumeDates";
import { iconByName } from "../icons";
import {
  pageStyle, nameStyle, jobTitleStyle, headingStyle, subtitleStyle, dateStyle,
  entryHeaderStyle, linkStyle, descriptionClass, descriptionStyle, bodyStyle,
  sectionStyle, loadFonts, tint,
} from "./previewStyles";

const CONTACT_ICONS: Record<string, LucideIcon> = {
  Globe, Github, Linkedin, Twitter, GraduationCap, BookOpen, Link2,
};

// ── date formatting (honours style.dateFormat + style.language) ─────────────
const range = (s: string | undefined, e: string | undefined, style: ResumeStyle) => {
  const f = (d: string | undefined) => fmtResumeDate(d, style.dateFormat, style.language);
  if (!s && !e) return "";
  if (s && e) return `${f(s)} – ${f(e)}`;
  if (s && !e) return `${f(s)} – ${presentWord(style.language)}`;
  return f(e);
};

function Desc({ html, style }: { html?: string; style: ResumeStyle }) {
  if (!html) return null;
  return (
    <div
      className={descriptionClass(style)}
      style={{ ...descriptionStyle(style), fontSize: "0.92em", marginTop: "1px" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function LinkIcon({ style }: { style: ResumeStyle }) {
  if (!style.linkIcon) return null;
  const I = style.linkIconStyle === "chain" ? Link2 : ExternalLink;
  return <I size={10} className="inline ml-0.5 align-baseline" style={{ color: style.accentApply.linkIcons ? style.accentColor : undefined }} />;
}

function EntryRow({ entry, style }: { entry: ResumeEntry; style: ResumeStyle }) {
  const dates = range(entry.startDate, entry.endDate, style);
  const dateRight = style.entryLayout === 1 || style.entryLayout === 3;
  const subtitleInline = style.subtitlePlacement === "same" || style.entryLayout === 3;

  const titleEl = entry.title && (
    <span style={entryHeaderStyle(style)}>
      {entry.link ? (
        <a href={entry.link} target="_blank" rel="noreferrer" style={linkStyle(style)}>
          {entry.title}
          <LinkIcon style={style} />
        </a>
      ) : (
        entry.title
      )}
    </span>
  );
  const subtitleEl = entry.subtitle && (
    <span style={subtitleStyle(style)}>
      {subtitleInline ? " · " : ""}
      {entry.subtitle}
    </span>
  );

  return (
    <div style={{ marginBottom: "var(--r-gap)" }}>
      <div className={dateRight ? "flex justify-between items-baseline gap-3" : ""}>
        <div className="min-w-0">
          {titleEl}
          {subtitleInline && subtitleEl}
          {!subtitleInline && <div>{subtitleEl}</div>}
        </div>
        {dates && <span style={dateStyle(style)}>{dates}</span>}
      </div>
      {entry.location && <div style={{ fontSize: "0.85em", color: "#6b7280" }}>{entry.location}</div>}
      <Desc html={entry.description} style={style} />
    </div>
  );
}

function SectionBody({ section, style }: { section: ResumeSection; style: ResumeStyle }) {
  const visible = section.entries.filter((e) => !e.hidden);
  if (visible.length === 0) return <p style={{ opacity: 0.4, fontSize: "0.85em", fontStyle: "italic" }}>No entries.</p>;

  const kind = section.customType === "skill" ? "skills" : section.kind;
  const layout = section.layout || "list";

  switch (kind) {
    case "summary":
    case "declaration":
      return <Desc html={visible[0]?.description} style={style} />;

    case "skills":
      if (layout === "bubble") {
        return (
          <div className="flex flex-wrap gap-1.5">
            {visible.flatMap((e) =>
              ((e.meta?.items as string[]) || [e.title || ""]).map((it, i) => (
                <span key={e.id + i} className="px-2 py-0.5 rounded-full" style={{ background: `${style.accentColor}1f` }}>
                  {it}
                </span>
              ))
            )}
          </div>
        );
      }
      return (
        <div className="space-y-0.5">
          {visible.map((e) => (
            <div key={e.id} className="flex flex-wrap items-baseline gap-x-2">
              <span style={{ fontWeight: 600 }}>{e.title}:</span>
              <span style={{ opacity: 0.85 }}>{(e.meta?.items as string[] | undefined)?.join(", ")}</span>
            </div>
          ))}
        </div>
      );

    case "languages":
      if (layout === "grid") {
        return (
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
            {visible.map((e) => (
              <span key={e.id}>
                <span style={{ fontWeight: 600 }}>{e.title}</span>
                {e.subtitle && <span style={{ opacity: 0.75 }}> · {e.subtitle}</span>}
              </span>
            ))}
          </div>
        );
      }
      return (
        <div className="flex flex-wrap gap-x-6 gap-y-0.5">
          {visible.map((e) => (
            <span key={e.id}>
              <span style={{ fontWeight: 600 }}>{e.title}</span>
              {e.subtitle && <span style={{ opacity: 0.75 }}> · {e.subtitle}</span>}
            </span>
          ))}
        </div>
      );

    case "interests":
      return (
        <div className="flex flex-wrap gap-1.5">
          {visible.map((e) => (
            <span key={e.id} className="px-2 py-0.5 rounded-full" style={{ border: "1px solid #d1d5db", fontSize: "0.85em" }}>
              {e.title}
            </span>
          ))}
        </div>
      );

    case "blog":
    case "garden":
      return (
        <ul className="space-y-0.5">
          {visible.map((e) => (
            <li key={e.id} className="flex justify-between items-baseline gap-3">
              <a href={e.link} target="_blank" rel="noreferrer" style={linkStyle(style)}>
                {e.title}
                <LinkIcon style={style} />
              </a>
              {e.startDate && <span style={dateStyle(style)}>{fmtResumeDate(e.startDate, style.dateFormat, style.language)}</span>}
            </li>
          ))}
        </ul>
      );

    case "references":
      return (
        <div className={layout === "rows" ? "space-y-2" : "grid grid-cols-2 gap-3"}>
          {visible.map((e) => (
            <div key={e.id}>
              <div style={entryHeaderStyle(style)}>{e.title}</div>
              {e.subtitle && <div style={{ ...subtitleStyle(style), fontSize: "0.9em" }}>{e.subtitle}</div>}
              {(e.meta?.organization as string) && <div style={{ fontSize: "0.85em", color: "#6b7280" }}>{e.meta?.organization as string}</div>}
              {(e.meta?.email as string) && <div style={{ fontSize: "0.85em", color: "#6b7280" }}>{e.meta?.email as string}</div>}
            </div>
          ))}
        </div>
      );

    default: {
      const wrapCls = layout === "grid" ? "grid grid-cols-2 gap-x-4" : "";
      return (
        <div className={wrapCls}>
          {visible.map((e) => (
            <EntryRow key={e.id} entry={e} style={style} />
          ))}
        </div>
      );
    }
  }
}

const MM_TO_PX = 96 / 25.4; // CSS reference pixel: 96 per inch, 25.4mm per inch

/** The bare rendered sheet: the whole document, no chrome. The live preview
 *  wraps it with a toolbar and cut guides; template thumbnails render it at
 *  small scale with sample content. */
export const ResumeSheet = ({ doc, live, onPageCount }: {
  doc: ResumeDocument;
  /** Marks the sheet exports may grab (thumbnails never set it). */
  live?: boolean;
  onPageCount?: (n: number) => void;
}) => {
  const { personal, style } = doc;
  const sections = doc.sections.filter((s) => s.visible);
  const contentRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [pages, setPages] = useState(1);
  const pageHmm = (PAGE_DIMS[style.pageFormat] ?? PAGE_DIMS.A4).h;

  useEffect(() => {
    loadFonts(style.bodyFont, style.nameFont);
  }, [style.bodyFont, style.nameFont]);

  // The sheet is always a whole number of pages tall: content is measured,
  // the count is derived, and the footer pins to the final page's bottom.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => {
      const footerH = footerRef.current?.offsetHeight ?? 0;
      const padY = style.marginY * 2 * MM_TO_PX;
      const natural = el.offsetHeight + footerH + padY;
      const n = Math.max(1, Math.ceil((natural - 1) / (pageHmm * MM_TO_PX)));
      setPages(n);
      onPageCount?.(n);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageHmm, style.marginY, style.footerText, onPageCount]);

  const headerAlign = style.headerAlign === "center" ? "center" : "left";
  const sep = style.headerDetails === "bar" ? "|" : style.headerDetails === "bullet" ? "•" : "";

  const contactItems: { icon?: LucideIcon; node: React.ReactNode; key: string }[] = [];
  if (personal.location) contactItems.push({ icon: MapPin, node: personal.location, key: "loc" });
  if (personal.email) contactItems.push({ icon: Mail, node: personal.email, key: "email" });
  if (personal.phone) contactItems.push({ icon: Phone, node: personal.phone, key: "phone" });
  personal.links?.forEach((l) =>
    contactItems.push({
      icon: CONTACT_ICONS[l.icon] || Link2,
      node: (
        <a href={l.url} target="_blank" rel="noreferrer" style={linkStyle(style)}>
          {l.label}
        </a>
      ),
      key: l.label,
    })
  );

  const showIcons = style.headerDetails === "icon";
  const iconColor = style.accentApply.headerIcons ? style.accentColor : "#6b7280";

  return (
    <div
      {...(live ? { "data-live-sheet": "" } : {})}
      lang={languageLocale(style.language)}
      className="resume-page bg-white"
      style={{
        ...pageStyle(style),
        height: `${pages * pageHmm}mm`,
        display: "flex",
        flexDirection: "column",
        // A tight lift, not a blur that reads as a phantom next page.
        boxShadow: "0 0 0 1px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.12)",
      }}
    >
      <div ref={contentRef}>
        {/* Header: with the "header" color scope, the name block sits on a
            full-bleed tinted band (negative margins undo the page padding). */}
        <header
          style={{
            textAlign: headerAlign as "left" | "center",
            marginBottom: "var(--r-gap)",
            ...(style.colorScope === "header"
              ? {
                  background: tint(style.accentColor),
                  margin: `-${style.marginY}mm -${style.marginX}mm var(--r-gap)`,
                  padding: `${style.marginY}mm ${style.marginX}mm 12px`,
                }
              : {}),
          }}
        >
          {personal.photo && style.showPhoto && (
            <img
              src={personal.photo}
              alt={personal.name}
              style={{
                width: style.photoSize, height: style.photoSize, objectFit: "cover",
                borderRadius: style.photoShape === "circle" ? "9999px" : style.photoShape === "rounded" ? "12px" : "0",
                margin: headerAlign === "center" ? "0 auto 6px" : "0 0 6px",
              }}
            />
          )}
          {personal.name && <h1 style={nameStyle(style)}>{personal.name}</h1>}
          {personal.title && <p style={{ ...jobTitleStyle(style), fontSize: "0.95em", opacity: 0.9 }}>{personal.title}</p>}

          <div
            className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1"
            style={{ fontSize: "0.8em", color: "#4b5563", justifyContent: headerAlign === "center" ? "center" : "flex-start" }}
          >
            {contactItems.map((c, i) => (
              <span key={c.key} className="inline-flex items-center gap-1">
                {showIcons && c.icon && <c.icon size={11} style={{ color: iconColor }} />}
                {!showIcons && sep && i > 0 && <span className="opacity-50 mr-1">{sep}</span>}
                {c.node}
              </span>
            ))}
          </div>

          {personal.extra && Object.keys(personal.extra).length > 0 && (
            <div
              className="flex flex-wrap gap-x-3 mt-0.5"
              style={{ fontSize: "0.75em", color: "#6b7280", justifyContent: headerAlign === "center" ? "center" : "flex-start" }}
            >
              {Object.entries(personal.extra)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <span key={k}>
                    {k}: {v}
                  </span>
                ))}
            </div>
          )}
        </header>

        {/* Sections */}
        <div style={bodyStyle(style)}>
          {sections.map((section) => {
            const Icon = iconByName(section.icon);
            return (
              <section
                key={section.id}
                style={{
                  ...sectionStyle(style),
                  // Mix layout: prose sections escape the columns.
                  ...(style.columns === "mix" &&
                  (section.kind === "summary" || section.kind === "declaration")
                    ? { columnSpan: "all" as const }
                    : {}),
                }}
              >
                <h2 style={headingStyle(style)}>
                  {style.headingIcons !== "none" && (
                    <Icon
                      size={style.headingIconSize || 13}
                      className="mr-1 inline"
                      style={{ verticalAlign: "-0.125em" }}
                      fill={style.headingIcons === "filled" ? "currentColor" : "none"}
                    />
                  )}
                  {section.heading}
                </h2>
                <SectionBody section={section} style={style} />
              </section>
            );
          })}
          {sections.length === 0 && (
            <p style={{ textAlign: "center", opacity: 0.4, marginTop: "3rem" }}>
              No visible sections. Add content to get started.
            </p>
          )}
        </div>

        {/* Footer */}
      </div>
        {style.footerText && (
          <footer
            ref={footerRef}
            style={{ marginTop: "auto", paddingTop: "4px", borderTop: "1px solid #e5e7eb", fontSize: "0.7em", color: "#9ca3af" }}
          >
            {style.footerText}
          </footer>
        )}
    </div>
  );
};

export const ResumePreview = ({ doc, sample, onExitSample }: {
  doc: ResumeDocument;
  /** True when the sheet shows the fixed sample document, not the record. */
  sample?: boolean;
  onExitSample?: () => void;
}) => {
  const { style } = doc;
  const [pageCount, setPageCount] = useState(1);
  const dims = PAGE_DIMS[style.pageFormat] ?? PAGE_DIMS.A4;
  const pageHeightPx = dims.h * MM_TO_PX;
  const sheetWidthPx = dims.w * MM_TO_PX;

  // Fit the sheet to the available width: A3 shrinks to fit instead of
  // overflowing, A5 renders at its real size.
  const fitRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    const measure = () => setScale(Math.min(1, el.clientWidth / sheetWidthPx));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sheetWidthPx]);

  return (
    <div className="bg-[var(--color-background)] rounded-xl">
      {/* Preview toolbar: the physical reality of the document at a glance. */}
      <div className="flex items-center justify-between px-4 pt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
        <span>
          {style.pageFormat} · {(PAGE_DIMS[style.pageFormat] ?? PAGE_DIMS.A4).w} ×{" "}
          {(PAGE_DIMS[style.pageFormat] ?? PAGE_DIMS.A4).h} mm
        </span>
        <span className="flex items-center gap-2">
          {sample && (
            <button
              onClick={onExitSample}
              className="rounded-sm border border-amber-500/60 bg-amber-500/10 px-1.5 py-px text-amber-600 transition-colors hover:border-amber-500 dark:text-amber-400"
              title="The sheet is showing sample data. Click to show your document."
            >
              Sample data ×
            </button>
          )}
          {pageCount} page{pageCount === 1 ? "" : "s"}
        </span>
      </div>
      <div className="p-4" ref={fitRef}>
        <div style={{ width: sheetWidthPx * scale, height: pageCount * pageHeightPx * scale, margin: "0 auto" }}>
        <div className="relative origin-top-left" style={{ width: sheetWidthPx, transform: "scale(" + scale + ")" }}>
          {/* Real page numbers: one per printed page, centered inside each
              page's bottom margin. */}
          {style.showPageNumbers &&
            Array.from({ length: pageCount }, (_, i) => (
              <span
                key={`pn-${i}`}
                aria-hidden
                className="pointer-events-none absolute left-0 right-0 z-10 text-center font-mono text-[9px] text-gray-400"
                style={{ top: (i + 1) * pageHeightPx - (style.marginY * MM_TO_PX) / 2 - 6 }}
              >
                {i + 1} / {pageCount}
              </span>
            ))}
          {/* Cut guides: one dashed line per printed page boundary. */}
          {Array.from({ length: pageCount - 1 }, (_, i) => (
            <div
              key={i}
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 z-10"
              style={{ top: (i + 1) * pageHeightPx }}
            >
              <div className="border-t-2 border-dashed border-red-400/70" />
              <span className="absolute right-1 top-0.5 rounded-sm bg-red-400/90 px-1 py-px font-mono text-[8.5px] uppercase tracking-wide text-white">
                Page {i + 2}
              </span>
            </div>
          ))}
          <ResumeSheet doc={doc} live onPageCount={setPageCount} />
        </div>
        </div>
      </div>
    </div>
  );
};
