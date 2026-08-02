# Repository Baseline

The living rulebook for the repository's always-present files: which files must exist,
which must never be tracked, and how each may be modified. Unlike
[CONVENTIONS.md](CONVENTIONS.md) this document is not frozen: the baseline evolves with the
tooling, and a change that reshapes it is recorded as a decision record (the documentation
system's adoption is [0001](decisions/0001-adopt-the-documentation-system.md)).

## Always present

| File | Role | Modification rule |
| --- | --- | --- |
| `README.md` | Human-facing overview. | Living document; its badge, attribution, and License rules are fixed below. |
| `.gitignore` | What git must never track. | Every rule must correspond to the actual stack: add into the matching labeled section, and remove a rule when the tool it serves leaves the project. Never remove a rule that still matches something real without an owner decision. |
| `.gitattributes` | Line-ending and binary policy. | Near-frozen; changes are owner decisions, because they silently rewrite every contributor's checkout. |
| `.editorconfig` | Vendor-neutral editor baseline. | Near-frozen; same reasoning as `.gitattributes`. |
| `package.json` + `package-lock.json` | The dependency manifest and its lockfile. | The lockfile is committed and never hand-edited; it changes only through npm. |
| `index.html`, `vite.config.ts`, `tsconfig*.json`, the ESLint config | The build and type surface. | Present because the app does not build without them. |

The documentation spine (`AGENTS.md`, `STATE.md`, `docs/`) is also always present; it is
governed by [CONVENTIONS.md](CONVENTIONS.md), not by this file.

## The README rules

The README is this project's own overview and evolves with it, under three fixed contracts
inherited from the house style:

1. **Badges** are written in plain Markdown image syntax on a single line, each stating
   something true about this repository. They landed with the publish dress ahead of the
   visibility flip, so they render the moment the repository goes public.
2. **The expansion under the pitch carries the attribution**: one sentence linking the
   house style ([My-Styles](https://github.com/AliKHaliliT/My-Styles)).
3. **The License section body is exactly one line** naming the license and its URL.

Link and image referencing follows the repository boundary: internal document links are
always relative, and images stay relative while the README lives only on GitHub.

## Present when the trigger exists

Triggers are bidirectional: the file appears when its trigger appears and is removed when
its trigger disappears. A conditional file whose trigger is gone is clutter, not caution.

| File | Trigger |
| --- | --- |
| `LICENSE` | The repository is public or dressed to go public. The MIT text landed with the publish dress; it is owner-only and agents never touch it. |
| `CHANGELOG.md` | People use released versions of the tool. |
| `util_resources/` | The repository carries tracked assets. `readme/` holds every image the repository embeds (today the README's logo plaque). |
| `.github/workflows/deploy.yml` | The demo deploys through GitHub Actions to Pages. |
| `.env.example` | Anything reads a `.env`; nothing does today. |

## Never tracked

- Editor and IDE directories (`.vscode/`, `.idea/`).
- Secrets and local environments: any `.env` with real values.
- `LOCAL.md`, the private local ledger, created at the repository root the first time
  something sensitive needs recording. Every tracked byte and every commit message is
  written for a public audience, even while the repository is private, because visibility
  can flip with one settings change and git history keeps every byte ever tracked. So
  confidential facts, private repository names, deployment details, and the description
  of what was withheld and why go here instead of into STATE.md, a decision record, or a
  commit body; the tracked entry carries only the public-safe version, with at most a
  neutral pointer such as "details local". Screenshots get the same review before being
  embedded, since a tracked image is as permanent as tracked text. When it is unclear
  whether a fact is sensitive, surface it to the owner rather than recording it (adopted
  in [decision 0003](decisions/0003-write-tracked-content-for-a-public-audience.md)).
- Anything regenerable: `node_modules/`, `dist/`, coverage, caches.
- Operating-system junk: `.DS_Store`, `Thumbs.db`, `Desktop.ini`.
- Browser-automation scratch: `.playwright-mcp/`.

## Temporary development files

Files created only to support a task in progress are not repository content. Prefer
creating them outside the repository tree in the first place. When one does live inside the
tree, it is purged in the same change that ends its usefulness. If it is unclear whether a
file is still needed, surface it to the owner rather than deleting it or silently leaving
it behind.

## Line endings

`.gitattributes` is the single authority: text files are stored normalized (`* text=auto`),
shell scripts always check out LF, and Windows script formats (`.bat`, `.cmd`, `.ps1`)
always check out CRLF. Binary assets (fonts, icons) are marked binary so git never diffs or
normalizes them. Local `core.autocrlf` settings must never be load-bearing.
