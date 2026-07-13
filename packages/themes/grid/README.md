# @perch-app/theme-grid

`grid` is a 3-column responsive `perch` theme that emphasizes thumbnails — ideal for video creators (YouTube), photographers, or anyone whose feed has strong visual identity.

License: MIT

## Use

```yaml
# perch.config.yaml
theme: grid
```

```bash
pnpm add @perch-app/theme-grid
perch build
```

## Consumption model

This package ships TypeScript / Astro sources directly (`main: ./src/index.ts`). It is consumed by `@perch-app/cli` through Astro / Vite, which resolve TS at build time. **Pure-Node consumers (no bundler) are not supported** in v0.1.

## Customizing

- Grid breakpoints are tweakable via `themeOptions.columns` (1 / 2 / 3)
- OGP fallback image: `public/og-default.png`
- Tailwind tokens via `tailwind.config.ts`

See `packages/cli/README.md` for the full editing model.
