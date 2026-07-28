# EPITOMA

The resume and CV builder of the VITA ecosystem. It imports a `portfolio.json` snapshot
exported by the companion admin panel, composes resumes and CVs from it, and exports
print-ready PDF, LaTeX, and Word documents. React and Vite, one page, no server; every
document lives in the browser's localStorage.

This file is the single entry point for any contributor, human or agent. Read
[STATE.md](STATE.md) first to learn what is in flight, then this file for the rules, then
the indexed document that covers whatever you are about to touch.

## Commands

| Command | Purpose |
| ------- | ------- |
| `npm install` | Install dependencies |
| `npm run dev` | Vite dev server on port 3200 (strict) |
| `npm run build` | Type-check then production build to `dist/` |
| `npm test` | Vitest suites for the service and the portfolio source |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check without emitting |

Run `npm test` after touching `resumeService` or `portfolio/source`: those suites pin the
document sync semantics and the import validation.

## Hard rules

These are non-negotiable. Depth lives in the indexed documents; this is the checklist.

- **Prose carries no em dashes.** Not in docs, comments, or UI copy. Use a colon for an
  explanatory clause, a semicolon to join two clauses, or parentheses for an aside.
- **All prose must read as if a person wrote it.** The language-model tells (colon-led
  definitions, balanced semicolon antitheses, triadic lists, not-X-but-Y reversals) are fine
  one at a time and forbidden stacked: at most one such flourish per paragraph.
- **Motion runs behind `LazyMotion` strict** with the `domMax` feature set (the `Reorder`
  drag lists need it): always import and use `m.` from framer-motion, never `motion.`.
- **Self-containment.** This app imports only npm packages plus its own `src/`. It carries
  its own copies of shared helpers and the portfolio contract
  (`src/resume/types/portfolio.ts`); nothing is imported from the sister repos, and the
  `format`/`version` fields of the contract keep the sides honest.
- **Content arrives only through `portfolio.json`.** There is no live content source; with
  no import, new documents are blank and Sync is disabled with guidance.
- **The preview is token-independent.** `.resume-page` is an always-white document styled
  entirely by per-document Customize settings; never let app theme tokens leak into it, and
  never touch its print rules casually.
- **Markdown formatting.** Every fenced block gets a language identifier; lists and fences
  are surrounded by blank lines (MD031, MD032, MD040).

## Documentation index

A document that is not listed here does not exist: no reader can be expected to find it.
Register a new document in this table in the same change that creates it.

| Document | Species | Read it when |
| -------- | ------- | ------------ |
| [STATE.md](STATE.md) | living | Always first: what is Now, Next, Deferred, or Blocked |
| [README.md](README.md) | living | Human-facing overview and getting started |
| [CHANGELOG.md](CHANGELOG.md) | records | What shipped, per release |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | living | Before any structural change: data model, bridge, export |
| [docs/BASELINE.md](docs/BASELINE.md) | living | Which root files must exist, which are never tracked, and why |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md) | living, frozen | Before writing any document: the rulebook, never edited directly |
| [docs/decisions/](docs/decisions/) | records | Why a durable choice was made; cite by number, never edit |

There are no assistant-specific instruction files: every agent reads this one.
