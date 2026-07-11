# @perch/i18n

## 0.1.0

### Minor Changes

- 5460338: Initial public release: feed fetch / OG extract / static profile generation / 5 official themes / ja-en i18n.
  - `@perch/core`: framework-agnostic feed fetching (RSS / Atom / JSON Feed) with parallel retrieval, grace-degrade, OG meta extraction with two-stage cache + SSRF guard, and `defineSource` SDK for custom adapters.
  - `@perch/cli`: `perch new` / `build` / `dev` / `theme` commands. Self-host any profile to a static directory; works with Astro / Vite / Bun.
  - `@perch/i18n`: type-safe Paraglide messages (ja / en) consumed by themes and SaaS UI.
  - `@perch/theme-{minimal,editorial,grid,card,timeline}`: 5 official themes with shared design tokens and Tailwind CSS 4.

  Note: themes ship TS / Astro sources directly (`main: ./src/index.ts`). Pure-Node consumers without a bundler are not supported in v0.1.
