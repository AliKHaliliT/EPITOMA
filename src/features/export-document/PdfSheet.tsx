// The direct-PDF renderer: the document model rendered with @react-pdf's
// layout engine, driven by the same export layout contract as the preview,
// Word, and LaTeX (src/export/layout.ts). Pagination is the engine's own:
// entries never split across pages (wrap={false}) and headings keep their
// first block (minPresenceAhead), mirroring the preview's no-straddle rule.
// Lives in the lazily loaded PDF chunk together with the embedded fonts.

import React from "react";
import {
  Circle, Document as PdfDocument, Ellipse, Image, Line, Link, Page, Path,
  Polygon, Polyline, Rect, Svg, Text, View,
} from "@react-pdf/renderer";
import type { Style } from "@react-pdf/stylesheet";
import { icons } from "lucide";
import { ResumeDocument, ResumeEntry, ResumeSection, ResumeStyle, fmtResumeDate, presentWord, proficiencyDots, resolveColors, resolveEntry, resolveGeometry, resolveHeading, resolveType, sectionShape, splitRegions, type ColorPlan, type HeadingSpec, type TypeScale } from "@/entities/resume";
import { ensurePdfFont } from "./pdfFonts";

const MM = 2.83465; // mm → pt

// ── shared render context ───────────────────────────────────────────────────

interface Ctx {
  style: ResumeStyle;
  colors: ColorPlan;
  t: TypeScale;
  heading: HeadingSpec;
  bodyFamily: string;
  nameFamily: string;
  /** Body ink; flips light inside dark fills (explicit on every text leaf:
   *  color inheritance through nested Text nodes is unreliable). */
  ink: string;
  /** Muted ink for dates/locations; flips with ink. */
  muted: string;
  /** Chip outline color; flips with muted. */
  chipLine: string;
}

const LIGHT_INK = "#f8fafc";
const LIGHT_MUTED = "#e2e8f0";

// ── lucide icons on the PDF canvas ──────────────────────────────────────────

type IconNode = [string, Record<string, string | number>][];

function LucideIcon({ name, size, color, filled }: { name?: string; size: number; color: string; filled?: boolean }) {
  const node = (icons as Record<string, IconNode>)[name || ""] || null;
  if (!node) return null;
  const common = {
    stroke: color,
    strokeWidth: 2,
    fill: filled ? color : "none",
  } as const;
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      {node.map(([tag, attrs], i) => {
        const a = attrs as Record<string, string>;
        switch (tag) {
          case "path":
            return <Path key={i} d={a.d} {...common} />;
          case "circle":
            return <Circle key={i} cx={a.cx} cy={a.cy} r={a.r} {...common} />;
          case "rect":
            return <Rect key={i} x={a.x} y={a.y} width={a.width} height={a.height} rx={a.rx} {...common} />;
          case "line":
            return <Line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} {...common} />;
          case "polyline":
            return <Polyline key={i} points={a.points} {...common} />;
          case "polygon":
            return <Polygon key={i} points={a.points} {...common} />;
          case "ellipse":
            return <Ellipse key={i} cx={a.cx} cy={a.cy} rx={a.rx} ry={a.ry} {...common} />;
          default:
            return null;
        }
      })}
    </Svg>
  );
}

const CONTACT_ICON_NAMES: Record<string, string> = {
  Globe: "Globe", Github: "Github", Linkedin: "Linkedin", Twitter: "Twitter",
  GraduationCap: "GraduationCap", BookOpen: "BookOpen", Link2: "Link2",
};

// ── dates ───────────────────────────────────────────────────────────────────

const range = (s: string | undefined, e: string | undefined, style: ResumeStyle) => {
  const f = (d: string | undefined) => fmtResumeDate(d, style.dateFormat, style.language);
  if (!s && !e) return "";
  if (s && e) return `${f(s)} – ${f(e)}`;
  if (s && !e) return `${f(s)} – ${presentWord(style.language)}`;
  return f(e);
};

// ── rich text (entry descriptions) ──────────────────────────────────────────

function htmlToNodes(html: string | undefined, ctx: Ctx): React.ReactNode {
  if (!html) return null;
  let root: Document;
  try {
    root = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  } catch {
    return <Text>{html.replace(/<[^>]+>/g, "")}</Text>;
  }
  const bullet = ctx.style.listStyle === "hyphen" ? "–  " : "•  ";
  const size = ctx.t.basePt * 0.92;

  const inline = (node: Node, key: number): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node as HTMLElement;
    const kids = Array.from(el.childNodes).map(inline);
    switch (el.tagName.toLowerCase()) {
      case "strong":
      case "b":
        return <Text key={key} style={{ fontWeight: 700 }}>{kids}</Text>;
      case "em":
      case "i":
        return <Text key={key} style={{ fontStyle: "italic" }}>{kids}</Text>;
      case "u":
        return <Text key={key} style={{ textDecoration: "underline" }}>{kids}</Text>;
      case "a": {
        const href = el.getAttribute("href") || "";
        if (!href || href.startsWith("#")) return <Text key={key}>{kids}</Text>;
        return <Link key={key} src={href} style={linkStyle(ctx)}>{kids}</Link>;
      }
      case "br":
        return "\n";
      default:
        return kids;
    }
  };

  const blocks: React.ReactNode[] = [];
  Array.from(root.body.childNodes).forEach((node, i) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      blocks.push(<Text key={i} style={{ fontSize: size, color: ctx.ink }}>{node.textContent}</Text>);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") {
      Array.from(el.children).forEach((li, j) => {
        blocks.push(
          <View key={`${i}-${j}`} style={{ flexDirection: "row", marginBottom: 0.6 }}>
            <Text style={{ fontSize: size, width: 10, color: ctx.ink }}>{tag === "ol" ? `${j + 1}.` : bullet}</Text>
            <Text style={{ fontSize: size, flex: 1, color: ctx.ink }}>{Array.from(li.childNodes).map(inline)}</Text>
          </View>
        );
      });
      return;
    }
    const align = /ql-align-center/.test(el.className) ? "center" : /ql-align-right/.test(el.className) ? "right" : undefined;
    blocks.push(
      <Text key={i} style={{ fontSize: size, marginBottom: 1, color: ctx.ink, ...(align ? { textAlign: align } : {}) }}>
        {Array.from(el.childNodes).map(inline)}
      </Text>
    );
  });
  return blocks.length ? <View style={{ marginTop: 1 }}>{blocks}</View> : null;
}

// ── style helpers (mirror previewStyles) ────────────────────────────────────

const linkStyle = (ctx: Ctx): Style => ({
  color: ctx.style.linkColored ? ctx.colors.accent : undefined,
  textDecoration: ctx.style.linkUnderline ? "underline" : "none",
});

const dateStyle = (ctx: Ctx): Style => ({
  fontSize: ctx.t.basePt * 0.85,
  color: ctx.style.accentApply.dates ? ctx.colors.accent : ctx.muted,
});

const subtitleNodes = (e: ResumeEntry, ctx: Ctx, sep: boolean) =>
  e.subtitle ? (
    <Text
      style={{
        fontWeight: ctx.style.subtitleStyle === "bold" ? 700 : undefined,
        fontStyle: ctx.style.subtitleStyle === "italic" ? "italic" : undefined,
        color: ctx.style.accentApply.subtitle ? ctx.colors.accent : ctx.ink,
      }}
    >
      {sep ? " · " : ""}
      {e.subtitle}
    </Text>
  ) : null;

function titleNodes(e: ResumeEntry, ctx: Ctx) {
  if (!e.title) return null;
  const inner = (
    <Text style={{ fontSize: ctx.t.entryPt, fontWeight: 700, color: ctx.ink }}>{e.title}</Text>
  );
  if (e.link && !e.link.startsWith("#")) {
    return <Link src={e.link} style={linkStyle(ctx)}>{inner}</Link>;
  }
  return inner;
}

// ── entries ─────────────────────────────────────────────────────────────────

function EntryBlock({ e, ctx }: { e: ResumeEntry; ctx: Ctx }) {
  const spec = resolveEntry(ctx.style);
  const dates = range(e.startDate, e.endDate, ctx.style);
  const gap = ctx.style.elementSpacing * 0.75;
  const locSize = ctx.t.basePt * 0.85;

  if (spec.layout === 3) {
    return (
      <View wrap={false} style={{ marginBottom: gap }}>
        <Text style={{ color: ctx.ink }}>
          {titleNodes(e, ctx)}
          {subtitleNodes(e, ctx, true)}
          {e.location ? <Text style={{ fontSize: locSize, color: ctx.muted }}> · {e.location}</Text> : null}
          {dates ? <Text style={dateStyle(ctx)}> — {dates}</Text> : null}
        </Text>
        {htmlToNodes(e.description, ctx)}
      </View>
    );
  }

  const first = (inRow: boolean) => (
    <Text style={inRow ? { flex: 1, paddingRight: 8, color: ctx.ink } : { color: ctx.ink }}>
      {titleNodes(e, ctx)}
      {spec.subtitleInline ? subtitleNodes(e, ctx, true) : null}
    </Text>
  );

  return (
    <View wrap={false} style={{ marginBottom: gap }}>
      {spec.layout === 1 && dates ? (
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          {first(true)}
          <Text style={{ ...dateStyle(ctx), flexShrink: 0 }}>{dates}</Text>
        </View>
      ) : (
        first(false)
      )}
      {!spec.subtitleInline && e.subtitle ? <Text>{subtitleNodes(e, ctx, false)}</Text> : null}
      {spec.layout === 2 && dates ? <Text style={dateStyle(ctx)}>{dates}</Text> : null}
      {e.location ? <Text style={{ fontSize: locSize, color: ctx.muted }}>{e.location}</Text> : null}
      {htmlToNodes(e.description, ctx)}
    </View>
  );
}

// ── section bodies ──────────────────────────────────────────────────────────

const items = (e: ResumeEntry): string[] => (e.meta?.items as string[] | undefined) || [];

function Chip({ text, bg, line, ctx }: { text: string; bg?: string; line?: string; ctx: Ctx }) {
  return (
    <Text
      style={{
        color: bg ? "#1f2937" : ctx.ink,
        fontSize: ctx.t.basePt * 0.85,
        backgroundColor: bg,
        ...(line ? { borderWidth: 0.75, borderColor: line } : {}),
        borderRadius: 7,
        paddingHorizontal: 5,
        paddingVertical: 1.5,
        marginRight: 4,
        marginBottom: 4,
      }}
    >
      {text}
    </Text>
  );
}

function Dots({ n, ctx }: { n: number; ctx: Ctx }) {
  const d = ctx.t.basePt * 0.5;
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={{
            width: d, height: d, borderRadius: d / 2, marginLeft: 2.5,
            backgroundColor: i <= n ? ctx.colors.accent : undefined,
            borderWidth: 0.8, borderColor: ctx.colors.accent,
            opacity: i <= n ? 1 : 0.45,
          }}
        />
      ))}
    </View>
  );
}

function SectionBody({ section, ctx }: { section: ResumeSection; ctx: Ctx }) {
  const visible = section.entries.filter((e) => !e.hidden);
  if (visible.length === 0) return null;
  const small = ctx.t.basePt * 0.85;

  switch (sectionShape(section)) {
    case "prose":
      return <View>{htmlToNodes(visible[0]?.description, ctx)}</View>;

    case "skill-groups":
      return (
        <View>
          {visible.map((e) => (
            <Text key={e.id} style={{ marginBottom: 1.5, color: ctx.ink }}>
              <Text style={{ fontWeight: 700, color: ctx.ink }}>{e.title}: </Text>
              {items(e).join(", ")}
            </Text>
          ))}
        </View>
      );

    case "skill-chips":
      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {visible.flatMap((e) => (items(e).length ? items(e) : [e.title || ""])).map((it, i) => (
            <Chip key={i} text={it} bg={ctx.colors.accentTint} ctx={ctx} />
          ))}
        </View>
      );

    case "lang-dots":
      return (
        <View>
          {visible.map((e) => (
            <View key={e.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
              <Text style={{ flex: 1, paddingRight: 6, fontWeight: 700, color: ctx.ink }}>{e.title}</Text>
              <Dots n={proficiencyDots(e.subtitle)} ctx={ctx} />
            </View>
          ))}
        </View>
      );

    case "lang-grid":
      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {visible.map((e) => (
            <Text key={e.id} style={{ width: "50%", marginBottom: 1.5, color: ctx.ink }}>
              <Text style={{ fontWeight: 700, color: ctx.ink }}>{e.title}</Text>
              {e.subtitle ? <Text style={{ opacity: 0.75 }}> · {e.subtitle}</Text> : null}
            </Text>
          ))}
        </View>
      );

    case "lang-list":
      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {visible.map((e) => (
            <Text key={e.id} style={{ marginRight: 14, marginBottom: 1.5, color: ctx.ink }}>
              <Text style={{ fontWeight: 700, color: ctx.ink }}>{e.title}</Text>
              {e.subtitle ? <Text style={{ opacity: 0.75 }}> · {e.subtitle}</Text> : null}
            </Text>
          ))}
        </View>
      );

    case "chips":
      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {visible.map((e) => (
            <Chip key={e.id} text={e.title || ""} line={ctx.chipLine} ctx={ctx} />
          ))}
        </View>
      );

    case "plain-rows":
      return (
        <View>
          {visible.map((e) => (
            <Text key={e.id} style={{ marginBottom: 1.5, color: ctx.ink }}>
              <Text style={{ fontWeight: 700, color: ctx.ink }}>{e.title}</Text>
              {(e.meta?.category as string) ? <Text style={{ opacity: 0.75 }}> · {e.meta?.category as string}</Text> : null}
            </Text>
          ))}
        </View>
      );

    case "linked-list":
      return (
        <View>
          {visible.map((e) => (
            <View key={e.id} style={{ flexDirection: "row", marginBottom: 1.5 }}>
              {e.link && !e.link.startsWith("#") ? (
                <Link src={e.link} style={{ ...linkStyle(ctx), flex: 1, paddingRight: 6 }}><Text style={{ color: ctx.ink }}>{e.title}</Text></Link>
              ) : (
                <Text style={{ flex: 1, paddingRight: 6, color: ctx.ink }}>{e.title}</Text>
              )}
              {e.startDate ? (
                <Text style={dateStyle(ctx)}>{fmtResumeDate(e.startDate, ctx.style.dateFormat, ctx.style.language)}</Text>
              ) : null}
            </View>
          ))}
        </View>
      );

    case "ref-cards": {
      const card = (e: ResumeEntry) => (
        <View key={e.id} style={{ marginBottom: 5 }}>
          <Text style={{ fontSize: ctx.t.entryPt, fontWeight: 700, color: ctx.ink }}>{e.title}</Text>
          {e.subtitle ? <Text style={{ fontSize: ctx.t.basePt * 0.9, color: ctx.ink }}>{e.subtitle}</Text> : null}
          {(e.meta?.organization as string) ? <Text style={{ fontSize: small, color: ctx.muted }}>{e.meta?.organization as string}</Text> : null}
          {(e.meta?.email as string) ? <Text style={{ fontSize: small, color: ctx.muted }}>{e.meta?.email as string}</Text> : null}
        </View>
      );
      if (section.layout === "rows") return <View>{visible.map(card)}</View>;
      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {visible.map((e) => (
            <View key={e.id} style={{ width: "50%" }}>{card(e)}</View>
          ))}
        </View>
      );
    }

    case "entry-rows":
      return (
        <View>
          {visible.map((e) => {
            const d = range(e.startDate, e.endDate, ctx.style);
            return (
              <View key={e.id} style={{ flexDirection: "row", marginBottom: 1.5 }}>
                <Text style={{ flex: 1, paddingRight: 8, color: ctx.ink }}>
                  {titleNodes(e, ctx)}
                  {subtitleNodes(e, ctx, true)}
                </Text>
                {d ? <Text style={{ ...dateStyle(ctx), flexShrink: 0 }}>{d}</Text> : null}
              </View>
            );
          })}
        </View>
      );

    case "entry-grid":
      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {visible.map((e) => (
            <View key={e.id} style={{ width: "50%", paddingRight: 6 }}>
              <EntryBlock e={e} ctx={ctx} />
            </View>
          ))}
        </View>
      );

    case "entries":
      return <View>{visible.map((e) => <EntryBlock key={e.id} e={e} ctx={ctx} />)}</View>;
  }
}

// ── section (heading + body) ────────────────────────────────────────────────

function SectionView({ section, ctx }: { section: ResumeSection; ctx: Ctx }) {
  const body = <SectionBody section={section} ctx={ctx} />;
  if (!body || section.entries.filter((e) => !e.hidden).length === 0) return null;
  const spec = ctx.heading;
  const text = spec.uppercase ? section.heading.toUpperCase() : section.heading;
  const iconSize = (ctx.style.headingIconSize || 13) * 0.75;

  const base: Style = {
    fontSize: ctx.t.headingPt,
    fontWeight: 700,
    lineHeight: 1.2,
    color: spec.accentText ? ctx.colors.accent : ctx.ink,
    ...(spec.uppercase ? { letterSpacing: 0.4 } : {}),
  };
  const deco: Style =
    spec.deco === "rule"
      ? { borderBottomWidth: 1.1, borderBottomColor: spec.lineColor, paddingBottom: 2 }
      : spec.deco === "frame"
      ? { borderTopWidth: 0.7, borderBottomWidth: 0.7, borderTopColor: spec.lineColor, borderBottomColor: spec.lineColor, paddingVertical: 2 }
      : spec.deco === "fill"
      ? { backgroundColor: ctx.colors.accentTint, paddingVertical: 2, paddingHorizontal: 5 }
      : spec.deco === "edge"
      ? { borderLeftWidth: 2.5, borderLeftColor: ctx.colors.accent, paddingLeft: 5 }
      : {};

  return (
    <View style={{ marginBottom: ctx.style.elementSpacing * 0.75 }}>
      <View minPresenceAhead={28} style={{ marginBottom: 3, ...deco }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {ctx.style.headingIcons !== "none" && (
            <View style={{ marginRight: 4 }}>
              <LucideIcon
                name={section.icon}
                size={iconSize}
                color={spec.accentText ? ctx.colors.accent : ctx.muted === LIGHT_MUTED ? LIGHT_INK : "#1f2937"}
                filled={ctx.style.headingIcons === "filled"}
              />
            </View>
          )}
          <Text style={base}>{text}</Text>
        </View>
        {spec.deco === "tab" && (
          <View style={{ width: 24, height: 1.6, backgroundColor: spec.lineColor, marginTop: 1.5 }} />
        )}
      </View>
      {body}
    </View>
  );
}

// ── header ──────────────────────────────────────────────────────────────────

function Header({ doc, ctx, g }: { doc: ResumeDocument; ctx: Ctx; g: ReturnType<typeof resolveGeometry> }) {
  const { personal, style } = doc;
  const center = style.headerAlign === "center";
  const bandDark = !!ctx.colors.headerInk;
  const ink = bandDark ? LIGHT_INK : undefined;
  const mutedInk = bandDark ? LIGHT_MUTED : ctx.muted;
  const sep = style.headerDetails === "bar" ? "  |  " : style.headerDetails === "bullet" ? "  •  " : "   ";
  const iconMode = style.headerDetails === "icon";
  const iconColor = style.accentApply.headerIcons ? ctx.colors.accent : mutedInk;

  const contacts: { icon: string; node: React.ReactNode; key: string }[] = [];
  if (personal.location) contacts.push({ icon: "MapPin", node: personal.location, key: "loc" });
  if (personal.email) contacts.push({ icon: "Mail", node: personal.email, key: "email" });
  if (personal.phone) contacts.push({ icon: "Phone", node: personal.phone, key: "phone" });
  personal.links?.forEach((l) =>
    contacts.push({
      icon: CONTACT_ICON_NAMES[l.icon] || "Link2",
      node:
        l.url && !l.url.startsWith("#") ? (
          <Link src={l.url} style={{ ...linkStyle(ctx), color: linkStyle(ctx).color ?? mutedInk }}>{l.label}</Link>
        ) : (
          l.label
        ),
      key: l.label,
    })
  );

  const extras = Object.entries(personal.extra || {}).filter(([, v]) => v);
  const photoOk = personal.photo && style.showPhoto && !personal.photo.startsWith("data:image/svg");

  const inner = (
    <View style={{ alignItems: center ? "center" : "flex-start" }}>
      {photoOk && (
        <Image
          src={personal.photo!}
          style={{
            width: style.photoSize * 0.75,
            height: style.photoSize * 0.75,
            objectFit: "cover",
            borderRadius: style.photoShape === "circle" ? style.photoSize : style.photoShape === "rounded" ? 9 : 0,
            marginBottom: 4,
          }}
        />
      )}
      {personal.name ? (
        <Text
          style={{
            fontFamily: ctx.nameFamily,
            fontSize: ctx.t.namePt,
            fontWeight: 700,
            // lineHeight resolves against the node's OWN size here; without
            // it the name inherits the base line box and overlaps the title.
            lineHeight: 1.12,
            // On a dark band the band ink wins over the accent.
            color: ink ?? (style.accentApply.name ? ctx.colors.accent : undefined),
          }}
        >
          {personal.name}
        </Text>
      ) : null}
      {personal.title ? (
        <Text style={{ fontSize: ctx.t.basePt * 0.95, lineHeight: 1.3, opacity: 0.9, color: ink ?? (style.accentApply.jobTitle ? ctx.colors.accent : undefined) }}>
          {personal.title}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row", flexWrap: "wrap", marginTop: 3,
          justifyContent: center ? "center" : "flex-start",
        }}
      >
        {contacts.map((c, i) => (
          <View key={c.key} style={{ flexDirection: "row", alignItems: "center" }}>
            {!iconMode && i > 0 ? <Text style={{ fontSize: ctx.t.basePt * 0.8, color: mutedInk, opacity: 0.6 }}>{sep}</Text> : null}
            {iconMode && (
              <View style={{ marginRight: 2.5, marginLeft: i > 0 ? 7 : 0 }}>
                <LucideIcon name={c.icon} size={ctx.t.basePt * 0.8} color={iconColor} />
              </View>
            )}
            <Text style={{ fontSize: ctx.t.basePt * 0.8, color: mutedInk }}>{c.node}</Text>
          </View>
        ))}
      </View>
      {extras.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 1.5, justifyContent: center ? "center" : "flex-start" }}>
          {extras.map(([k, v]) => (
            <Text key={k} style={{ fontSize: ctx.t.basePt * 0.75, color: mutedInk, marginRight: 9 }}>
              {k}: {v}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  const gap = ctx.style.elementSpacing * 0.75;
  if (ctx.colors.headerBg) {
    // Full-bleed band: negative margins undo the page padding.
    return (
      <View
        style={{
          backgroundColor: ctx.colors.headerBg,
          marginTop: -g.marginY * MM,
          marginHorizontal: -g.marginX * MM,
          paddingTop: g.marginY * MM,
          paddingHorizontal: g.marginX * MM,
          paddingBottom: 9,
          marginBottom: gap,
        }}
      >
        {inner}
      </View>
    );
  }
  return (
    <View
      style={{
        marginBottom: gap,
        ...(ctx.style.columns === "sidebar" ? { paddingRight: (g.railWmm + g.railGapMm) * MM } : {}),
      }}
    >
      {inner}
    </View>
  );
}

// ── the document ────────────────────────────────────────────────────────────

export function PdfSheet({ doc }: { doc: ResumeDocument }) {
  const { style } = doc;
  const g = resolveGeometry(style);
  const t = resolveType(style);
  const colors = resolveColors(style);
  const heading = resolveHeading(style);
  const bodyFamily = ensurePdfFont(t.bodyFont);
  const nameFamily = ensurePdfFont(t.nameFont);

  const ctx: Ctx = {
    style, colors, t, heading, bodyFamily, nameFamily,
    ink: "#1f2937", muted: "#4b5563", chipLine: "#d1d5db",
  };
  const railCtx: Ctx = colors.railInk
    ? { ...ctx, ink: colors.railInk, muted: LIGHT_MUTED, chipLine: LIGHT_MUTED }
    : ctx;

  const regions = splitRegions(style, doc.sections);
  const renderAll = (list: ResumeSection[], c: Ctx) =>
    list.map((s) => <SectionView key={s.id} section={s} ctx={c} />);

  let body: React.ReactNode;
  if (regions.mode === "sidebar") {
    body = (
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1, paddingRight: g.railGapMm * MM }}>{renderAll(regions.main, ctx)}</View>
        <View style={{ width: g.railWmm * MM, ...(colors.railInk ? { color: colors.railInk } : {}) }}>
          {renderAll(regions.side, railCtx)}
        </View>
      </View>
    );
  } else if (regions.mode === "two" || regions.mode === "mix") {
    const spanning = regions.mode === "mix"
      ? regions.main.filter((s) => s.kind === "summary" || s.kind === "declaration")
      : [];
    const cols = regions.main.filter((s) => !spanning.includes(s));
    const half = Math.ceil(cols.length / 2);
    body = (
      <View>
        {renderAll(spanning.filter((s) => s.kind === "summary"), ctx)}
        <View style={{ flexDirection: "row" }}>
          <View style={{ flex: 1, paddingRight: 14 }}>{renderAll(cols.slice(0, half), ctx)}</View>
          <View style={{ flex: 1 }}>{renderAll(cols.slice(half), ctx)}</View>
        </View>
        {renderAll(spanning.filter((s) => s.kind === "declaration"), ctx)}
      </View>
    );
  } else {
    body = <View>{renderAll(regions.main, ctx)}</View>;
  }

  return (
    <PdfDocument title={doc.name} producer="EPITOMA" creator="EPITOMA">
      <Page
        size={{ width: g.pageWmm * MM, height: g.pageHmm * MM }}
        style={{
          paddingVertical: g.marginY * MM,
          paddingHorizontal: g.marginX * MM,
          fontFamily: bodyFamily,
          fontSize: t.basePt,
          // No lineHeight here: a Page-level lineHeight silently suppresses
          // fixed render-prop texts (page numbers, footer). The content
          // wrapper below carries it instead.
          color: "#1f2937",
          ...(colors.pageBg ? { backgroundColor: colors.pageBg } : {}),
        }}
      >
        {/* Full-height fills that repeat on every page. */}
        {style.columns === "sidebar" && (
          <View
            fixed
            style={{
              position: "absolute", top: 0, bottom: 0, right: 0,
              width: (g.railWmm + g.marginX + 3.5) * MM,
              backgroundColor: colors.railBg,
            }}
          />
        )}
        {colors.edge && (
          <View
            fixed
            style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 3, backgroundColor: colors.edge }}
          />
        )}
        {/* The footer runs in every page's bottom margin, the page numbers
            centered just beneath it. Fixed elements are declared before the
            flow, like the fills above. */}
        {style.footerText ? (
          <Text
            fixed
            style={{
              position: "absolute", left: g.marginX * MM, right: g.marginX * MM,
              bottom: (g.marginY * MM) / 2 + 8, textAlign: "center",
              fontSize: t.basePt * 0.75, color: "#9ca3af",
            }}
          >
            {style.footerText}
          </Text>
        ) : null}
        {style.showPageNumbers ? (
          <Text
            fixed
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            style={{
              position: "absolute", left: 0, right: 0, bottom: (g.marginY * MM) / 2 - 4,
              textAlign: "center", fontSize: 7, color: "#9ca3af",
            }}
          />
        ) : null}

        <View style={{ lineHeight: t.lineHeight }}>
          <Header doc={doc} ctx={ctx} g={g} />
          {body}
        </View>
      </Page>
    </PdfDocument>
  );
}
