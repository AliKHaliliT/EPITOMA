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
| `npm run typecheck` | Type-check all projects (the root tsconfig is solution-style; a plain `tsc --noEmit` checks nothing) |

Run `npm test` after touching the resume entity's `store`, the portfolio `source`, or the
export stack: those suites pin the document sync semantics, the import validation, and the
cross-format export parity.

## Hard rules

These are non-negotiable. Depth lives in the indexed documents; this is the checklist.

- **Prose carries no em dashes.** Not in docs, comments, or UI copy. Use a semicolon to
  join two clauses or parentheses for an aside. CI greps every tracked byte for the
  character; commit messages stay with review.
- **All prose must read as if a person wrote it.** Never write the clause-colon splice, a
  sentence shaped as claim, colon, elaboration; in prose a colon may only introduce a
  list, a quote, or a label. The softer language-model tells (balanced semicolon
  antitheses, triadic lists, not-X-but-Y reversals) are fine one at a time and forbidden
  stacked, so allow at most one flourish per paragraph and keep the rest plain declarative
  sentences.
- **Every tracked byte is public prose.** Confidential facts, private repository names,
  deployment details, and the description of what was withheld and why never enter a
  tracked file or a commit message, even in a private repository, because visibility can
  flip and history is permanent. Such context goes to the untracked `LOCAL.md` at the root
  (see [docs/BASELINE.md](docs/BASELINE.md)); read it when it exists, create it when first
  needed, and when unsure whether a fact is sensitive, ask the owner instead of recording
  it.
- **The layer rule is absolute.** Imports point downward through
  `app -> pages -> features -> entities -> shared`, never up or sideways. A slice is
  entered only through its `index.ts` (suites excepted), and same-layer slices never
  import each other; a concern spanning two of them moves up a layer. The page geometry
  stays with the resume entity because the preview and the exporters both measure it. See
  [decision 0004](docs/decisions/0004-build-the-builder-as-one-way-sliced-layers.md).
- **Content is checked at the door.** An uploaded snapshot passes `isPortfolioSnapshot`;
  an item rebuilt from a fetched seed file passes `validatePortfolioItem`. Never widen a
  type with a cast to make remote content fit. See
  [decision 0005](docs/decisions/0005-check-fetched-seed-files-against-the-contract.md).
- **Colors come only from the token utilities** defined in `src/app/styles/tokens.css`
  (`bg-surface`, `text-ink`, `border-line`, `text-signal`, and so on). Never hardcode a
  color, never reach for a raw palette class, and never spell a token the long way as
  `bg-[var(--surface)]`; a composite value such as a `color-mix()` is the only place the
  variable itself appears. The sheet itself is the deliberate exception, noted below.
- **The environment is read only through `shared/config`.** No other module touches
  `import.meta.env`.
- **Suites mirror the source tree and substitute only at a seam.** One suite per unit under
  test, at the matching path beneath `tests/`. A collaborator is replaced at an architectural
  seam, by a hand-written fake satisfying the contract it stands in for, and never by mocking a
  module's internals, because a test bound to an implementation voids the substitutability the
  layers exist to provide while still passing green. No coverage threshold is imposed, so
  breadth stays a judgment call while placement and substitution do not. See
  [decision 0009](docs/decisions/0009-adopt-the-styles-test-contract.md).
- **Follow the doc-comment convention** in the [README's Conventions section](README.md#conventions)
  and the documentation rules in [docs/CONVENTIONS.md](docs/CONVENTIONS.md); the latter is
  frozen and must not be edited.
- **The documentation rulebook is owned by the style.** [docs/CONVENTIONS.md](docs/CONVENTIONS.md)
  changes only in the Helm template inside the My-Styles repository, never here, and this
  project never diverges from its copy. A rule believed wrong or missing goes upstream
  instead (see [The upstream report](#the-upstream-report)).
- **Motion runs behind `LazyMotion` strict** with the `domMax` feature set (the `Reorder`
  drag lists need it): always import and use `m.` from framer-motion, never `motion.`.
- **Self-containment.** This app imports only npm packages plus its own `src/`. It carries
  its own copies of shared helpers and the portfolio contract
  (`src/shared/contract/portfolio.ts`); nothing is imported from the sister repos, and the
  `format`/`version` fields of the contract keep the sides honest.
- **Content arrives only through `portfolio.json`.** There is no live content source; with
  no import, new documents are blank and Sync is disabled with guidance.
- **The preview is token-independent.** `.resume-page` is an always-white document styled
  entirely by per-document Customize settings; never let app theme tokens leak into it, and
  never touch its print rules casually.
- **Markdown formatting.** Every fenced block gets a language identifier; lists and fences
  are surrounded by blank lines (MD031, MD032, MD040).

## The upstream report

This project follows the Helm client style from the [My-Styles](https://github.com/AliKHaliliT/My-Styles)
repository, and the rulebook it lives under is owned there. When work here surfaces
something the style itself should have had, the improvement is not kept as a local
advantage. Check the template's decision records first, and if the idea was already
considered and rejected there, drop it unless new evidence exists. Otherwise write a
self-contained report entry stating what the improvement is, how it surfaced, why it is
believed better than what the template does today, and that the template's logs hold no
prior ruling, and close it by telling the receiver to verify the claim with research
before adopting it. Then send it upstream. The owner points an agent at the template with
the report; anyone else files it as an issue on My-Styles. The full workflow, including
the qualification gate and the final alignment check that follows integration, is defined
in the template's AGENTS.md.

## Documentation index

This is the single index of the project's technical documentation. A document that is not
listed here does not exist as far as this project is concerned: when you create a
document, register it here in the same change; when you remove one, delist it here.

| Document | What it is and when to read it |
| --- | --- |
| [README.md](README.md) | Human-facing overview: philosophy, structure, setup, and the doc-comment convention. |
| [STATE.md](STATE.md) | Living project state (Now / Next / Deferred / Blocked). Read first, always. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | The annotated map of the whole builder. Read before any structural change. |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md) | The documentation rulebook: document species, schemas, naming. Frozen; owned by the style. Read before writing or changing any documentation. |
| [docs/BASELINE.md](docs/BASELINE.md) | The repository baseline: always-present files, never-tracked files, and their modification rules. Read before adding, removing, or reshaping root-level or dot files. |
| [docs/EXPORT-PARITY.md](docs/EXPORT-PARITY.md) | The cross-format export contract: what the preview, PDF, LaTeX, and Word outputs must agree on. Read before touching any exporter. |
| [docs/decisions/](docs/decisions/) | Immutable decision records holding the project's "why". Read the relevant record before revisiting a settled topic; never edit an accepted record. |

There are no assistant-specific instruction files: every assistant reads this file
directly. If a tool genuinely cannot read AGENTS.md, give it a one-line shim that imports
or points to this file and nothing more.
