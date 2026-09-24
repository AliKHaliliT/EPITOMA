# Invariants

What must stay true about this builder, one row per claim, each bound to the holder that refuses a violation and graded by what its green is worth. The rulebook's section on the invariants ledger defines the columns and the five rungs; the docs audit holds that every holder is in the tree and prints every claim held by review alone on every run, and whether a claim is true stays with review.

| Claim | Held by | Rung |
| --- | --- | --- |
| Imports point downward only, from app through pages, features, and entities to shared, never back up. | `eslint.config.js` "Imports point downward only" | impossible |
| A slice is entered only through its `index.ts`. | `eslint.config.js` "Enter a slice through its index.ts" | impossible |
| No module outside `shared/config` and the portfolio entity reads `import.meta.env`. | `eslint.config.js` "Read the environment through shared/config" | impossible |
| No module outside the portfolio entity and `shared/config` calls `fetch`. | `eslint.config.js` "HTTP lives in its documented home" | impossible |
| Nothing in product code prints to the console. | `eslint.config.js` "no-console" | impossible |
| No raw palette class ships. | `scripts/audit-docs.mjs` "raw palette class" | impossible |
| No test opens a connection to a host beyond this machine. | `tests/setup.ts` "refused a connection" | impossible |
| An imported file that is not a portfolio export is refused with a readable reason, and nothing is kept. | `tests/src/entities/portfolio/source.test.ts` "throws readable errors for invalid JSON and wrong formats" | listed cases |
| A stored portfolio that fails the contract reads as no portfolio instead of throwing. | `tests/src/entities/portfolio/source.test.ts` "ignores a malformed stored payload instead of throwing" | listed cases |
| A snapshot the site actually exported passes the contract this side validates against. | `tests/src/entities/portfolio/real-snapshot.test.ts` "satisfies the contract this side validates against" | listed cases |
| Sync refreshes a document's content while keeping its style, custom sections, hidden entries, and entry order. | `tests/src/entities/resume/store.test.ts` "preserves style, custom sections, per-entry hidden flags, and entry order" | listed cases |
| A saved document store that does not parse to a list reads as no documents, and its key is named. | `tests/src/entities/resume/store.test.ts` "names a store that does not parse, with its key and the parser's reason" | listed cases |
| An owner's own heading survives a change of the document's language. | `tests/src/entities/resume/headings.test.ts` "leaves an owner's own heading alone" | listed cases |
| A region preset never mutates the document it is applied to. | `tests/src/entities/resume/regions.test.ts` "never mutates the input" | listed cases |
| Pagination leaves no block straddling a page boundary, whatever offset the flow starts at. | `tests/src/entities/resume/pagination.test.ts` "keeps every block off a boundary, whatever offset the flow starts at" | listed cases |
| The LaTeX and Word exports follow the layout contract the preview reads. | `tests/src/features/export-document/parity.test.ts` "renderer follows the contract" | listed cases |
| A stored year outside the month picker's range is kept rather than dropped. | `tests/src/shared/lib/monthValue.test.ts` "keeps a stored year that falls outside the range" | listed cases |
| The sheet stays white and takes nothing from the app's theme tokens. | review | review |
| An unreadable document store stays in the browser, named by the builder's notice, until the first change saves over it. | review | review |
