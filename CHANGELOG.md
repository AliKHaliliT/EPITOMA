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
