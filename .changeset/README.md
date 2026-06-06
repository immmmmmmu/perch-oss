# Changesets

このディレクトリは [Changesets](https://github.com/changesets/changesets) が管理する。OSS パッケージ（`@perch/core`, `@perch/cli`, `@perch/themes`, `@perch/i18n`）の semver と CHANGELOG を扱う。

## 使い方

```bash
pnpm changeset           # 変更内容を記録
pnpm changeset:version   # version up + CHANGELOG 生成
pnpm changeset:publish   # npm publish --provenance
```

詳細: https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md
