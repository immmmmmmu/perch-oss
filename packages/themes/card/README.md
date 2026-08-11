# @perch-app/theme-card

`card` is a vertical card-stack `perch` theme — each post becomes a clear, clickable card with thumbnail, title, source badge, and excerpt. Optimized for diverse cross-source feeds (Zenn / note / YouTube / Substack).

License: MIT

## Use

```yaml
# perch.config.yaml
theme: card
```

```bash
pnpm add @perch-app/theme-card
perch build
```

## Consumption model

This package ships TypeScript / Astro sources directly (`main: ./src/index.ts`). It is consumed by `@perch-app/cli` through Astro / Vite, which resolve TS at build time. **Pure-Node consumers (no bundler) are not supported** in v0.1.

## Customizing

- Source badge labels via `themeOptions.sourceLabels`
- Card density (compact / comfortable) via `themeOptions.density`
- Tailwind tokens via `tailwind.config.ts`

See `packages/cli/README.md` for the full editing model.
