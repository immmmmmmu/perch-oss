#!/usr/bin/env bash
#
# release-dryrun.sh — TASK-0019 OSS v0.1 release dry-run validator
#
# What it does:
#   1. Builds all OSS packages
#   2. Runs `pnpm changeset status` to confirm pending releases
#   3. For each OSS package, runs `pnpm publish --dry-run` (no auth, no network)
#      through the same package-manager path used by Changesets
#
# Use:
#   bash scripts/release-dryrun.sh
#
# Notes:
#   - `changeset publish` itself has no `--dry-run` flag (as of @changesets/cli
#     v2.27); we validate per-package with `pnpm publish --dry-run` instead.
#   - The initial release intentionally has no pending changeset: Changesets
#     publishes the existing versions directly when NPM_TOKEN is present.
#
# Exit non-zero if any step fails. Safe to run with NPM_TOKEN unset.

set -euo pipefail

OSS_PACKAGES=(
  "packages/core"
  "packages/cli"
  "packages/i18n"
  "packages/themes/_shared"
  "packages/themes/minimal"
  "packages/themes/editorial"
  "packages/themes/grid"
  "packages/themes/card"
  "packages/themes/timeline"
)

cyan() { printf '\033[36m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
red() { printf '\033[31m%s\033[0m\n' "$*"; }

cyan "==> 1/3: Building OSS packages"
pnpm -r --filter "@perch-app/*" build

cyan "==> 2/3: changeset status"
pnpm changeset status

cyan "==> 3/3: pnpm publish --dry-run for each OSS package"
fail=0
for pkg_dir in "${OSS_PACKAGES[@]}"; do
  cyan "  -- ${pkg_dir} --"
  if ! ( cd "${pkg_dir}" && pnpm publish --dry-run --access public --no-git-checks 2>&1 | grep -E "(npm notice|npm error|name:|version:|filename:|Tarball)" ); then
    red "  FAIL: ${pkg_dir}"
    fail=1
  fi
done

if [ "$fail" -ne 0 ]; then
  red "✗ release dry-run encountered errors"
  exit 1
fi

green "✓ release dry-run complete"
