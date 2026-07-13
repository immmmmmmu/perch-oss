# @perch-app/cli

Self-host CLI for perch. Generates static profile pages from a config file.

License: MIT

## Quick Start

```bash
pnpm dlx @perch-app/cli@latest new my-profile --yes
cd my-profile
pnpm install
pnpm build
```

## Editing Model

`perch new <project>` creates a small profile project where the user-owned
inputs are intentionally concentrated in two places:

- `perch.config.yaml` — profile text, links, site metadata, locale, theme, and
  feed URLs
- `public/` — avatar, OGP image, favicon, and other static assets

Generated output lives in `dist/` and should not be edited by hand.

The generated project also includes `AGENTS.md` for AI agents. Agents should
read it first, then update `perch.config.yaml` and `public/`, then run
`pnpm build`.

## Commands

```bash
pnpm build
pnpm dev
```
