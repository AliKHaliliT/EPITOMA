# State

Current project status. Read this before starting work. Format and rules: see
[docs/CONVENTIONS.md](docs/CONVENTIONS.md).

## Now

- The source tree moved to one-way sliced layers after the client template in the style
  family, and the repository content path is now checked against the contract
  (2026-08-04). The reasoning is in decisions 0004 and 0005; the layer rule is enforced by
  review only.
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

- Adopt a boundary linter (eslint-plugin-boundaries or similar) so the layer rule is
  checked rather than reviewed; deferred until the rule has proven itself in practice
  (2026-08-04).
- Normalize the verbose token spelling, where a class string says `bg-[var(--color-card)]`
  and the token utility `bg-card` compiles to the same rule. Both honor the token rule, so
  this is consistency work rather than a fix (2026-08-04).
- Bring every export up to the doc-comment convention. The files touched by the layer move
  carry it; the rest still carry their original informal comments (2026-08-04).
- A house favicon of its own; the app currently reuses the shared pixel-mark (2026-07-28).

## Blocked

- Nothing blocked.
