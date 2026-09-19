# 0020. Mount nothing on a scroll threshold inside the element that scrolls

Status: Accepted
Date: 2026-09-19

## Context

The preview is a scrolling column of separated sheets whose page count is measured from the laid out content. A back to the first page control appeared once the reader had scrolled past 240 px, mounted by a `scrolled` state the scroll handler set.

Readers reported that the preview shook at a page boundary. Content belonging to the second sheet flickered between the two sheets several times a second, and scrolling back up felt blocked at the boundary, clearing only after one fast long gesture that then started the flicker again.

## Evidence

At rest the preview wrote no styles at all over three seconds, so the trigger had to be the scroll itself.

Creeping `scrollTop` across the 240 px mark and recording the container's `scrollHeight` at each step returned two distinct values.

```text
distinctScrollHeights: [2032, 2068]
```

The 36 px difference is the height of the control, `h-9`. Mounting it added 36 px of scrollable content at the very position that decided whether it should be mounted, so crossing the threshold moved the threshold out from under the reader, the flag flipped back, and the loop ran at the frame rate. The apparent barrier on the way up is the same loop resolving against the direction of travel, which is why only a gesture long enough to clear the whole oscillating band escaped it.

After the change the same probe returned one value in both directions.

```text
distinctScrollHeights: [2032]
```

## Options considered

- **Add hysteresis, showing at 240 px and hiding at 200 px.** It narrows the band the oscillation lives in without removing it, and the band is exactly where a reader lingers at a boundary. Rejected as a wider tolerance around a defect rather than a fix.
- **Throttle the scroll handler.** It slows the flicker to the throttle interval and makes the control feel late. The feedback path survives. Rejected.
- **Move the control out of the scroll container entirely.** It works, and it costs the sticky positioning that keeps the control with the sheet rather than with the viewport chrome. Rejected in favor of keeping the control where it belongs and giving it no height.
- **Keep the state and let scroll anchoring absorb the shift.** Anchoring chases a height the sheet derives from its own page count, which is the second thing fighting the reader at a boundary. Rejected, and anchoring is now switched off on this container.

## Decision

Nothing mounts or unmounts on a scroll threshold inside the element being scrolled. The control is always mounted, sits in a sticky wrapper of zero height, and only its visibility classes change, toggled imperatively rather than through state so a scroll never triggers a render. The container sets `overflow-anchor: none`, because a sheet whose height is derived from its measured page count must not also be chased by the browser.

## Consequences

The preview holds still at a page boundary and scrolls the same in both directions. Any later chrome inside the preview column, a page indicator or a zoom control, has to follow the same shape, present always and contributing no height. The scroll handler no longer causes renders, which also keeps it clear of the measuring pass that assigns each atom its page.
