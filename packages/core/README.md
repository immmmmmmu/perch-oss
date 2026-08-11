# @perch-app/core

Framework-agnostic TypeScript core for `perch`. Provides feed fetching, normalization, and OG image extraction.

License: MIT

> 🚧 0.0.0 skeleton — implementation lands in TASK-0003 〜 TASK-0008.

## Goals

- No dependency on Cloudflare runtime bindings (works in Node, Bun, Workers).
- Pluggable storage via `Storage` / `OgStore` interfaces.
- Strict TypeScript types for `NormalizedFeed`, `NormalizedItem`, `FetchResult`.

See `docs/design/2026-05-01-perch-design.md` §3.1 / §4.1.
