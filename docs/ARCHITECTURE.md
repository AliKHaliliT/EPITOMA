# Architecture

## Tech stack

| Layer | Choice |
| ----- | ------ |
| Framework | React 19 + TypeScript |
| Build tool | Vite 7 |
| Styling | Tailwind CSS v4 (design tokens in `src/app/styles/tokens.css`) |
| Rich text | `react-quill-new` (entry bodies are HTML) + `showdown` (Markdown seeding) |
| Animation | Framer Motion behind `LazyMotion` (`domMax`, strict) |
| Testing | Vitest (`npm test`) |

## The layers and their one rule

The builder is built as one-way sliced layers. Imports point downward, never up
or sideways:

```text
app  ->  pages  ->  features  ->  entities  ->  shared
```

- **app** is the composition root: the bootstrap, the provider stack, and the chrome.
- **pages** is the one page, plus everything only it composes: the document bar, the
  three panels, the section and entry editors, and the builder state hook.
- **features** is rendering a document out to a file (PDF, LaTeX, Word).
- **entities** are the domain nouns. `resume` owns the document model, its storage, its
  page geometry, and how it renders; `portfolio` owns the imported snapshot and the
  repository that can supply one.
- **shared** is the base: the cross-repo file contract, typed configuration, the small
  libraries, the UI kit, and the test helpers.

A slice is entered only through its `index.ts`, suites excepted. Two placements are
worth naming. The page geometry (`layout.ts`) sits with the resume entity rather than
with the exporters, because the on-screen preview and every exporter measure the same
sheet, and an entity may not import a feature. And the builder state hook lives with
the page, because it reaches both entities at once and the page is the layer allowed to
do that. The reasoning is recorded in
[decision 0004](decisions/0004-build-the-builder-as-one-way-sliced-layers.md).

The portfolio contract lives in `shared/contract` rather than with the portfolio entity,
because the resume entity reads it too and same-layer slices may not import each other.
It is pure data with no dependencies, which is what makes that placement honest.

## The shape of the app

One page. `src/app/App.tsx` provides the ground and the reading rail;
`src/pages/builder/BuilderPage.tsx` is the whole product: a header, the `DocumentBar` (document
list, New, Import, Sync, Download), the Overview, Content, and Customize tabs, and a
persistent preview. There is no router and no server.

## The portfolio bridge

Content arrives exclusively as a `portfolio.json` file exported by the ecosystem's admin
panel (format `vita-portfolio`, versioned). `src/entities/portfolio/source.ts` validates an
imported file and persists it under `os_resume_portfolio`; `usePortfolio.ts` holds it for
the UI. The app keeps its **own copy of the contract** in `src/shared/contract/portfolio.ts`,
and the `format`/`version` fields keep it honest against the exporter.

A snapshot arriving as a file is checked whole by `isPortfolioSnapshot` before it is
persisted or read back, and a file that fails says so in words the owner can act on.
The repository path is checked per item instead: seed files fetched from a site
repository are rebuilt into items one at a time, and each one now passes through
`validatePortfolioItem`, which throws a `PortfolioContractError` naming the fetched
file rather than asserting the shape. With no import, New
creates blank documents and Sync is disabled with guidance.

## Data model and sync

A `ResumeDocument` (`src/entities/resume/model.ts`) is `{ personal, sections[], style }` plus
metadata; each section holds entries whose `sourceId` links back to the portfolio item.
Documents live in localStorage under `os_resumes` (active id in `os_resumes_active`),
managed by `src/entities/resume/store.ts` through the `useResumes` hook.

`createDocument(kind, now, snapshot)` builds a Resume or CV from
`DEFAULT_SECTION_SPECS[kind]` (`lib/resumeDefaults.ts`); the two kinds differ only in that
default set. `syncFromPortfolio(doc, now, snapshot)` refreshes synced sections by merging
on `sourceId`: surviving entries keep their hidden flag and order, removed items drop, new
items append, and custom sections, style, section order, visibility, and headings are all
preserved. Structure and style are yours while content tracks the portfolio.

## Preview and export

Page sizes come from one catalog (PAGE_DIMS in src/entities/resume/model.ts: A3, A4, A5,
Letter, Legal) that the preview, the PDF print window, the LaTeX class options, and the
Word page setup all read, so the dashed cut guides drawn in the preview sit exactly where
the printed page ends. A toolbar above the sheet reads out the format and the live page
count.

Entry descriptions are HTML (alignment and underline survive, which Markdown cannot
represent), edited via `ResumeRichText` and seeded from Markdown through Showdown.
`preview/ResumePreview.tsx` renders the A4 page; `previewStyles.ts` maps a `ResumeStyle` to
CSS. The `.resume-page` is an always-white document, deliberately independent of the app
theme tokens.

Export (`src/features/export-document/`) is dependency-free in three formats: **PDF** (opens the
rendered page in a clean print window), **LaTeX** (a `.tex` file compilable with
`pdflatex`), and **Word** (a `.doc` via Word-compatible HTML).

## Licensing posture

Everything the app ships or names is permissively licensed, matching the sister repos:
the dependencies are MIT, ISC, BSD, or Apache, the document font catalog is entirely SIL
OFL or Apache 2.0 families loaded from Google Fonts at runtime, and the sample portrait
in the template cards is the ecosystem's own hand-drawn SVG. No proprietary font is
named anywhere, so documents render identically on every machine.

## Known constraints

- Everything is client-side; clearing browser storage deletes all documents.
- The imported snapshot is a point-in-time copy: content edits in the ecosystem require a
  re-export and re-import, which is the deliberate cross-repo contract.
- Framer `Reorder` drag does not respond to synthetic test events; drive it with native
  `PointerEvent`s when testing.

## Adopting the owner's look

An imported portfolio.json may carry the owner's palette (the contract's optional
`palette` field). When it does, `shared/lib/palette.ts` applies it to the builder chrome as an
override style tag, persists it per browser, and re-applies it on boot, so the app keeps
matching the site between launches; clearing the imported portfolio clears the look too.
The `.resume-page` preview stays token-independent regardless. The Import button routes by
shape: a portfolio feeds content, and a previously exported Document (.json) comes back as
a new document with its styling intact.

## Testing

Three rules hold however broad the suite is. Suites live in `tests/`, mirroring the source
tree, one suite named after the unit it covers. A collaborator is replaced only at an
architectural seam, by a hand-written fake satisfying the contract it stands in for, never by
mocking a module's internals, since a test bound to an implementation voids the
substitutability the layering exists to provide. And no coverage threshold is imposed, because
a percentage gate buys assertions that assert nothing, so breadth stays a judgment call while
placement and substitution do not.

The 3 suites here are characterization tests over the resume service and the portfolio source. They contain no module
mocking at all, which is what made adopting the rule a description of existing practice rather
than a migration. The reasoning is recorded in
[decision 0009](decisions/0009-adopt-the-styles-test-contract.md), and the rule itself is owned by the style.
