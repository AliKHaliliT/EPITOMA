# Export parity

How one document becomes four faithful outputs: the on-screen preview, PDF,
Word (.doc), and LaTeX (.tex). The goal is that every Customize setting means
the same thing in every format, and every known divergence is listed here
rather than discovered by the user.

## Architecture

Perfect parity between two renderers is only guaranteed when one is compiled
from the other. The builder gets that where it can, and shares a single
decision layer everywhere else:

- **Preview ↔ PDF: identical by construction.** The PDF export prints the
  live preview DOM in a window whose `@page` is the exact sheet size with
  zero margins. The preview's pagination pass (no block may straddle a page
  boundary; pushed blocks carry inline padding) travels with the DOM, so the
  PDF breaks pages in exactly the places the preview shows.
- **Word and LaTeX: structural renderers over one contract.** Both are
  generated from the document model through `src/export/layout.ts`, which
  resolves every layout decision exactly once: geometry, the type scale,
  color decisions (including dark-fill ink flipping), heading decorations,
  entry composition, section body shapes, column regions, and proficiency
  ratings. The renderers translate those decisions into what each format can
  express; neither re-decides anything. `src/export/parity.test.ts` pins both
  renderers to the contract.

## Feature → format mapping

| Feature | Preview / PDF | Word (.doc) | LaTeX (.tex) |
| --- | --- | --- | --- |
| Page size & margins | CSS mm + `@page` | `@page WordSection1` size + margins | `geometry`, paper class option |
| Body / name fonts | Google Fonts | font-family stack (uses the fonts if installed) | closest stock font under pdflatex; ready `fontspec` block for exact fonts under xelatex |
| Type scale (base/name/heading/entry) | pt sizes | pt sizes | `\fontsize` commands |
| Line height, element spacing | CSS | CSS line-height, margins | `\baselinestretch`, `\vspace` |
| Accent color & apply-to toggles | inline styles | inline styles | `accent` color, applied per toggle |
| Page tint (color scope: full page) | opaque tint | body bgcolor | `\pagecolor` |
| Header band (+ own fill, dark-ink flip) | full-bleed band | shaded full-width cell (stops at margins) | `\colorbox` over the text block (stops at margins) |
| Border scope | left edge rule | left border on body | *approximated as none* (documented divergence) |
| Heading styles 1–6 | six decorations | paragraph borders / shading | `\ressection` variants |
| Heading case & icons | text-transform + lucide icons | uppercase applied; **icons omitted** | uppercase applied; **icons omitted** |
| Entry layouts 1/2/3 | flex / stacked / inline | table right cell / stacked / inline | `\hfill` / stacked / inline |
| Subtitle style & placement | span styles | span styles | `\textbf`/`\textit`, same/next line |
| Columns: two & mix | CSS columns | balanced two-cell table (approximate flow) | `multicols` (mix: prose spans full width) |
| Sidebar + rail fill + regions | absolute band + two flows | shaded table cell rail | `paracol` + `\backgroundcolor` |
| Skills chips / groups | chips / rows | shaded spans / rows | `\colorbox` chips / rows |
| Languages rows / grid / dots | three layouts | text / table / ●○ dots | text / tabular / `$\bullet$``$\circ$` dots |
| Interests chips | outlined chips | outlined spans | `\fcolorbox` chips |
| Certificates &c. rows layout | one-line rows | one-line table rows | one-line `\hfill` rows |
| References grid / rows | cards | table cards | minipage cards |
| Blog / garden lists | linked rows + dates | linked table rows | `itemize` + `\hfill` dates |
| Localized dates & Present | Intl per language | same strings (shared code) | same strings (shared code) |
| Footer text | pinned to last page bottom | real Word footer (every page) | `fancyhdr` footer (every page) |
| Page numbers | per-page overlay | `PAGE / NUMPAGES` fields | `\thepage / \pageref{LastPage}` |
| Photo | rendered | embedded (data URI; Word ≥2016) | **omitted** (a .tex file cannot carry the image) |

## Known divergences

These are the format limits, chosen deliberately and kept small:

1. **Fonts under pdflatex.** A `.tex` cannot bundle webfonts; pdflatex gets
   the closest stock family (Charter for the serif documents, Helvetica for
   the sans ones) and the export includes a commented `fontspec` block that
   reproduces the exact fonts under xelatex/lualatex.
2. **Full-bleed color.** Word and LaTeX cannot paint the page margins from
   content, so the header band and the sidebar rail stop at the text block
   instead of bleeding to the sheet edge.
3. **Two-column flow.** CSS multi-column balancing (preview/PDF) has no Word
   equivalent; Word gets a two-cell table with the sections split in half.
   LaTeX's `multicols` balances like the preview does.
4. **Heading icons and the photo in LaTeX** are omitted (no way to carry
   lucide glyphs or image bytes inside a single `.tex`).
5. **Footer placement.** The preview pins the footer to the bottom of the
   *last* page; Word and LaTeX put it in the running footer of *every* page,
   which is the native idiom of those formats.

Everything else is expected to match; a mismatch outside this list is a bug.
