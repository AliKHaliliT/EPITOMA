# 0011. Align with the prose law and the mechanical security rules

Status: Accepted
Date: 2026-08-30

## Context

The style moved past the baseline this project froze at its last alignment, and the
family refuses ratcheting, so the wave lands complete or not at all. Since then the
template named its prose law inside the rulebook, replaced the em-dash ban with a
budget of two per tracked file, split checks into verdicts and advice, adopted the
mechanical security rules with three advisory heuristics, added Adversary honesty as
the delivery gate's nineteenth item, bound every rule to the jurisdiction its text
claims, and required the Node version story to be one number. The reasoning lives in
the style's records 0024 through 0034, once, and is not repeated here.

## Evidence

The frozen rulebook and the pinned audit script were re-copied from the style and
their CI pins updated; `sha256sum` over both copies reproduces the pinned values. The
new lint rules ran against the whole tree and found one thing, the section editor's
`Math.random()` fallback in its entry-id helper, fixed rather than waived as Options
records. After the fix, lint, the docs audit, typecheck, the suites (36 passing), and
the build all passed against the final tree.

## Options considered

- Waive `sonarjs/pseudo-random` for the section editor's id helper, which fell back
  to `Math.random()` where `crypto.randomUUID` was missing. Lost because the fallback
  guarded against environments that no longer exist; every runtime this project
  declares (browsers on the Node 24-built site, the Node test runner) ships
  `randomUUID`, so the honest fix is deleting the fallback, not excusing it.
- Keep the total em-dash ban as a stricter local rule. Lost because a derived project
  never diverges from the rulebook in either direction; the budget is the law now.
- Leave the Node story as it was, with CI on 24 and deploy on 22. Lost because the
  audit now holds floor claims against `engines`, and two numbers for one floor is
  drift already visible.

## Decision

Re-copy `docs/CONVENTIONS.md` and `scripts/audit-docs.mjs` from the style and re-pin
both in CI. Replace CI's em-dash ban with the two-per-file budget and add the
advisory vocabulary grep. Carry the style's new hard rules and the two-level check
contract in AGENTS.md verbatim, add Adversary honesty to the gate, and extend The
commands to cover advisory findings. Adopt the mechanical security lint block with
its three warnings, and reduce the entry-id helper to `crypto.randomUUID()`. Declare
`engines.node >= 24` and build on 24 in both workflows. Append the file-shape
paragraph to the README's Conventions and carry the template's clause-level prose
corrections into the baseline document.

## Consequences

CI now counts em dashes instead of banning them, so review inherits the judgment of
fit the ban used to make trivial. Warnings are part of delivery, read and answered in
the change that produced them, never suppressed. A trust-boundary change owes one
written sentence about its adversary. Entry ids are UUIDs now, longer than the old
compound strings but structurally unguessable, and nothing keyed on the old shape.
The pins mean the next style move fails CI here until the next complete wave, which
is the alignment working as intended.
