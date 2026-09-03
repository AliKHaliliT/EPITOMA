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
| `npm run docs` | The living documents against the tree and the calendar |
| `npm run typecheck` | Type-check all projects (the root tsconfig is solution-style; a plain `tsc --noEmit` checks nothing) |

Run `npm test` after touching the resume entity's `store`, the portfolio `source`, or the
export stack: those suites pin the document sync semantics, the import validation, and the
cross-format export parity.

The checks report at two levels. A failure is a verdict, it stops the command, and it
means a rule the tool fully decides has been broken. A warning is advice, it leaves the
exit status clean, and it comes from a check that cannot decide its own question and so
is not allowed to gate. Advice is not noise and not optional reading. Every warning is
looked at and then either fixed or dismissed in writing, in the change that produced it,
and a warning is never silenced with a suppression comment to make a run look clean. The
advisory checks here are the credential and regular-expression heuristics in the lint
configuration, which guess from the shape of a string or a pattern and are wrong often
enough that they cannot be a gate, and the prose-vocabulary grep in CI, which reads an
honest domain term the same as a tell and so advises for review.

## Hard rules

These are non-negotiable. Depth lives in the indexed documents; this is the checklist.

- **An em dash is legal where it clearly beats the comma, the parenthesis, or the period
  it replaces**, and it counts as its paragraph's one flourish. A tracked file carries at
  most two; CI counts that boundary, while the judgment of fit and commit messages stay
  with review.
- **Commit history speaks in the owner's voice alone.** No attribution trailers, no
  Co-Authored-By lines, nothing naming a tool or an assistant in a commit message. Held in
  review, like every commit-message rule.
- **A check may never imply more than it decides.** A green run is a claim, so a check is
  named for the question it actually settles, and a check that cannot settle its question
  advises rather than gates. Whatever it leaves undecided is stated beside the rule as
  review's work, never left to look automated, because the half no tool reaches is the
  half that rots and it rots faster behind a passing signal. This is why the family
  carries no coverage threshold, no maturity score, and no metric standing in for a rule
  it cannot decide.
- **A check that makes a worker damage the work is worse than no check.** When a rule
  fights something real, neither bend the work to earn a green run nor rewrite the rule.
  Pause the work in a state it can resume from, report the conflict, propose the change,
  and wait for the owner's explicit approval, because a rule change slipped into a busy
  diff is a decision nobody made. A length rule cuts filler and never information, a
  repair is verified for its side effects rather than for its intent, and a warning is
  answered rather than avoided, since an advisory a worker silences has become a gate.
- **A completeness claim names its boundary.** Saying that every caller was updated or
  every usage fixed is a fact only when it names the enumerable list it exhausted, a grep,
  a file list, a suite run, that a reader can re-derive. A claim over a region the
  claimant drew itself, such as every edge case considered, is offered as judgment rather
  than fact, because no boundary exists for it to have reached and the claim reports only
  that the claimant stopped finding things. Review probes the second kind, and trusts the
  first only as far as its boundary reaches.
- **A rule binds only where its own text claims to bind.** A length budget governs the
  document whose budget it is, the prose law governs a tracked byte, and a stage's cap
  governs that stage; outside that reach a rule does not apply at all. So nothing is spent
  applying a convention to material it never named, such as trimming or restyling an
  untracked working file that will never ship, and a count taken of such material is a
  measurement rather than a finding to fix.
- **A STATE entry is a claim, not a fact.** Its date is a last-verified stamp with a
  90-day expiry the docs audit enforces in CI. Read STATE.md before starting work, and
  sweep it before starting anything new, deleting every entry that describes finished work
  and re-verifying or deleting any entry the tree no longer confirms. An entry earns Now
  only while its work is genuinely unfinished. Completing work deletes its entry in the
  same change and never replaces it with a narration of the landing, and every change ends
  with a sweep for entries it completed or invalidated, agent and human alike.
- **All prose must read as if a person wrote it.** Never write the clause-colon splice, a
  sentence shaped as claim, colon, elaboration; in prose a colon may only introduce a
  list, a quote, or a label. The softer language-model tells (balanced semicolon
  antitheses, triadic lists, not-X-but-Y reversals) are fine one at a time and forbidden
  stacked, so allow at most one flourish per paragraph and keep the rest plain declarative
  sentences. The full catalog of tells, the vocabulary, and the portability test live in
  the rulebook's Prose section ([docs/CONVENTIONS.md](docs/CONVENTIONS.md#prose)).
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
  breadth stays a judgment call while placement and substitution do not. An invariant with
  no observable output, such as work done once rather than twice, is observed through a
  counting fake at the seam it crosses, and where no seam exists the invariant is asking for
  one. See [decision 0009](docs/decisions/0009-adopt-the-styles-test-contract.md).
- **Follow the doc-comment convention** in the rulebook's code-level section and the
  documentation rules in [docs/CONVENTIONS.md](docs/CONVENTIONS.md); that file is frozen
  and must not be edited.
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

## The delivery gate

A task is not delivered while the gate below has findings. Carry these items from the first line written, because they are cheapest to satisfy while the code is still forming and most expensive as after-the-fact repairs; the closing pass exists to confirm, not to redo.

Closing a task follows one loop: run the checking commands above, weigh the change against every item below, fix what an item names, and repeat. One pass with no findings ends the loop. A finding is a concrete disagreement with a listed item, never general unease; the list is closed, and nothing outside it may generate rework. If the same finding survives three honest fix attempts, stop looping, record the finding and the attempts in STATE.md, and say so plainly when delivering. The names below index a wider literature; where a name's common usage and the rule beside it differ, the rule governs.

- **Cognitive load**: nothing in the change is harder to hold in mind than the task requires.
- **Granularity**: the size of every new unit (function, file, document, the change itself) is a choice, not an accident.
- **Growth honesty**: what each loop's or query's cost grows with is a choice, not an accident, and no change buys a worse growth rate where a construction of equal effort exists.
- **Ubiquitous language**: new names use the vocabulary the tree already speaks.
- **Single source of truth**: the change introduces no second copy of any fact, and anything derived points at its source.
- **Least privilege and surface**: nothing gains more access, exports, or dependencies than the task needs.
- **Adversary honesty**: every change that creates or moves a trust boundary names who it is meant to withstand, and deciding that nobody is attacking it is a decision to write down rather than an assumption to leave implicit.
- **Boundary honesty**: no data crosses a boundary unchecked, and checking happens at the door, once.
- **Loud failure**: every new failure path raises a typed error; nothing is swallowed or silently defaulted.
- **Two hats**: shape changes and behavior changes are separate steps, and no incidental reformatting rides along.
- **Waste**: nothing speculative and nothing the change orphaned is left behind.
- **The measured line**: nothing is made faster without a measurement that demanded it, and every optimization that lands records its measurement and its price.
- **Test honesty**: substitutes stand in only at the declared seams, and time, randomness, and order are controlled.
- **Point-of-use truth**: the doc comment or docstring each export carries is true, not merely present.
- **Intent-split placement**: every documentation change lands in the document whose reader it serves, per the rulebook's species.
- **Decision records**: any choice made here that would be re-litigated without a record gets one now.
- **Debt**: every shortcut taken is written in STATE.md before delivery, never carried in memory.
- **The commands**: every checking command above has passed against the final state of the tree, and every advisory finding printed along the way has been read and then fixed or dismissed in writing.
- **The hard rules**: the change disagrees with no review-held clause of this guide's Hard rules, re-read now, not recalled.

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

The reply travels the same road down. The template's maintainer answers a report with one
file that names, per entry, whether it was kept, adapted, or refused and why, what this
project now reverts in favor of the template's version, and the template commit to align
to next, so the reply is a re-alignment order rather than a verdict to interpret.

Re-alignment is one refactor, not a trickle. Read the decision records the template gained
since the commit named in the README, because every rule change carries one; recopy the
files the style owns verbatim, the rulebook and the docs audit; re-adapt from a diff
whatever was adapted before; run every checking command above; and move the pin in the
README. No changelog is kept, because the records are the changelog and a summary would be
a lossy copy of them.

## Documentation index

This is the single index of the project's technical documentation. A document that is not
listed here does not exist as far as this project is concerned: when you create a
document, register it here in the same change; when you remove one, delist it here.

| Document | What it is and when to read it |
| --- | --- |
| [README.md](README.md) | Human-facing overview: philosophy, structure, and setup. |
| [STATE.md](STATE.md) | Living project state (Now / Next / Deferred / Blocked). Read first, always. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | The annotated map of the whole builder. Read before any structural change. |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md) | The documentation rulebook: document species, schemas, naming. Frozen; owned by the style. Read before writing or changing any documentation. |
| [docs/BASELINE.md](docs/BASELINE.md) | The repository baseline: always-present files, never-tracked files, and their modification rules. Read before adding, removing, or reshaping root-level or dot files. |
| [docs/EXPORT-PARITY.md](docs/EXPORT-PARITY.md) | The cross-format export contract: what the preview, PDF, LaTeX, and Word outputs must agree on. Read before touching any exporter. |
| [docs/decisions/](docs/decisions/) | Immutable decision records holding the project's "why". Read the relevant record before revisiting a settled topic; never edit an accepted record. |

There are no assistant-specific instruction files. Every assistant reads this file
directly. If a tool genuinely cannot read AGENTS.md, give it a one-line shim that imports
or points to this file and nothing more.
