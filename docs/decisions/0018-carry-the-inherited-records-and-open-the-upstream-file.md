# 0018. Carry the inherited records and open the upstream file

Status: Accepted
Date: 2026-09-09

## Context

The style moved eight commits past the pin this project carried, and the family
refuses ratcheting, so the wave lands complete or not at all. Three of those
commits reshape what a derived project holds. The style's own decision records
now travel as one `inherited/` folder under `docs/`, byte-identical at the pin,
leaving `docs/decisions/` for this project's own choices alone. The upstream
report becomes `UPSTREAM.md`, a living document with a fixed schema that carries
defects as well as improvements and resolves its own entries at each
re-alignment rather than waiting for a reply. The alignment pin moves out of the
README attribution onto that file's first line. The reasoning lives in the
style's records 0041 through 0050, once, and is not repeated here.

## Evidence

The re-copied audit reported one finding, the new upstream file unregistered in
the index, and passed once its row was added. The sweep the re-alignment
requires found one rule this configuration held that the style's does not, the
fast-refresh export rule switched off for `**/context/*.tsx`, and a search of
`src` and `tests` for a directory or file of that shape found none, so the
waiver had been permitting nothing since the context modules left the tree. The
docs audit, lint, type-check, the fifty-three suites, and the build all passed
against the final tree. The advisory spell check the style added runs `codespell`
through `pipx`, which this machine cannot run because its only Python is the
Windows Store stub, so its first findings are read from the CI log rather than
locally.

## Options considered

- Keep the fast-refresh waiver in case context modules return. Lost because a
  rule switched off for a shape the tree does not have is waste that reviews
  well, and the sweep the style now requires exists to remove exactly that.
- Report the waiver upstream instead of deleting it. Lost because there is
  nothing to report: the style's rule was never fighting this tree, and an
  entry invented to have something to send is worse than none.

## Decision

Re-copy `docs/CONVENTIONS.md` and `scripts/audit-docs.mjs` from the style and
re-pin both in CI, and add the advisory spell check beside the prose grep. Carry
the style's fifty decision records into `docs/inherited/`, registered by one index
row and never edited here. Delete the dead fast-refresh waiver. Open
`docs/UPSTREAM.md` with the alignment pin on its first line and the words
`Nothing open.`, which is the truth once that waiver is gone. Rewrite the guide's
upstream section to the new law, add Upstream honesty to the delivery gate, carry
the baseline's six README schema changes, and replace the README's pin with the
template attribution the schema now fixes.

## Consequences

This project's lint configuration now holds the style's rules and no local
exceptions at all, so a future exception will stand out as the divergence it is
and will owe an upstream entry. The pin has one home, and the next re-alignment
starts by reading it and ends by moving it.
