# mdindex

**Markdown table-of-contents generator with GitHub-compatible anchors. Zero dependencies.**

[![CI](https://github.com/efealtiparmakoglu/mdindex/actions/workflows/ci.yml/badge.svg)](https://github.com/efealtiparmakoglu/mdindex/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-20%2B-green.svg)](https://nodejs.org)

```
$ mdindex README.md
<!-- TOC -->
- [Why mdindex](#why-mdindex)
  - [GitHub anchors, done right](#github-anchors-done-right)
<!-- /TOC -->
```

Headings in, clickable table of contents out. Skips fenced code blocks,
strips links and inline code from titles, deduplicates repeated headings
with GitHub's `-1`/`-2` suffixes, and can update the TOC in place between
`<!-- TOC -->` markers.

## Why mdindex

- **GitHub-compatible anchors.** Same slug algorithm: lowercase, punctuation
  stripped, every space a hyphen (no collapsing), Unicode preserved.
- **Code-fence aware.** `#` lines inside ``` fences are never headings.
- **In-place updates.** `--insert` rewrites the block between the TOC
  markers, so re-running after edits is idempotent.
- **Zero dependencies.** Plain Node 20+, standard library only.

## Usage

```sh
mdindex README.md                  # print TOC to stdout
mdindex -d 2 README.md             # headings up to level 2
mdindex -i README.md               # update between <!-- TOC --> markers
mdindex -o toc.md README.md        # write TOC to a file
cat notes.md | mdindex             # stdin
```

| Option | Meaning |
|---|---|
| `-d, --max-depth N` | include headings up to level N (default 3) |
| `-i, --insert` | replace the `<!-- TOC -->…<!-- /TOC -->` block in place |
| `-o, --output FILE` | write the TOC to FILE |

## Development

```sh
npm test
```

## License

MIT — see [LICENSE](LICENSE).
