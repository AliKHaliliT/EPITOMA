# Changelog

Notable changes, written for people who use the builder. This file is a set of records:
once a version is cut its entry is written once and never edited. The format follows Keep a
Changelog; the Unreleased section is the staging area until the first version is tagged.

## Unreleased

### Added

- The builder as a standalone app, extracted from the VITA repository: document list,
  Overview, Content, and Customize workspaces, and a persistent A4 preview.
- The `portfolio.json` import bridge (format `vita-portfolio`, versioned): the app's only
  content source, validated on import and persisted locally.
- Sync semantics that keep structure and style yours while content tracks the portfolio:
  merging by `sourceId` preserves hidden flags, order, custom sections, and headings.
- Dependency-free export to PDF (print window), LaTeX (`.tex` for `pdflatex`), and Word
  (`.doc` via Word-compatible HTML).
- The house documentation system and repository baseline.
- The house theme switch, and palette adoption: importing a portfolio that carries the
  owner's palette restyles the builder chrome to match the site, persistently.
- A Document (.json) download that carries the whole document including its styling, and
  an Import button that recognizes such files and restores them as new documents.
- A wider workspace, five page sizes (A3 to Legal) honored by every export, dashed cut
  guides showing exactly where printed pages end, a live page-count readout, eight
  templates with schematic thumbnails (photo-forward Portrait and Banner included), and a
  Customize panel rebuilt with grouped navigation and house-standard controls.
- Template cards render real typeset miniatures of a sample document instead of abstract
  schematics, the defaults gained breathing room (line height, margins, spacing), and the
  font catalog became fully libre: every family is SIL OFL or Apache 2.0, with Lora
  replacing the proprietary Georgia.
- A sample-data preview mode: a toggle in the Templates pane typesets the fixed sample
  document on the big sheet while you browse looks, with an amber chip on the preview
  marking the state and exiting it; the real document is never touched.
- The document language is wired: month names and the open-ended range word render in
  the chosen language (English, UK English, French, German, Spanish, Turkish, and
  Azerbaijani), the sheet carries the matching lang attribute, and the LaTeX export
  follows. Page and heading tints became opaque blends so a tinted sheet stays paper-white
  under the app dark theme, and the header color scope finally renders its tinted band.
- The controls audit landed: dead settings left (column width, the dots-and-bars accent
  target, the multi palette, entry layout 4, and an invisible header icon field), the mix
  column mode became real (two columns with the summary and declaration spanning full
  width), and preview page numbers are honest, one per printed page instead of a
  hardcoded 1.
- The physical-preview overhaul: the sheet is always a whole number of printed pages
  tall, the footer pins to the final page's bottom wherever content ends, page numbers
  center in each page's bottom margin, oversized formats (A3) scale to fit the preview
  column, and the sheet's shadow no longer reads as a phantom next page.
- Controls that show their work: every segmented option carries a small glyph of its
  effect (entry layouts, the six heading styles in the live accent, column modes, and
  more), sliders are real draggable range inputs, every settings pane has a Reset that
  restores exactly its own fields, heading icons center on the baseline and take a size
  control, and the colored header band's fill is separately controllable with an Auto
  option that derives it from the accent.
- The sample document exercises every setting: grouped skills, language rows, interest
  bubbles, a declaration, and a linked, located experience entry.
- Repo-backed sync, read-only and tokenless: point the Repo button at a public VITA
  repository and Sync pulls the profile, palette, and every content seed straight from
  its head, assembled into the same snapshot shape the admin exports. The file import
  stays as the offline path.
- The EPITOMA identity: the app wears its name and a pixel mark derived from VITA's
  (the mosaic with a dog-eared page corner), in the header and the favicon.
- A true sidebar layout after the researched two-column looks (AltaCV, the executive
  two-tone): a rail column with a full-height fill that bleeds to the page edge, light
  type on dark fills, and per-section main/rail assignment in the Layout pane. Languages
  gained a dot-rating layout that reads proficiency words (Native, Fluent, B2, …).
- Templates are offered per document kind, with three new looks: Rail (tinted sidebar
  resume), Slate (deep-teal rail in light type), and Scholar (single serif column with
  year-only dates, made for long CVs).

- Real pagination: no block ever straddles a printed page boundary (a heading left
  alone at a page's foot travels with its first block), the preview shows physically
  separate pages instead of one long sheet with a dashed line, and the PDF breaks in
  exactly the same places. The preview scrolls inside its own container with a
  scroll-to-top button, entry layouts are visibly distinct in every combination,
  heading icons center at any size, the sample document adopts the real document's
  structure so the Layout and Sections panes act on what the sheet shows, and renaming
  happens in place on the document selector.
- Export parity, engineered instead of hoped for: a single layout contract
  (`src/export/layout.ts`) resolves geometry, colors, heading decorations, entry
  composition, section shapes, and column regions once, and the Word and LaTeX
  renderers are structural translations of it. Word gets real tables instead of
  ignored flexbox, a shaded sidebar rail, chip and dot renderings, and a true footer
  with page-number fields; LaTeX gets the six heading decorations, all three entry
  layouts, `multicols`/`paracol` columns with the rail fill, chips, dots, localized
  dates, and a ready fontspec block for exact fonts. `docs/EXPORT-PARITY.md` maps
  every feature to every format and lists the few deliberate divergences;
  `src/export/parity.test.ts` pins the renderers to the contract.

### Fixed

- Exports grabbed the first rendered sheet in the page, which, once template thumbnails
  became real miniatures, was a thumbnail: PDF, Word, and LaTeX now target the live
  sheet explicitly.
- The Word export used to clone the preview DOM, whose flexbox and grid Word silently
  ignores, garbling the layout; it is now generated structurally from the document
  model.
- Fast-clicking a stepper no longer triggers the browser's text-selection popup, and
  renaming a document replaces the duplicate and delete buttons so neither can act on a
  half-renamed document.
