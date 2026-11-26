# 0027. Sanitize description HTML where the preview renders it

Status: Accepted
Date: 2026-11-26

## Context

The preview renders a document's descriptions as HTML. That HTML has three sources, the
rich-text editor, showdown's rendering of a record's Markdown, and the records a public
repository supplies when the builder pulls from one. Showdown passes raw markup
through, it has published advisories for cross-site scripting with no fixed release, and
the repository the owner names may hold markup the owner did not write. The page keeps no
token, so a script could reach only the documents stored in the same browser, but nothing
stopped it from running there.

## Options considered

- **Check at the door, when a record arrives.** The builder checks everything else there,
  under this project's decision 0005, Check fetched seed files against the contract. It
  would miss the editor's HTML and every description a browser already stored, so the page
  would still render unchecked HTML. Refused.
- **Replace showdown.** It would end one source of markup and leave the other two, and it
  changes how every record renders. Refused for now.
- **Sanitize at the one place the preview turns HTML into page.** Accepted.

## Decision

The description component passes its HTML through `sanitizeHtml` in the shared library,
which hands it to DOMPurify restricted to its HTML profile. Scripts, event handlers, and
`javascript:` links are removed, and the paragraphs, emphasis, lists, and links the editor
and the records produce are kept. A suite holds each removal and the kept formatting, and
it was watched failing against a sanitizer that returned its input unchanged.

## Consequences

Whatever reaches a description, from any of its sources, renders with nothing left that
can execute. DOMPurify becomes the builder's one new runtime dependency and jsdom its test
dependency. The exports read the same stored HTML outside a browser and are unchanged.
