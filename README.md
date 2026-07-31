# EPITOMA

<div align="center">

![License](https://img.shields.io/github/license/AliKHaliliT/EPITOMA) ![Last Commit](https://img.shields.io/github/last-commit/AliKHaliliT/EPITOMA) ![Open Issues](https://img.shields.io/github/issues/AliKHaliliT/EPITOMA)

![EPITOMA](util_resources/readme/logo.svg)

**[Live demo](https://alikhalilit.github.io/EPITOMA/)**

</div>

**The resume builder of the [VITA](https://github.com/AliKHaliliT/VITA) ecosystem.** *Epitoma* is Latin for an abridgment of a larger work, which is exactly what a resume is to a *vita*: this app takes your whole record and condenses it into print-ready resumes and CVs.

Built with React + Vite, one page, no server. Your documents stay in your browser. The repository's documentation and engineering conventions follow [My-Styles](https://github.com/AliKHaliliT/My-Styles).

---

## The ecosystem

EPITOMA is one of three sister repositories:

| App | Role | Demo |
| --- | --- | --- |
| [**VITA**](https://github.com/AliKHaliliT/VITA) | The site: renders the record | [alikhalilit.github.io/VITA](https://alikhalilit.github.io/VITA/) |
| [**TABULARIUM**](https://github.com/AliKHaliliT/TABULARIUM) | The admin panel: edits every ledger | [alikhalilit.github.io/TABULARIUM](https://alikhalilit.github.io/TABULARIUM/) |
| **EPITOMA** (this repo) | The resume builder: condenses the record | [alikhalilit.github.io/EPITOMA](https://alikhalilit.github.io/EPITOMA/) |

All three talk through files rather than imports; this repo carries its own copy of the snapshot contract in `src/types/portfolio.ts` (format `vita-portfolio`, versioned).

---

## Features

- **Two content sources, both read-only.** Import a `portfolio.json` exported by the admin panel, or point the Repo button at any public VITA repository and Sync pulls the profile, palette, and content straight from its head. No token: this app never writes anywhere.
- **Sync that respects your edits.** Refreshing content by source id leaves your section order, hidden entries, custom sections, and styling untouched.
- **A physical preview.** Real separated pages, exactly as they print: no block ever straddles a page boundary, headings keep their first entry, footers run in every page's bottom margin.
- **Templates per document kind** (resumes and CVs get distinct sets), previewed as real typeset miniatures, with a sample-data mode so any look can be judged full-size without your record in the way.
- **A Customize panel built like an instrument**: machined gauge sliders, pixel toggles, font pickers that show every face in itself, option tiles that preview what each choice does, per-pane and global resets.
- **Sidebar layouts** with a full-height tinted rail, per-section main/rail assignment, dark fills that flip their type to light, and dot-rated language proficiency.
- **Four export formats from one layout contract.** PDF generates directly in the browser (embedded fonts, Latin-Extended included, vector icons, one click, no print dialog); Word and LaTeX are structural translations of the same contract; the document `.json` is a perfect backup. [`docs/EXPORT-PARITY.md`](docs/EXPORT-PARITY.md) maps every feature to every format.
- **Localized documents.** Dates and the open-ended range word render in English, UK English, French, German, Spanish, Turkish, or Azerbaijani, in every format.
- **Everything local.** Documents live in your browser's storage; nothing leaves the machine.

---

## Getting started

The [hosted builder](https://alikhalilit.github.io/EPITOMA/) works as-is: click Repo and point it at a public VITA repository (or Import a `portfolio.json` from the [admin panel](https://github.com/AliKHaliliT/TABULARIUM)), then create a Resume or CV. A blank document works too, filled in by hand.

To run it locally:

```powershell
npm install
npm run dev
```

The app opens on port 3200 (VITA runs on 3000 and TABULARIUM on 3100, so all three run side by side).

For contributors and coding agents, see [`AGENTS.md`](AGENTS.md): the vendor-neutral entry point and the full documentation index.

---

## License

This work is under an [MIT](https://choosealicense.com/licenses/mit/) License.
