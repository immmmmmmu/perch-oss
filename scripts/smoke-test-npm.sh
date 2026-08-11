#!/usr/bin/env bash
# Smoke-test the published CLI from the npm registry in a fresh directory.

set -euo pipefail

cli_spec="${PERCH_CLI_SPEC:-@perch-app/cli@latest}"
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/perch-npm-smoke.XXXXXX")"

cleanup() {
  rm -rf "$work_dir"
}
trap cleanup EXIT

cd "$work_dir"
pnpm dlx "$cli_spec" new sample-profile --yes
cd sample-profile
pnpm install
pnpm build

test -f dist/index.html

if grep -R -I -n \
  --exclude-dir=node_modules \
  --exclude-dir=.perch \
  --exclude-dir=.git \
  -E '/Users/|perch-proposal|\.takt|state/|apps/|sites/imds|NPM_TOKEN|CLERK_SECRET|STRIPE_SECRET' \
  .; then
  echo "Published smoke-test output contains a private or secret reference." >&2
  exit 1
fi

printf 'npm smoke test passed for %s\n' "$cli_spec"
