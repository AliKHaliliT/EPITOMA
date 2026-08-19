# Export parity

How one document becomes four faithful outputs: the on-screen preview, PDF,
Word (.doc), and LaTeX (.tex). The goal is that every Customize setting means
the same thing in every format, and every known divergence is listed here
rather than discovered by the user.

## Architecture

Every export is a structural renderer over one shared decision layer,
`src/entities/resume/layout.ts`, which resolves every layout decision exactly once:
geometry, the type scale, color decisions (including dark-fill ink flipping),
heading decorations, entry composition, section body shapes, column regions,
and proficiency ratings. The renderers translate those decisions into what
each format can express; none of them re-decides anything.
`tests/src/features/export-document/parity.test.ts` pins the renderers to the contract.

- **PDF: generated directly, one click, no print dialog.** The document is
  rendered by @react-pdf's layout engine in the browser and downloaded as a
  file, with the catalog fonts embedded as full TrueType faces
  (Latin-Extended included, so Turkish and Azerbaijani glyphs travel). The
  engine paginates with the preview's own rules: entries never split across
  a page boundary and a heading keeps its first block. Full-bleed color
  works here. The header band and the sidebar rail run to the sheet edge on
  every page, exactly like the preview.
- **Word and LaTeX** trade fidelity for editability, translating the same
  contract into tables/paragraph borders (Word) and macros/paracol (LaTeX).

## Feature → format mapping

| Feature | Preview | PDF | Word (.doc) | LaTeX (.tex) |
| --- | --- | --- | --- | --- |
| Page size & margins | CSS mm | exact pt geometry | `@page WordSection1` size + margins | `geometry`, paper class option |
| Body / name fonts | Google Fonts | same faces, embedded TTF | font-family stack (uses the fonts if installed) | closest stock font under pdflatex; ready `fontspec` block for exact fonts under xelatex |
| Type scale (base/name/heading/entry) | pt sizes | pt sizes | pt sizes | `\fontsize` commands |
| Line height, element spacing | CSS | engine line height, margins | CSS line-height, margins | `\baselinestretch`, `\vspace` |
| Accent color & apply-to toggles | inline styles | same colors | inline styles | `accent` color, applied per toggle |
| Page tint (color scope: full page) | opaque tint | page background | body bgcolor | `\pagecolor` |
| Header band (+ own fill, dark-ink flip) | full-bleed band | full-bleed band | shaded full-width cell (stops at margins) | `\colorbox` over the text block (stops at margins) |
| Border scope | left edge rule | fixed edge rect, every page | left border on body | *approximated as none* (documented divergence) |
| Heading styles 1–6 | six decorations | borders / fills | paragraph borders / shading | `\ressection` variants |
| Heading case & icons | text-transform + lucide icons | uppercase + lucide vectors | uppercase applied; **icons omitted** | uppercase applied; **icons omitted** |
| Entry layouts 1/2/3 | flex / stacked / inline | flex / stacked / inline | table right cell / stacked / inline | `\hfill` / stacked / inline |
| Subtitle style & placement | span styles | same | span styles | `\textbf`/`\textit`, same/next line |
| Columns: two & mix | CSS columns | halved columns (like Word) | balanced two-cell table | `multicols` (mix: prose spans full width) |
| Sidebar + rail fill + regions | absolute band + two flows | fixed band, every page + two flows | shaded table cell rail | `paracol` + `\backgroundcolor` |
| Pagination (no block straddles a page) | measured pushes | engine `wrap={false}` + `minPresenceAhead` | Word repaginates itself | TeX repaginates itself |
| Skills chips / groups | chips / rows | chips / rows | shaded spans / rows | `\colorbox` chips / rows |
| Languages rows / grid / dots | three layouts | three layouts (vector dots) | text / table / ●○ dots | text / tabular / `$\bullet$``$\circ$` dots |
| Interests chips / rows | outlined chips / rows | outlined chips / rows | outlined spans / rows | `\fcolorbox` chips / rows |
| Certificates &c. rows layout | one-line rows | one-line rows | one-line table rows | one-line `\hfill` rows |
| References grid / rows | cards | cards | table cards | minipage cards |
| Blog / garden lists | linked rows + dates | linked rows + dates | linked table rows | `itemize` + `\hfill` dates |
| Localized dates & Present | Intl per language | same strings (shared code) | same strings (shared code) | same strings (shared code) |
| Footer text | every page's bottom margin | every page (fixed text) | real Word footer (every page) | `fancyhdr` footer (every page) |
| Page numbers | per-page overlay | per-page (render prop) | `PAGE / NUMPAGES` fields | `\thepage / \pageref{LastPage}` |
| Photo | rendered | embedded (SVG rasterized to PNG) | embedded (data URI; Word ≥2016) | **omitted** (a .tex file cannot carry the image) |

## Known divergences

These are the format limits, chosen deliberately and kept small:

1. **PDF line breaks.** The PDF is typeset by its own engine, not the
   browser, so a line may wrap a word earlier or later than the preview;
   page geometry, colors, decorations, and pagination rules are identical.
2. **Two-column flow in PDF and Word.** CSS multi-column balancing has no
   equivalent there; both get the section list split in half. LaTeX's
   `multicols` balances like the preview does.
3. **Fonts under pdflatex.** A `.tex` cannot bundle webfonts; pdflatex gets
   the closest stock family (Charter for the serif documents, Helvetica for
   the sans ones) and the export includes a commented `fontspec` block that
   reproduces the exact fonts under xelatex/lualatex.
4. **Full-bleed color in Word and LaTeX.** Neither can paint the page
   margins from content, so the header band and the sidebar rail stop at
   the text block instead of bleeding to the sheet edge. The PDF bleeds.
5. **Heading icons and the photo in LaTeX** are omitted (no way to carry
   lucide glyphs or image bytes inside a single `.tex`).

The footer is a running line in every page's bottom margin in all four
outputs. Everything else is expected to match; a mismatch outside this list
is a bug.

## A react-pdf gotcha worth remembering

A `lineHeight` set on `<Page>` silently suppresses every fixed `render`-prop
`Text` (page numbers, the footer). The line height therefore lives on a
content wrapper `View`, and the fixed elements stay direct children of the
page. Large type (the name) also needs its own `lineHeight`. The multiplier
resolves to an absolute value where it is declared and inherits as such.
