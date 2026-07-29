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
