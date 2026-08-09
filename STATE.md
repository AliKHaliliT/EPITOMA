# State

Current project status. Read this before starting work. Format and rules: see
[docs/CONVENTIONS.md](docs/CONVENTIONS.md).

## Now

- CI greps every tracked byte for an em dash before anything installs, so the prose ban
  is checked rather than remembered (2026-08-08).
- The style's test contract is adopted, and the suites already satisfied it. Suites mirror
  `src/`, collaborators are substituted only at a seam, no coverage threshold is imposed, and a
  check found no module mocking anywhere here (2026-08-05). The fifth command is now a named
  `typecheck` script rather than a bare `tsc -b`, so CI and the guide run the same thing.
  Decision 0009 carries the reasoning, and two details of this project's CI travelled
  upstream into the style in exchange.
- The documentation system is the client style's own: the rulebook is a byte-identical
  copy of the Helm template's, the changelog is gone with its trigger unmet, the index
  took the style's shape and finally lists EXPORT-PARITY.md, and improvements now travel
  upstream through the report path in AGENTS.md (2026-08-04). Decision 0008 carries the
  reasoning.
- Every export carries the TSDoc convention now, at 162 of 162, with the weight per export
  following what the convention prescribes rather than applied uniformly (2026-08-04).
- The source tree moved to one-way sliced layers after the client template in the style
  family, and the repository content path is now checked against the contract
  (2026-08-04). The reasoning is in decisions 0004 and 0005.
- The layer rule is now checked by ESLint rather than by review, and the design tokens moved
  to the template's two-layer shape with semantic names behind a `data-theme` attribute
  (2026-08-04). Decisions 0006 and 0007 carry the reasoning. The résumé sheet stays
  token-independent, as it always was.
- The repository is public: badges, the License section, and the sister READMEs' source
  links all resolve for visitors now (2026-08-01).
- The docs baseline synced with the 2026-08-01 My-Styles changes, adopting the sharpened
  human-prose rule and the public-audience rule with the untracked LOCAL.md ledger
  (2026-08-01).
- The workspace grew up: a wide canvas, five page sizes with printed-page cut guides in
  the preview, eight described templates with schematic thumbnails, and a Customize panel
  rebuilt to the house standard (2026-07-29). The publish dress followed: LICENSE,
  badges, the README plaque, and the Pages demo workflow are all in place (2026-08-01).

## Next

- Exercise the full import-sync-export loop against a portfolio.json produced by the
  current VITA demo seed (2026-07-28).

## Deferred

- A house favicon of its own; the app currently reuses the shared pixel-mark (2026-07-28).

## Blocked

- Nothing blocked.
