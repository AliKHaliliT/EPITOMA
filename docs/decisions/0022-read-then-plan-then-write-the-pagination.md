# 0022. Read, then plan, then write, in one pagination pass

Status: Accepted
Date: 2026-09-19

## Context

The preview shook at a page boundary again. Record [0020](0020-mount-nothing-on-a-scroll-threshold.md) had found a real feedback loop, a control mounted on a scroll threshold inside the scrolling element, and removing it fixed that loop; it was not the only one. What remained was a block at a boundary flickering between the page above and the page below several times a second, and a document that fought scrolling near the boundary.

Pagination walks the blocks of a flow and gives any block that would cross its page's bottom margin a `paddingTop` that carries it to the next page's top margin. The walk read one block's rectangle, decided, wrote its padding, then read the next block's rectangle.

## Evidence

Screen captures showed a section heading and its chips at the foot of one page and again at the head of the next, which is two frames of a fast flip composited by the capture rather than one layout.

The flip reproduces without any scrolling at all. Loading the demo record at A5, where the content reaches a boundary, and watching every `paddingTop` write for two seconds with the document at rest gives 484 writes, alternating between two states forever.

```text
h:sec-11=168, h:sec-14=0
h:sec-11=0,   h:sec-14=172
```

Reading a rectangle forces the pending layout, so a write made part way through the walk is already visible to the rest of it. Measured directly on the running page, clearing one block's padding moves a later block's measured top at once.

```text
laterTop_before: 1209
laterTop_afterAdding100px: 1298
laterTop_afterClearing: 1209
```

The walk's running total of pushes above the current block assumed the rectangles still held every padding the pass began with. Below the first write they no longer did, so each natural position came out one push too high, the decision flipped, and the next pass flipped it back.

With the pass split into read, plan, and write, the same probe at A5 gives 0 writes at rest, and the push is still made. Sweeping three page formats against five vertical margins and three body sizes, forty five documents in all, gives no loop, no block across a boundary, and no disagreement between the per page copies of the sheet.

```text
45 combinations
looping: 0
straddling: 0
sheets disagreeing: 0
```

## Options considered

- **Re-read the whole flow after every write.** It removes the stale measurements and makes the pass quadratic in forced layouts, on a path that runs on every keystroke. Rejected on cost.
- **Add the written push back into the running total as the walk goes.** It patches the arithmetic while leaving a pass whose result depends on how far through it a write happened, which is the property that made the bug. Rejected.
- **Cap the number of passes and accept the last one.** It hides an oscillation behind a limit and leaves the document showing whichever of the two states the cap landed on. Rejected as a silence rather than a fix.
- **Hand pagination to CSS fragmentation.** The preview would lose the shared layout contract the three exporters read, and the same document would no longer paginate identically in the PDF. Rejected.

## Decision

One pass reads every block in a flow, then plans from those measurements alone, then writes. Nothing is measured after the first write.

The planning half is a pure function, `planPushes` in `entities/resume/pagination.ts`, taking the natural top and height of each block and the page geometry and returning one push per block. It is the only part with anything to decide, and it is now covered by a suite the browser is not needed for: a block pushed off a boundary, a heading travelling with the block it introduces, a block taller than a page left alone, and, across fifty eight starting offsets, nothing left across a boundary and the plan reproducing itself from measurements recovered out of its own layout.

## Consequences

The preview settles on one layout and stays there, and scrolling near a boundary is no longer fought by a sheet whose height is changing under it. The read, plan, write shape is now the rule for anything that measures and moves the sheet, and the planner being pure means a pagination question can be asked in a test rather than in a browser.

A measuring pass of this kind should be read with the forced layout in mind. The cost of this defect was not the arithmetic, which was right, but that a read and a write in the same walk are not independent.
