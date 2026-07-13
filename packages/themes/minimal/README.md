# @perch-app/theme-minimal

`minimal` is the default `perch` theme — a single-column, system-font, low-chrome layout that puts the writer's links and posts first.

License: MIT

## Use

```yaml
# perch.config.yaml
theme: minimal
```

```bash
pnpm add @perch-app/theme-minimal
perch build
```

## Consumption model

This package ships TypeScript / Astro sources directly (`main: ./src/index.ts`). It is consumed by `@perch-app/cli` through Astro / Vite, which resolve TS at build time. **Pure-Node consumers (no bundler) are not supported** in v0.1.

## Customizing

- Override Tailwind tokens via `tailwind.config.ts` in your project root
- Provide your own `public/og-default.png` to brand OGP cards
- Theme-level overrides land in `perch.config.yaml > themeOptions`

See `packages/cli/README.md` for the full editing model.
