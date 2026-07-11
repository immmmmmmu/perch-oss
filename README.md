# perch

> 発信し続ける人のための、生きているプロフィールページ

`perch`（止まり木）は note・Zenn・YouTube・自社ブログ等の複数チャネルに発信する人が、**書き続けるだけで自動的に最新コンテンツが反映されるプロフィールページ**を作れる OSS ツールキットです。

- `@perch/core` — feed fetching, normalization, Markdown rendering, and OGP helpers
- `@perch/cli` — self-hosted static profile generator
- `@perch/theme-*` — bundled themes for different use cases
- `@perch/i18n` — shared ja/en message assets

## ステータス

OSS v0.1 を [GitHub](https://github.com/immmmmmmu/perch-oss) で公開しています。

npm への公開は延期しています。現在は GitHub からクローンして利用・検証してください。

## Theme Direction

For self-hosted pages, `editorial` is the recommended starting theme: it is
designed for writers, consultants, engineers, and teams that want a calm
publication-style profile.

Bundled themes are intentionally use-case based:

- `editorial` — writing, expertise, and trust
- `minimal` — lightweight reading-first page
- `grid` — media-rich post gallery
- `timeline` — public activity log
- `card` — social bio links and latest posts

### Live Theme Gallery

All five bundled themes are deployed side-by-side from the same demo content so
you can compare layouts before choosing one:

- **Gallery index**: https://perch-profile-preview.pages.dev/
- `editorial` — https://perch-profile-preview.pages.dev/editorial/
- `minimal` — https://perch-profile-preview.pages.dev/minimal/
- `grid` — https://perch-profile-preview.pages.dev/grid/
- `card` — https://perch-profile-preview.pages.dev/card/
- `timeline` — https://perch-profile-preview.pages.dev/timeline/

Each demo renders the same `examples/profile/perch.config.yaml` and Markdown body
through a different theme.

## Self-hosted Editing Model

For OSS users, the generated project is designed around a simple editing model:

- change `perch.config.yaml` for profile text, links, metadata, locale, theme,
  and feed URLs
- replace files in `public/` for avatar, OGP image, favicon, and other assets
- run `perch build` to regenerate `dist/`

`perch new` also creates an `AGENTS.md` file inside the generated profile
project. It tells AI agents which files to read first, which files are generated,
and how to verify changes.

## GitHub から試す

```bash
# 前提: Node 22+, pnpm 9+
git clone https://github.com/immmmmmmu/perch-oss.git
cd perch-oss
pnpm install
pnpm build

# プロフィールプロジェクトを生成
node packages/cli/dist/cli.mjs new my-profile --yes
cd my-profile

# 静的サイトを dist/ に生成
node ../packages/cli/dist/cli.mjs build
```

開発時の検証はリポジトリルートで `pnpm typecheck`、`pnpm lint`、`pnpm test` を実行してください。各 package の詳細は当該 README を参照してください。

## ライセンス

`packages/*` は MIT License です。詳細は `LICENSE` と各 package の `LICENSE` を参照してください。

## コントリビューション

OSS package への PR は歓迎です。

詳細: `CONTRIBUTING.md`
