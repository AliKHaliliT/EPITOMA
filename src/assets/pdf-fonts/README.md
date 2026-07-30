# PDF embedding fonts

Full (non-subset) TrueType faces of the builder's font catalog, embedded into
directly generated PDFs so the exported file carries the exact typography on
any machine, any language the builder supports (the full files include
Latin-Extended for Turkish and Azerbaijani).

Every family is libre, matching the catalog rule in `src/lib/resumeDefaults.ts`:

| Family | License |
| --- | --- |
| Inter | SIL OFL 1.1 |
| Source Sans 3 | SIL OFL 1.1 |
| Lato | SIL OFL 1.1 |
| Roboto | Apache 2.0 |
| Titillium Web | SIL OFL 1.1 |
| Merriweather | SIL OFL 1.1 |
| Lora | SIL OFL 1.1 |
| Source Serif 4 | SIL OFL 1.1 |

Sourced from Google Fonts (fonts.gstatic.com). Three faces per family:
regular, bold, italic. They ship as lazy Vite assets: nothing here loads
until a PDF export actually needs the family.
