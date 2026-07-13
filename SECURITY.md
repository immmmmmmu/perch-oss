# Security Policy

## Supported versions

| Package                                                             | Supported   |
| ------------------------------------------------------------------- | ----------- |
| `@perch-app/core` (latest minor)                                    | ✅          |
| `@perch-app/cli` (latest minor)                                     | ✅          |
| `@perch-app/i18n`, `@perch-app/themes-shared`, `@perch-app/theme-*` | ✅          |
| Older versions                                                      | best-effort |

## Reporting a vulnerability

**Do not file public GitHub Issues for security vulnerabilities.**

Email: security@imdaas.com

Include:

- Affected package / endpoint
- Reproducer or PoC
- Impact estimate

Acknowledgement within 72 hours; coordinated disclosure target 90 days.

## Scope

In scope:

- All `@perch-app/*` packages

Out of scope:

- Self-hosted deployments using `@perch-app/cli` (please report upstream issues affecting the OSS package)
- Third-party platforms and hosting providers — report to those vendors

## Bounty

No bounty program at this time. We credit reporters in the affected package's
`CHANGELOG.md` upon request.
