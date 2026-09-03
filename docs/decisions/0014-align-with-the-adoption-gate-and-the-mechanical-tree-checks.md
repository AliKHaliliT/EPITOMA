# 0014. Align with the adoption gate and the mechanical tree checks

Status: Accepted
Date: 2026-09-03

## Context

The style moved past the commit this project was aligned to, and the family
refuses ratcheting, so the wave lands complete or not at all. Since that pin the
style defined when a re-alignment is done, moved the code-level documentation
convention out of the README and into the rulebook, shortened the `Now` horizon
to thirty days, and taught the docs audit to hold the tree itself: every
directory and root file needs a room in the map or the baseline, and every record
its immutability across git history. The reasoning lives in the style's records
0035 through 0037, once, and is not repeated here.

## Evidence

The re-copied audit reported thirteen findings against this tree before any fix,
because the map carried the layer diagram but never drew the tree itself, so
seven directories and six root files had no room. The new
`jsdoc/check-param-names` rule found two real drifts in the layout contract: a
`@param style` left behind on `sectionShape` after the parameter went away, and
`splitRegions` documenting its two parameters in the opposite order to its
signature. After the fixes the docs audit, lint, type-check, the fifty-three
suites, and the build all passed against the final tree.

## Options considered

- Add the vanished `style` parameter back to `sectionShape` so the comment
  becomes true again. Lost because nothing needs it; the section's own layout
  decides the arrangement, and the comment was describing a signature that had
  moved on.
- Leave the parameter order in `splitRegions` alone as harmless. Lost because the
  order is exactly what a reader matches against the call site, and a check that
  can decide the question is worth more than the habit of ignoring it.

## Decision

Re-copy `docs/CONVENTIONS.md` and `scripts/audit-docs.mjs` from the style and
take the template's finished CI workflow, which brings the full-history clone,
the audit after the install, and both new pins. Draw the whole tree into the map,
add an Exemplars section, adopt `jsdoc/check-param-names` and fix the two
docstrings it flagged, carry the baseline's two README schema changes, collapse
the README's Conventions section to the two canonical paragraphs, name the
template commit in the attribution, and carry the guide's new clauses.

## Consequences

A new directory or root file here now fails the audit until the map admits it.
CI clones full history, costing a little time and buying the record-immutability
check. The README carries no law of its own, so a convention question has exactly
one home, and the pinned commit in the attribution is where the next re-alignment
starts.
