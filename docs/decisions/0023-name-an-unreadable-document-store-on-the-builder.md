# 0023. Name an unreadable document store on the builder

Status: Accepted
Date: 2026-09-24

## Context

The style's next alignment brings a lint rule that refuses any `console` call in product code, with the instruction that a diagnostic goes where the failure path already sends it and never to the console. The document store printed one console line when the saved documents failed to parse, and the builder then showed none of them with nothing on the page to say why. The storage helper also printed a console error beside the alert it raises when a write fails. The owner chose, for the site whose portfolio this builder imports, to name such a copy on the page, and the builder follows the same form.

Working through the change surfaced a second fault. The hook skipped its save on the first effect run only. React's strict mode runs an effect twice on mount in development, so the dev build replaced an unreadable store with an empty list on load before anyone touched it. There, a notice saying the documents were still in the browser would have been false.

## Evidence

A production build served locally, with `os_resumes` holding `{not json`, rendered the notice with the parser's reason, `Expected property name or '}' in JSON at position 1 (line 1 column 2)`, and left the stored text as it was. Creating a resume replaced the store with one document and removed the notice in the same render, and a reload showed nothing. A store holding `{}` rendered the notice with the reason `The saved store is not a list of documents.` at phone width in the dark theme without sideways scroll, and the dismiss button hid it while the store stayed as it was.

The dev server was compared both ways over the same planted store. With the original first-run guard the stored text read `[]` after the load while the notice still claimed the documents were there, and with the comparison this change writes the text survived.

The store's suite gained six tests for the read and its refusal, and the store was mutated nine ways before they landed. One mutant recorded no refusal, and the others never forgot a refusal on a clean read, kept it for an emptied store, kept it through a save, let unreadable storage throw, accepted a parse that is not a list, dropped the reason, always returned an empty refusal list, and named unreadable storage. A test failed for each.

## Options considered

- **Drop the console line and say nothing.** An unreadable store would then vanish from the builder with no explanation, and the owner's next save would replace it unseen. Rejected.
- **Copy the refused text to a second key before a save replaces it.** It writes on a read, keeps a copy nothing ever clears, and would still need a notice to say where the copy went. Rejected in favor of naming the key while the text is still there.
- **Leave the dev overwrite for a separate change.** The notice's own sentence would be false in the build the owner develops in, and the comparison that fixes it is also the condition that ends the notice. Rejected.

## Decision

The store's read records a refusal, with the key and the parser's reason, when the saved text does not parse or parses to something other than a list. It forgets the refusal once the store reads cleanly, holds nothing, or is saved over. Storage that cannot be opened at all holds nothing to name. The builder page renders a small notice while a refusal stands, saying which key still holds the documents and that the first document created or imported replaces them, and the notice can be dismissed for the page view.

The hook now saves the collection only once it differs from what the first read returned, rather than on every effect run after the first, so a visit that changes nothing never writes in any build. The same comparison ends the notice, since the first change is the save that replaces the store. The storage helper keeps its one-time alert and loses its console line.

## Consequences

The owner learns in the builder when the saved documents could not be read, which key holds them, and what will replace them, before it happens. The development server no longer writes the store on load, which it did on every visit and which was harmless only for a store that read cleanly. The store's suite pins both kinds of refusal and each way one is forgotten.
