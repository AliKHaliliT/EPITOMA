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

Entry descriptions are HTML (alignment and underline survive, which Markdown cannot
represent), edited via `ResumeRichText` and seeded from Markdown through Showdown.
`preview/ResumePreview.tsx` renders the A4 page; `previewStyles.ts` maps a `ResumeStyle` to
CSS. The `.resume-page` is an always-white document, deliberately independent of the app
theme tokens.

Export (`src/export/`) is dependency-free in three formats: **PDF** (opens the
rendered page in a clean print window), **LaTeX** (a `.tex` file compilable with
`pdflatex`), and **Word** (a `.doc` via Word-compatible HTML).

## Known constraints

- Everything is client-side; clearing browser storage deletes all documents.
- The imported snapshot is a point-in-time copy: content edits in the ecosystem require a
  re-export and re-import, which is the deliberate cross-repo contract.
- Framer `Reorder` drag does not respond to synthetic test events; drive it with native
  `PointerEvent`s when testing.
