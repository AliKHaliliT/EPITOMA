# 0013. Carry the headings into the document's language

Status: Accepted
Date: 2026-09-01

## Context

The language setting rendered dates and the open-range word in seven
languages while every section heading stayed in whatever English the catalog
wrote, so a German Lebenslauf produced by the new region preset (decision
0012) read "Berufserfahrung" nowhere and "Experience" everywhere. That record
named the gap and deferred it; the owner asked for it closed, for every
language the builder speaks rather than German alone.

## Options considered

- Store headings as keys and render them through a translation table. Lost
  because headings are owner-editable text today, exported documents carry
  them as text, and a key-based model would either break every saved
  document or split headings into two kinds the owner has to understand.
- Translate whatever heading text is present. Lost because a heading the
  owner typed is theirs; machine-translating "Things I Am Proud Of" would be
  the builder overwriting a decision it did not make.
- Add a localized document title line (Lebenslauf, Curriculum Vitae). Deferred
  rather than lost. It is a new rendered element, so it would have to land in
  the preview and all three exporters under the parity contract at once, and
  it is a separate question from the headings.

## Decision

Add a `headings.ts` module to the resume entity holding every heading the
builder itself writes, the catalog defaults, the field overlays' variants,
and the signature block's, in each supported locale, with a reverse index so
any known heading in any language resolves to its English key. Translation is
by exact match against that set: a known heading moves to the target
language, and any other heading is returned unchanged. The Language select
and the region presets both go through `setDocumentLanguage`, which carries
the sections along with the style, and the signature block is created in the
region's language, heading and closing line alike. Both Englishes share the
English forms.

## Consequences

Choosing a language now changes the whole sheet, and an owner's own headings
survive every switch by construction rather than by luck. The translation
table is the one place a new language or a new catalog heading has to be
added, and the suite proves every catalog default round-trips through every
language. Resetting the Page pane still restores the English default through
the style alone, so a reset after a language change leaves translated
headings for the owner to switch back, a small seam recorded here rather
than hidden.
