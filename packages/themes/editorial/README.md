# @perch-app/theme-editorial

`editorial` is a long-form, magazine-style `perch` theme with generous typography, image-aware timeline rows, and a compact profile link rail. It is designed for writers, founders, and essayists with a public publishing trail.

License: MIT

## Use

```yaml
# perch.config.yaml
theme: editorial
```

```bash
pnpm add @perch-app/theme-editorial
perch build
```

## Consumption model

This package ships TypeScript / Astro sources directly (`main: ./src/index.ts`). It is consumed by `@perch-app/cli` through Astro / Vite, which resolve TS at build time. **Pure-Node consumers (no bundler) are not supported** in v0.1.

## Customizing

- Override Tailwind tokens via `tailwind.config.ts` in your project root
- Article cards inherit OGP from `@perch-app/core/og` (no extra config)

See `packages/cli/README.md` for the full editing model.
