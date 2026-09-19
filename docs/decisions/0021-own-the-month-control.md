# 0021. Pick a month from two lists the builder owns, not from the platform control

Status: Accepted
Date: 2026-09-19

## Context

A person could not choose a year on the entry editor's three date fields. Record [0019](0019-keep-the-picker-indicator-in-the-flow.md) blamed a stylesheet rule that stretched the native picker button across the whole control, and rewrote the rule. The complaint survived the fix, which is what forced this record.

The three fields were `<input type="month">`. What that control offers in Chromium is a popup listing every year as a scrolling run of month grids. The popup is browser chrome, drawn outside the page, so nothing the page can write reaches its size, its scroll position, or its shape.

## Evidence

Clicking across the control at six pixel steps and pressing ArrowUp says which segment a click reached. The walk ran twice on the same field, once with the old overlay rule reinstated and once without, with M for the month segment, Y for the year, and a dot for neither.

```text
x from 4 to 256 step 6
old: ....MMMMMMYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
new: YYMMMMMMMMYYYYYYYYYYYYYYYYYYYYYYYYYYY....MM
```

The year segment answered clicks across most of the control with the old rule in place. So the overlay never blocked the year, and 0019's central claim is false. What the overlay did do is hide the calendar glyph and swallow clicks in the leftmost stretch, which is why removing it was still right.

Screen captures of the open popup show what the obstacle actually is. The month grid is clipped at the top, the years below it run 2027, 2028, 2029 in a scrolling list, and reaching a year decades back means dragging that list through every year in between.

After the change, driving the built page confirms the whole path.

```text
after month only     -> month=03 year=
after year 1998      -> month=03 year=1998
after clearing month -> month= year=1998
stored: "startDate":"1998-03","endDate":"2024-12"
rendered: Mar 1998 – Dec 2024
```

## Options considered

- **Style the popup.** It is drawn outside the page and takes nothing from it, so there is no rule to write. Rejected as impossible rather than unwise.
- **Keep the native control and document the scrolling.** It leaves the field unusable for the dates a resume is mostly made of, which are years back. Rejected.
- **A calendar popover of the project's own.** It would solve the same problem with a positioning, focus trapping, and dismissal surface to maintain, none of which a month needs. Rejected as more machinery than the question has.
- **A free text year box beside a month list.** It accepts "19988" and "nineteen" and pushes the checking into the field. Rejected in favor of a closed list.

## Decision

A month is picked from two selects the project owns, a month list and a year list, wrapped as `MonthField` in `shared/ui` over the value helpers in `shared/lib`. The stored value keeps the `YYYY-MM` shape the document model already reads, so nothing downstream changes.

The parts are held in the component rather than read back from the value, because a half filled pair stores nothing and a fully controlled pair would drop the first choice before the second could be made. An empty value the control itself just produced leaves the parts on screen; any other change replaces them.

The year list runs from five years ahead to sixty back, and a stored year outside that range is added rather than dropped, so opening an old document never quietly loses a date. Month names are abbreviated, because the control sits in a half width column and because it is the form the document prints.

The stylesheet now declares `color-scheme` per theme at the root. The platform draws select popups, scrollbars, and focus rings itself and takes their colors from that rather than from the tokens, so without it a dropdown list opens white over the dark theme.

## Consequences

Any year in range is one list away, and the control behaves the same in every browser rather than inheriting whatever the platform ships. The builder owns one more piece of chrome, and a month name is now the project's string rather than the locale's, which is a thing to revisit if the editor is ever localized; the document's own dates already localize separately.

Because no month input is left, the date-kind rules came out of the stylesheet entirely. The admin panel carried the same control and the same mistaken record, and both were corrected in the same change.
