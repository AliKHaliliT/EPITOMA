# Architecture

## Tech stack

| Layer | Choice |
| ----- | ------ |
| Framework | React 19 + TypeScript |
| Build tool | Vite 7 |
| Styling | Tailwind CSS v4 (design tokens in `src/index.css`) |
| Rich text | `react-quill-new` (entry bodies are HTML) + `showdown` (Markdown seeding) |
| Animation | Framer Motion behind `LazyMotion` (`domMax`, strict) |
| Testing | Vitest (`npm test`) |

## The shape of the app

One page. `src/App.tsx` provides the ground and the reading rail;
`src/ResumeBuilder.tsx` is the whole product: a header, the `DocumentBar` (document
list, New, Import, Sync, Download), the Overview, Content, and Customize tabs, and a
persistent preview. There is no router and no server.

## The portfolio bridge

Content arrives exclusively as a `portfolio.json` file exported by the ecosystem's admin
panel (format `vita-portfolio`, versioned). `src/portfolio/source.ts` validates an
imported file and persists it under `os_resume_portfolio`; `usePortfolio.ts` holds it for
the UI. The app keeps its **own copy of the contract** in `src/types/portfolio.ts`,
and the `format`/`version` fields keep it honest against the exporter. With no import, New
creates blank documents and Sync is disabled with guidance.

## Data model and sync

A `ResumeDocument` (`src/types/resume.ts`) is `{ personal, sections[], style }` plus
metadata; each section holds entries whose `sourceId` links back to the portfolio item.
Documents live in localStorage under `os_resumes` (active id in `os_resumes_active`),
managed by `src/services/resumeService.ts` through the `useResumes` hook.

`createDocument(kind, now, snapshot)` builds a Resume or CV from
`DEFAULT_SECTION_SPECS[kind]` (`lib/resumeDefaults.ts`); the two kinds differ only in that
default set. `syncFromPortfolio(doc, now, snapshot)` refreshes synced sections by merging
on `sourceId`: surviving entries keep their hidden flag and order, removed items drop, new
items append, and custom sections, style, section order, visibility, and headings are all
preserved. Structure and style are yours while content tracks the portfolio.

## Preview and export

Page sizes come from one catalog (PAGE_DIMS in src/types/resume.ts: A3, A4, A5,
Letter, Legal) that the preview, the PDF print window, the LaTeX class options, and the
Word page setup all read, so the dashed cut guides drawn in the preview sit exactly where
the printed page ends. A toolbar above the sheet reads out the format and the live page
count.

Entry descriptions are HTML (alignment and underline survive, which Markdown cannot
represent), edited via `ResumeRichText` and seeded from Markdown through Showdown.
`preview/ResumePreview.tsx` renders the A4 page; `previewStyles.ts` maps a `ResumeStyle` to
CSS. The `.resume-page` is an always-white document, deliberately independent of the app
theme tokens.

Export (`src/export/`) is dependency-free in three formats: **PDF** (opens the
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
`palette` field). When it does, `lib/palette.ts` applies it to the builder chrome as an
override style tag, persists it per browser, and re-applies it on boot, so the app keeps
matching the site between launches; clearing the imported portfolio clears the look too.
The `.resume-page` preview stays token-independent regardless. The Import button routes by
shape: a portfolio feeds content, and a previously exported Document (.json) comes back as
a new document with its styling intact.
