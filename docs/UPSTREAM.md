# Upstream

Aligned to Helm at `66ba9f5`.

Every entry below is a lead, not a verdict; verify it against the template's own tree before adopting it.

## Open

### 2026-09-24 A child cannot name a domain term where the spelling advisory keeps its ignore list

Kind: defect
Pin: 66ba9f5

**What it is.** The rulebook says a flagged word that is a real term of the domain is named in
the check's ignore list, so the decision is written where the check runs. The spelling advisory
now runs inside the docs audit, and its ignore list is a constant in that script, which a child
carries byte for byte and pins, so a child has no ignore list it may write to. An identifier the
dictionary misreads, such as an icon component whose name lowercases to a listed misspelling,
or a word of another language the product writes on purpose, then prints on every run of every
change, and the only answer left is the same dismissal repeated in every commit message. Reading
a project's own list beside the style's, for instance a file of ignored words the audit passes
to codespell, would put the decision where the check runs again.

**How the work surfaced it.** A re-alignment could not read its CI job log without a token, so
the spelling pass was reproduced with codespell's own default dictionaries over the audit's skip
list. It named an icon component's identifier at five places and four words of other languages
the product writes on purpose, alongside a real plural, a person's name, a fragment of a DOI,
and five places in the carried selftest.

**What was worked around.** Nothing in the tree. The candidates were dismissed in the commit
message of the change that produced them, and the identifier and the other languages' words will
print again on the next run.

**Records checked.** The record that moved the spelling advisory into the audit carried the
workflow's skip and ignore lists into the script and says nothing about a child's own terms,
and the record that named the commit message as the home for a dismissal answers one run
rather than a term that recurs on every run.
