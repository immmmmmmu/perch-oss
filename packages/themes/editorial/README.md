# @perch/theme-editorial

`editorial` is a long-form, magazine-style `perch` theme — generous typography, lead images, and a Hero quote slot. Designed for writers and essayists.

License: MIT

## Use

```yaml
# perch.config.yaml
theme: editorial
```

```bash
pnpm add @perch/theme-editorial
perch build
```

## Consumption model

This package ships TypeScript / Astro sources directly (`main: ./src/index.ts`). It is consumed by `@perch/cli` through Astro / Vite, which resolve TS at build time. **Pure-Node consumers (no bundler) are not supported** in v0.1.

## Customizing

- Override Tailwind tokens via `tailwind.config.ts` in your project root
- Provide a Hero quote and lead image via `perch.config.yaml > themeOptions`
- Article cards inherit OGP from `@perch/core/og` (no extra config)

See `packages/cli/README.md` for the full editing model.
