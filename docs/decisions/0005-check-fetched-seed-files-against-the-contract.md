# 0005. Check fetched seed files against the contract

Status: Accepted
Date: 2026-08-04

## Context

The builder has two ways to acquire content, and they were guarded unevenly.

An uploaded `portfolio.json` was already checked properly. `importSnapshotFile` parses
the text, runs `isPortfolioSnapshot`, and refuses anything else with a message naming
where a real export comes from; `currentSnapshot` re-checks on every read, so a stale or
hand-edited storage value degrades to "no portfolio imported" instead of reaching the UI.

The repository path had no such check. Connecting to a site repository fetches the
individual markdown seed files, rebuilds each one into an item from its frontmatter, and
ended that rebuild with `as unknown as PortfolioItem`. Frontmatter is untyped by nature
and these files arrive over the network from a repository this app does not control, so
that cast was the one place where unverified remote content became a domain object.

## Options considered

- **Leave the cast and rely on the ecosystem contract.** Rejected: the contract is real
  but unenforced, and a missing field would surface later as a broken resume entry with
  nothing pointing back at the file that caused it.
- **Run the assembled collections through `isPortfolioSnapshot`.** Rejected: that guard
  checks a whole snapshot envelope, so it would report "this is not a portfolio" for a
  set of files that is mostly fine, and it could not name the offending file.
- **Check each rebuilt item as it is assembled.** Accepted.

## Decision

`shared/contract/portfolio.ts` gains a `PortfolioContractError` and a
`validatePortfolioItem` that checks the invariants every reader depends on: the item is
an object, it has a usable id, its `type` matches the collection it was filed under, and
its tags are a list. The repository loader calls it where the fetched path is still in
scope, so a broken file names itself.

The guards are hand-written type predicates rather than a schema library, matching
`isPortfolioSnapshot` and `isPalette` which predate this decision, and matching the
sibling repositories.

## Consequences

Both doors into the builder are now checked, and the last unverified cast in the content
path is gone. A malformed seed file fails with its own path in the message instead of
producing an item that breaks a resume section later.

The check is deliberately shallow, so an item can pass and still be missing a field a
particular section wants. That is the accepted limit: the per-collection interfaces
describe an optional-heavy shape on purpose, since the site exports more than the
builder reads, and a deeper guard would start rejecting content the site legitimately
produces.
