# 0019. Keep the date picker indicator in the flow rather than over the control

Status: Accepted
Date: 2026-09-19

## Context

The builder's three date fields are `<input type="month">`, on the entry editor's Date, Start date, and End date. A month control is two editable segments, the month and the year, plus a button that opens the native picker. Every segment has to be reachable by click, because that is how a person moves to the year without walking there from the month with the keyboard.

The stylesheet carried a block written for `input[type="date"]`, a type this app does not contain. Its second rule was not scoped to that type at all.

```css
::-webkit-calendar-picker-indicator {
  background: transparent;
  bottom: 0;
  color: transparent;
  cursor: pointer;
  height: auto;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  width: auto;
}
```

The rule that put the indicator back in the flow, `position: static`, was scoped to `input[type="date"]`. So on the only date-kind inputs the app has, the picker button was an invisible overlay filling the whole control, and every click anywhere in the field landed on it.

## Evidence

A grep of `src/` returned zero occurrences of `type="date"` and three of `type="month"`, all in `src/pages/builder/EntryEditor.tsx`. The styled block therefore matched nothing the app renders, while its unscoped rule governed exactly the inputs that were broken.

The visible symptom follows from the rule and is confirmed by a screenshot of the field. Under the old CSS a month field showed no calendar glyph at all, because the indicator was transparent and stretched to the control's box. Under the new CSS the glyph renders at its own 18 px size at the right edge, with the segments beside it.

Headless Chromium does not open or drive the native month picker, so the click behavior itself was not reproduced in an automated run. The diagnosis rests on the rule, the grep, and the rendered field.

## Options considered

- **Scope the existing overlay to `input[type="month"]` as well.** It would have kept the glyph hidden and the overlay in place, which is the defect itself. Rejected.
- **Replace the month inputs with a hand built month picker.** It would have taken the whole control away from the platform, including keyboard handling, locale ordering, and assistive technology support, to solve a styling mistake. Rejected as far more surface than the problem.
- **Add `position: static` to the unscoped rule.** It would have fixed the geometry while leaving a blanket pseudo-element rule that reaches every input type the app might later add. Rejected for reach.

## Decision

The stylesheet targets `input[type="month"]` and nothing else, and the indicator is styled as an ordinary in-flow element with its own 18 px box. No rule on `::-webkit-calendar-picker-indicator` is written unscoped, and none of them positions the indicator over the control.

## Consequences

The year segment is clickable, and the picker opens from the glyph. A date-kind input added later needs its own selector in this block rather than inheriting a rule written for a different type, which is the point. The same defect existed in the admin panel's forms and was corrected there in the same change.
