# @perch-app/theme-timeline

`timeline` is a chronological, dated-marker `perch` theme — posts hang from a vertical time axis with month / year separators. Designed for prolific writers who want a "now / recent / archive" rhythm to be visible at a glance.

License: MIT

## Use

```yaml
# perch.config.yaml
theme: timeline
```

```bash
pnpm add @perch-app/theme-timeline
perch build
```

## Consumption model

This package ships TypeScript / Astro sources directly (`main: ./src/index.ts`). It is consumed by `@perch-app/cli` through Astro / Vite, which resolve TS at build time. **Pure-Node consumers (no bundler) are not supported** in v0.1.

## Customizing

- Marker style (dot / square / pill) via `themeOptions.marker`
- Date locale honored from `perch.config.yaml > locale`
- Tailwind tokens via `tailwind.config.ts`

See `packages/cli/README.md` for the full editing model.
