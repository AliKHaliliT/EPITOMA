# 0001. Adopt the two-species documentation system

Status: Accepted
Date: 2026-07-28

## Context

EPITOMA was extracted from the VITA repository into its own standalone app (VITA's decision
records 0003 and 0004 hold the extraction reasoning from the site's side). A fresh repo
needs its documentation ground rules settled before any other document is written, and the
owner already maintains a house style
([My-Styles](https://github.com/AliKHaliliT/My-Styles)) that VITA follows.

## Options considered

- **Document ad hoc and organize later.** Rejected: this is exactly the drift the house
  system exists to prevent, and "later" reliably never comes.
- **Link to VITA's docs instead of carrying our own.** Rejected: the ecosystem boundary is
  file-based and each repo stands alone; cross-repo doc dependencies would break the moment
  either repo is forked or renamed.
- **Adopt the house documentation system wholesale.** Chosen.

## Decision

The repository adopts the two-species documentation system from My-Styles as practiced in
VITA: `AGENTS.md` as the single entry point and document index, `STATE.md` as the dated
living status board, `docs/CONVENTIONS.md` as the frozen rulebook (carried verbatim from
the house style), `docs/BASELINE.md` as the living root-file rulebook, and immutable
decision records under `docs/decisions/`. The prose rules (no em dashes, at most one
language-model flourish per paragraph) apply to every piece of writing in the repo.

## Consequences

Contributors and agents land on one entry point and find every document from there. Living
documents must be rewritten in place as reality changes, which is ongoing work the repo now
owes. The frozen rulebook can only change through a superseding decision record in the
house style itself.
