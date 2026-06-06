# @perch/cli

Self-host CLI for perch. Generates static profile pages from a config file.

License: MIT

## Editing Model

`perch new <project>` creates a small profile project where the user-owned
inputs are intentionally concentrated in two places:

- `perch.config.yaml` — profile text, links, site metadata, locale, theme, and
  feed URLs
- `public/` — avatar, OGP image, favicon, and other static assets

Generated output lives in `dist/` and should not be edited by hand.

The generated project also includes `AGENTS.md` for AI agents. Agents should
read it first, then update `perch.config.yaml` and `public/`, then run
`perch build`.

## Commands

```bash
perch new my-profile
cd my-profile
perch build
perch dev
```
