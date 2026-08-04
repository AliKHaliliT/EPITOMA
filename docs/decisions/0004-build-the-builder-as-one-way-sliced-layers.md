# 0004. Build the builder as one-way sliced layers

Status: Accepted
Date: 2026-08-04

## Context

The builder grew from a scaffold, and it showed most plainly at the root of `src/`.
Eleven components sat directly beside `main.tsx`: the builder shell, the document
bar, three panels, three editors, a modal, and a rich-text field, mixed in with
`icons.ts` and `useResumes.ts`. Below them, `lib/` held the resume defaults and the
palette side by side, so the domain model and a browser utility were the same kind of
thing as far as the tree was concerned.

Nothing in that layout said which way a dependency was allowed to run, and two
consequences had already appeared. The on-screen preview imported the exporters'
`layout.ts` for its page geometry, so the preview depended on the export stack. And
`useResumes.ts` reached into the portfolio source directly, tying document management
to the import mechanism.

The sibling repositories of this ecosystem were moving to the same shape at the same
time, so a reader who learns one learns all three.

## Options considered

- **Leave the flat root and document the intended direction.** Rejected: an unenforced
  direction is what produced the two tangles above.
- **Group by kind, moving components into a `components/` folder.** Rejected: it tidies
  the root and leaves every import direction legal, so the preview could still reach
  into the exporters.
- **One-way sliced layers.** Accepted.

## Decision

Source lives in five layers, and imports point downward only:

```text
app  ->  pages  ->  features  ->  entities  ->  shared
```

A slice is entered through its `index.ts`, suites excepted, and same-layer slices do
not import each other. Three placements resolved the tangles:

- **Page geometry moved to the resume entity.** `layout.ts` measures a sheet, which the
  preview and all three exporters need. Leaving it with the exporters would force the
  preview to import a feature, so it sits with the model it measures and the exporters
  read it downward.
- **Builder state moved to the page.** `useResumes` reaches the resume entity and the
  portfolio entity at once, and the page is the only layer allowed to touch both. Its
  own leading comment already called it builder state.
- **The portfolio contract moved to `shared/contract`.** Both entity slices read it, and
  same-layer slices may not import each other. It is pure data with no dependencies,
  which is what makes putting it below both of them honest rather than expedient.

## Consequences

The direction of every dependency is now a property of where a file sits, and the
preview no longer depends on the export stack.

The page slice is the largest thing in the tree, holding eleven files, which is the
honest cost of a single-page product: everything the one page composes belongs to it.
The builder also keeps its network access inside the portfolio entity rather than a
`shared/api` segment, unlike the admin panel, because there is one caller and one
purpose; a shared segment for a single consumer would be ceremony. No linter checks the
layer rule yet, so it is enforced by review, and a boundary linter is recorded as
deferred rather than adopted unproven.
