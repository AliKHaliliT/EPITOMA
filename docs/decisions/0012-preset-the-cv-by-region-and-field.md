# 0012. Preset the CV by region and field

Status: Accepted
Date: 2026-09-01

## Context

CV conventions differ by market in settled, checkable ways: North America and
Britain expect no photo and none of the protected personal details, on Letter
or A4 respectively; Germany expects a tabular Lebenslauf with a photo, birth
date, and a signed closing; academia wants the long CV with every publication
while industry wants the short résumé. The builder already owned every knob
these need (page size, language, date format, photo, free-text header chips,
a declaration section, entry limits) but knew none of the rules, so an owner
applying across borders had to know them all. The owner asked for presets and
excluded Iran from the set.

## Options considered

- A separate "market" setting that the renderer interprets at typesetting
  time. Lost because it would make the document depend on a hidden rule table
  to look right, and the owner could no longer see or override what the market
  had decided; a preset that writes into the existing knobs leaves the document
  self-describing.
- Localizing section headings when a region sets the language. Lost for this
  wave because the language setting today governs dates and the open-range
  word only, and claiming a German preset "titles itself Lebenslauf" would be
  false; heading localization is its own decision if wanted.
- Regions folded into the template gallery. Lost because a template is a look
  and a region is a rule set; combining them would multiply cards and confuse
  which choice changed what.

## Decision

Add a `regions.ts` module to the resume entity holding two preset tables and
two pure functions. A region preset sets the page knobs, drops the header
chips the market must not see or adds the ones it expects (empty, for the
owner to fill), and inserts or removes a stable signature block. A field
overlay reorders sections by a stated reading order, lifts or re-applies the
résumé's default entry limits, and sets the field's preferred headings. Both
record their key on the style so the panel shows the current choice, and both
are applied as whole-document changes through a new `onApplyDocument` hook,
since they touch style, header, and sections together. The Customize panel
gains a Region pane between Templates and Page, showing the presets and each
one's guidance notes. Canada, the United States, the United Kingdom, and
Germany ship, plus Academic and Industry overlays.

## Consequences

Applying a region is a starting point, never a lock: every knob it touched
stays editable, and re-applying is idempotent. The guidance notes carry the
part no knob can, the reasons, and they are stated as conventions rather than
legal advice. Adding a market is one table entry, and a market whose rules
need a knob the builder lacks is the signal to add that knob first.
