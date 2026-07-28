# EPITOMA

**The resume builder of the VITA ecosystem.** *Epitoma* is Latin for an abridgment of a
larger work, which is exactly what a resume is to a *vita*: this app takes a
`portfolio.json` snapshot of your whole record and condenses it into print-ready resumes
and CVs.

Built with React + Vite, one page, no server. The repository's documentation and
engineering conventions follow
[My-Styles](https://github.com/AliKHaliliT/My-Styles).

---

## The ecosystem

EPITOMA is one of three sister repositories. [VITA](https://github.com/AliKHaliliT/VITA)
is the public site that renders the record, TABULARIUM is the admin panel that edits it,
and this app turns it into documents. All three talk through files rather than imports;
this repo carries its own copy of the snapshot contract in
`src/types/portfolio.ts` (format `vita-portfolio`, versioned).

---

## Features

- **Import, then build.** Load a `portfolio.json` exported by the admin panel and create a
  Resume or CV whose sections populate themselves from the record. With no import, blank
  documents still work.
- **Sync that respects your edits.** Re-importing refreshes synced content by source id
  while your section order, hidden entries, custom sections, and styling all survive.
- **A live A4 preview** styled by a per-document Customize panel, kept deliberately
  independent of the app's own theme.
- **Three export formats, zero export dependencies**: PDF through a clean print window,
  LaTeX for `pdflatex`, and Word-compatible `.doc`.
- **Everything local.** Documents live in your browser's storage; nothing leaves the
  machine.

---

## Getting started

```powershell
npm install
npm run dev
```

The app opens on port 3200. Import a portfolio from the admin panel's Settings page
(Portfolio export), or click New for a blank document.

For contributors and coding agents, see [`AGENTS.md`](AGENTS.md): the vendor-neutral entry
point and the full documentation index.
