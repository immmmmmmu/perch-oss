# Demo Deployment

This profile is static. RSS updates appear only after a new `perch build`.

The repository workflow handles that by running on:

- push to `main`
- manual `workflow_dispatch`
- hourly schedule

Cloudflare Pages deployment is skipped until these repository settings exist:

- secret `CLOUDFLARE_API_TOKEN`
- variable `CLOUDFLARE_ACCOUNT_ID`
- variable `CLOUDFLARE_PAGES_PROJECT_NAME`

Recommended project name:

```text
perch-profile-preview
```

The workflow still builds and uploads `examples/profile/dist` as an artifact
even when Cloudflare deployment is not configured.
