// Live page preview of a resume document, fully driven by doc.style.

import { useEffect, useRef, useState } from "react";
import {
  Mail, Phone, MapPin, Globe, Github, Linkedin, Twitter, GraduationCap,
  BookOpen, Link2, ExternalLink, ArrowUp, type LucideIcon,
} from "lucide-react";
import { PAGE_DIMS, ResumeDocument, ResumeEntry, ResumeSection, ResumeStyle } from "@/types/resume";
import { fmtResumeDate, languageLocale, presentWord } from "@/lib/resumeDates";
import { iconByName } from "../icons";
import type { CSSProperties } from "react";
import {
  pageStyle, nameStyle, jobTitleStyle, headingStyle, subtitleStyle, dateStyle,
  entryHeaderStyle, linkStyle, descriptionClass, descriptionStyle, bodyStyle,
  sectionStyle, loadFonts, tint, railColors, RAIL_FRAC,
} from "./previewStyles";
import { sectionRegion } from "@/lib/resumeDefaults";
import { proficiencyDots } from "@/export/layout";

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

/** One job/degree/item. The three layouts are visibly distinct whatever the
 *  other settings: 1 = date pushed to the right edge; 2 = stacked, the date on
 *  its own line; 3 = everything on one left-running line, the date trailing. */
function EntryRow({ entry, style, atomKey }: { entry: ResumeEntry; style: ResumeStyle; atomKey?: string }) {
  const dates = range(entry.startDate, entry.endDate, style);
  const layout = style.entryLayout;
  const subtitleInline = style.subtitlePlacement === "same" || layout === 3;

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

  if (layout === 3) {
    return (
      <div data-atom={atomKey} style={{ marginBottom: "var(--r-gap)" }}>
        <div>
          {titleEl}
          {subtitleEl}
          {entry.location && (
            <span style={{ fontSize: "0.85em", color: "var(--r-muted, #6b7280)" }}> · {entry.location}</span>
          )}
          {dates && <span style={{ ...dateStyle(style), whiteSpace: "nowrap" }}> — {dates}</span>}
        </div>
        <Desc html={entry.description} style={style} />
      </div>
    );
  }

  return (
    <div data-atom={atomKey} style={{ marginBottom: "var(--r-gap)" }}>
      <div className={layout === 1 ? "flex justify-between items-baseline gap-3" : ""}>
        <div className="min-w-0">
          {titleEl}
          {subtitleInline && subtitleEl}
          {!subtitleInline && subtitleEl && <div>{subtitleEl}</div>}
        </div>
        {layout === 1 && dates && <span style={dateStyle(style)}>{dates}</span>}
      </div>
      {layout === 2 && dates && <div style={dateStyle(style)}>{dates}</div>}
      {entry.location && <div style={{ fontSize: "0.85em", color: "var(--r-muted, #6b7280)" }}>{entry.location}</div>}
      <Desc html={entry.description} style={style} />
    </div>
  );
}

function SectionBody({ section, style }: { section: ResumeSection; style: ResumeStyle }) {
  const visible = section.entries.filter((e) => !e.hidden);
  if (visible.length === 0) return <p style={{ opacity: 0.4, fontSize: "0.85em", fontStyle: "italic" }}>No entries.</p>;

  const kind = section.customType === "skill" ? "skills" : section.kind;
  const layout = section.layout || "list";

  const atom = `b:${section.id}`;

  switch (kind) {
    case "summary":
    case "declaration":
      return (
        <div data-atom={atom}>
          <Desc html={visible[0]?.description} style={style} />
        </div>
      );

    case "skills":
      if (layout === "bubble") {
        return (
          <div data-atom={atom} className="flex flex-wrap gap-1.5">
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
        <div data-atom={atom} className="space-y-0.5">
          {visible.map((e) => (
            <div key={e.id} className="flex flex-wrap items-baseline gap-x-2">
              <span style={{ fontWeight: 600 }}>{e.title}:</span>
              <span style={{ opacity: 0.85 }}>{(e.meta?.items as string[] | undefined)?.join(", ")}</span>
            </div>
          ))}
        </div>
      );

    case "languages":
      if (layout === "dots") {
        return (
          <div data-atom={atom} className="space-y-1">
            {visible.map((e) => (
              <div key={e.id} className="flex items-baseline justify-between gap-3">
                <span style={{ fontWeight: 600 }}>{e.title}</span>
                <span className="inline-flex items-center gap-[3px]" title={e.subtitle}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      style={{
                        width: "0.5em", height: "0.5em", borderRadius: "9999px",
                        background: n <= proficiencyDots(e.subtitle) ? style.accentColor : "transparent",
                        boxShadow: `inset 0 0 0 1px ${style.accentColor}`,
                        opacity: n <= proficiencyDots(e.subtitle) ? 1 : 0.45,
                      }}
                    />
                  ))}
                </span>
              </div>
            ))}
          </div>
        );
      }
      if (layout === "grid") {
        return (
          <div data-atom={atom} className="grid grid-cols-2 gap-x-6 gap-y-0.5">
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
        <div data-atom={atom} className="flex flex-wrap gap-x-6 gap-y-0.5">
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
        <div data-atom={atom} className="flex flex-wrap gap-1.5">
          {visible.map((e) => (
            <span key={e.id} className="px-2 py-0.5 rounded-full" style={{ border: "1px solid var(--r-chip-border, #d1d5db)", fontSize: "0.85em" }}>
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
            <li key={e.id} data-atom={`e:${section.id}:${e.id}`} className="flex justify-between items-baseline gap-3">
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
        <div data-atom={atom} className={layout === "rows" ? "space-y-2" : "grid grid-cols-2 gap-3"}>
          {visible.map((e) => (
            <div key={e.id}>
              <div style={entryHeaderStyle(style)}>{e.title}</div>
              {e.subtitle && <div style={{ ...subtitleStyle(style), fontSize: "0.9em" }}>{e.subtitle}</div>}
              {(e.meta?.organization as string) && <div style={{ fontSize: "0.85em", color: "var(--r-muted, #6b7280)" }}>{e.meta?.organization as string}</div>}
              {(e.meta?.email as string) && <div style={{ fontSize: "0.85em", color: "var(--r-muted, #6b7280)" }}>{e.meta?.email as string}</div>}
            </div>
          ))}
        </div>
      );

    default: {
      if (layout === "grid") {
        return (
          <div data-atom={atom} className="grid grid-cols-2 gap-x-4">
            {visible.map((e) => (
              <EntryRow key={e.id} entry={e} style={style} />
            ))}
          </div>
        );
      }
      if (layout === "rows") {
        // Compact single-line rows: title, subtitle, date; no body text.
        return (
          <div data-atom={atom} className="space-y-0.5">
            {visible.map((e) => (
              <div key={e.id} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0">
                  <span style={entryHeaderStyle(style)}>
                    {e.link ? (
                      <a href={e.link} target="_blank" rel="noreferrer" style={linkStyle(style)}>
                        {e.title}
                        <LinkIcon style={style} />
                      </a>
                    ) : (
                      e.title
                    )}
                  </span>
                  {e.subtitle && <span style={subtitleStyle(style)}> · {e.subtitle}</span>}
                </span>
                {range(e.startDate, e.endDate, style) && (
                  <span style={dateStyle(style)}>{range(e.startDate, e.endDate, style)}</span>
                )}
              </div>
            ))}
          </div>
        );
      }
      return (
        <>
          {visible.map((e) => (
            <EntryRow key={e.id} entry={e} style={style} atomKey={`e:${section.id}:${e.id}`} />
          ))}
        </>
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
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [pages, setPages] = useState(1);
  const pageHmm = (PAGE_DIMS[style.pageFormat] ?? PAGE_DIMS.A4).h;

  useEffect(() => {
    loadFonts(style.bodyFont, style.nameFont);
  }, [style.bodyFont, style.nameFont]);

  // Pagination: no block may straddle a printed page boundary. Every atom
  // ([data-atom], inside a [data-flow]) that would cross the bottom margin is
  // pushed to the next page's top margin via paddingTop; a heading left alone
  // at a page's foot travels with its first block. The maths works on natural
  // positions (current pushes subtracted), so re-running converges instead of
  // oscillating, and the same pushes flow into the print/PDF output.
  const paginate = () => {
    const rootEl = rootRef.current;
    if (!rootEl) return;
    const pageHpx = pageHmm * MM_TO_PX;
    const mYpx = style.marginY * MM_TO_PX;
    const contentAreaH = pageHpx - 2 * mYpx;
    // The preview scales the sheet with a transform; rects come back scaled.
    const scale = rootEl.getBoundingClientRect().width / rootEl.offsetWidth || 1;

    rootEl.querySelectorAll<HTMLElement>("[data-flow]").forEach((flow) => {
      const atoms = Array.from(flow.querySelectorAll<HTMLElement>("[data-atom]"));
      if (!atoms.length) return;
      const rootTop = rootEl.getBoundingClientRect().top;
      let before = 0; // applied pushes above the current atom
      let offset = 0; // freshly computed pushes above the current atom
      let prevHead: { el: HTMLElement; top: number } | null = null;

      atoms.forEach((a) => {
        const applied = parseFloat(a.style.paddingTop) || 0;
        const r = a.getBoundingClientRect();
        const natTop = (r.top - rootTop) / scale - before;
        const natH = r.height / scale - applied;
        const top = natTop + offset;
        const page = Math.floor(top / pageHpx);
        const limit = (page + 1) * pageHpx - mYpx;
        const isHead = (a.dataset.atom || "").startsWith("h:");

        let push = 0;
        let pushEl: HTMLElement = a;
        if (top + natH > limit + 1 && natH <= contentAreaH) {
          const from = prevHead ? prevHead.top : top;
          pushEl = prevHead ? prevHead.el : a;
          push = (page + 1) * pageHpx + mYpx - from;
        }

        if (pushEl === a) {
          const want = push > 0.5 ? `${push}px` : "";
          if ((a.style.paddingTop || "") !== want) a.style.paddingTop = want;
        } else {
          // Pushing the orphaned heading instead; this atom itself stays flat.
          const want = `${push}px`;
          if ((pushEl.style.paddingTop || "") !== want) pushEl.style.paddingTop = want;
          if ((a.style.paddingTop || "") !== "") a.style.paddingTop = "";
        }
        before += applied;
        offset += push;
        prevHead = isHead ? { el: a, top: top + push } : null;
      });
    });
  };

  // The sheet is always a whole number of pages tall: content is paginated,
  // then measured; the count is derived and the footer pins to the final
  // page's bottom.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => {
      paginate();
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
    // Re-run on every document change: React may re-render atoms (dropping
    // their pushed padding), so the deps deliberately include the doc itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, pageHmm, style.marginY, style.footerText, onPageCount]);

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

  // Sidebar geometry: the rail is a fraction of the content width, and its
  // band bleeds through the right margin to the sheet edge.
  const pageWmm = (PAGE_DIMS[style.pageFormat] ?? PAGE_DIMS.A4).w;
  const railWidthMm = (pageWmm - style.marginX * 2) * RAIL_FRAC;
  const rail = railColors(style);

  const renderSection = (section: ResumeSection) => {
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
        <div data-atom={`h:${section.id}`}>
          <h2 style={headingStyle(style)}>
            {/* inline-flex centers the icon on the text box whatever the
                heading's font or the icon's size. */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35em", verticalAlign: "top" }}>
              {style.headingIcons !== "none" && (
                <Icon
                  size={style.headingIconSize || 13}
                  style={{ flexShrink: 0 }}
                  fill={style.headingIcons === "filled" ? "currentColor" : "none"}
                />
              )}
              <span>{section.heading}</span>
            </span>
          </h2>
        </div>
        <SectionBody section={section} style={style} />
      </section>
    );
  };

  return (
    <div
      ref={rootRef}
      {...(live ? { "data-live-sheet": "" } : {})}
      lang={languageLocale(style.language)}
      className="resume-page bg-white"
      style={{
        ...pageStyle(style),
        height: `${pages * pageHmm}mm`,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* The rail's band: painted on the sheet so it runs the full height of
          every page and bleeds through the right margin to the edge. */}
      {style.columns === "sidebar" && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: `${railWidthMm + style.marginX + 3.5}mm`,
            background: rail.bg,
          }}
        />
      )}
      <div ref={contentRef} style={{ position: "relative" }}>
        {/* Header: with the "header" color scope, the name block sits on a
            full-bleed tinted band (negative margins undo the page padding). */}
        <header
          style={{
            textAlign: headerAlign as "left" | "center",
            marginBottom: "var(--r-gap)",
            // Without a full-bleed band, the header stays off the rail.
            ...(style.columns === "sidebar" && style.colorScope !== "header"
              ? { paddingRight: `${railWidthMm + 7}mm` }
              : {}),
            ...(style.colorScope === "header"
              ? {
                  background: style.headerFillColor || tint(style.accentColor),
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
        {style.columns === "sidebar" ? (
          // Two independent flows: the story keeps the wide column, the
          // reference-card sections ride the rail (the tinted band behind it
          // is painted at the sheet level so it spans every page).
          <div style={{ display: "flex", gap: "7mm" }}>
            <div data-flow="" style={{ flex: 1, minWidth: 0 }}>
              {sections.filter((s) => sectionRegion(s) === "main").map(renderSection)}
            </div>
            <div
              data-flow=""
              style={{
                width: `${railWidthMm}mm`,
                flexShrink: 0,
                ...(rail.ink ? { color: rail.ink } : {}),
                ...(rail.muted
                  ? ({ "--r-muted": rail.muted, "--r-chip-border": rail.muted } as CSSProperties)
                  : {}),
              }}
            >
              {sections.filter((s) => sectionRegion(s) === "side").map(renderSection)}
            </div>
          </div>
        ) : (
          <div {...(style.columns === "one" ? { "data-flow": "" } : {})} style={bodyStyle(style)}>
            {sections.map(renderSection)}
          </div>
        )}
        {sections.length === 0 && (
          <p style={{ textAlign: "center", opacity: 0.4, marginTop: "3rem" }}>
            No visible sections. Add content to get started.
          </p>
        )}

        {/* Footer */}
      </div>
        {style.footerText && (
          <footer
            ref={footerRef}
            style={{ marginTop: "auto", paddingTop: "4px", borderTop: "1px solid #e5e7eb", fontSize: "0.7em", color: "#9ca3af", position: "relative" }}
          >
            {style.footerText}
          </footer>
        )}
    </div>
  );
};

/** Gap between page sheets in the preview stack, in unscaled px. */
const PAGE_GAP = 20;

export const ResumePreview = ({ doc, sample, onExitSample }: {
  doc: ResumeDocument;
  /** True when the sheet shows the fixed sample document, not the record. */
  sample?: boolean;
  onExitSample?: () => void;
}) => {
  const { style } = doc;
  const [pageCount, setPageCount] = useState(1);
  const [scrolled, setScrolled] = useState(false);
  const dims = PAGE_DIMS[style.pageFormat] ?? PAGE_DIMS.A4;
  const pageHeightPx = dims.h * MM_TO_PX;
  const sheetWidthPx = dims.w * MM_TO_PX;

  // Fit the sheet to the available width: A3 shrinks to fit instead of
  // overflowing, A5 renders at its real size.
  const fitRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
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
      <div className="flex items-center justify-between px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
        <span>
          {dims.w} × {dims.h} mm · {style.pageFormat}
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

      {/* The pages scroll inside their own container: the wheel moves the
          document, never the app behind it. */}
      <div
        ref={scrollRef}
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 240)}
        className="relative max-h-[calc(100vh-7.5rem)] overflow-y-auto overscroll-contain p-4"
      >
        <div ref={fitRef}>
          <div
            style={{
              width: sheetWidthPx * scale,
              height: (pageCount * pageHeightPx + (pageCount - 1) * PAGE_GAP) * scale,
              margin: "0 auto",
            }}
          >
            <div className="origin-top-left" style={{ width: sheetWidthPx, transform: `scale(${scale})` }}>
              {/* Each printed page is its own sheet: a window over the full
                  document, translated to its page and clipped. Pagination
                  keeps blocks off the boundaries, so nothing is cut mid-line
                  (matching what print produces). */}
              {Array.from({ length: pageCount }, (_, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden bg-white"
                  style={{
                    height: pageHeightPx,
                    marginBottom: i < pageCount - 1 ? PAGE_GAP : 0,
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.07), 0 1px 5px rgba(0,0,0,0.14)",
                  }}
                >
                  <div style={{ transform: `translateY(${-i * pageHeightPx}px)` }}>
                    <ResumeSheet
                      doc={doc}
                      live={i === 0}
                      onPageCount={i === 0 ? setPageCount : undefined}
                    />
                  </div>
                  {style.showPageNumbers && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-0 right-0 z-10 text-center font-mono text-[9px] text-gray-400"
                      style={{ bottom: (style.marginY * MM_TO_PX) / 2 - 6 }}
                    >
                      {i + 1} / {pageCount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Back to the first page, for long documents. */}
        {scrolled && (
          <button
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
            className="sticky bottom-3 left-full z-20 mr-1 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] shadow-md transition-colors hover:border-signal hover:text-signal"
            title="Scroll to the first page"
            aria-label="Scroll to the first page"
          >
            <ArrowUp size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
