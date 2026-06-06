# perch demo profile

This directory is the repository-level demo profile used as the source of truth
for the **Theme Gallery** deployed to Cloudflare Pages.

## Edit

- `perch.config.yaml`: demo profile content, links, feeds, and the default theme
- `profile.md`: longer profile body rendered when a theme supports `bioHtml`
- `public/`: OGP image and favicon

When `theme:` is changed here, the gallery rebuild still produces all five
themes — the script in `scripts/build-theme-gallery.mjs` overrides `theme:` per
build, so this file's value only affects single-theme local builds.

## Build a Single Theme Locally

From the repository root:

```bash
pnpm --filter @perch/core build
pnpm --filter "@perch/theme-*" build
pnpm --filter @perch/cli build
node packages/cli/dist/cli.mjs build --config examples/profile/perch.config.yaml --out examples/profile/dist
```

## Build the Full Theme Gallery Locally

```bash
pnpm --filter @perch/core build
pnpm --filter "@perch/theme-*" build
pnpm --filter @perch/cli build
node scripts/build-theme-gallery.mjs
```

This produces:

```
examples/profile/dist/
├── index.html              # gallery landing page (links to all five themes)
├── favicon.svg
├── editorial/index.html    # theme: editorial
├── minimal/index.html      # theme: minimal
├── grid/index.html         # theme: grid
├── card/index.html         # theme: card
└── timeline/index.html     # theme: timeline
```

Open `examples/profile/dist/index.html` in a browser to preview the gallery.

## Publish

The workflow `.github/workflows/cloudflare-profile-preview.yml` runs the gallery
build on push to `main` and hourly (for fresh RSS), then deploys
`examples/profile/dist` to Cloudflare Pages when Cloudflare settings are
configured.
