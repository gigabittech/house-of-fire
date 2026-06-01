# apps/

Production app surfaces. Each subfolder is a deployable application that consumes shared code from `packages/`.

## Planned

| App | Stack (TBD) | Purpose |
|---|---|---|
| `mobile/` | React Native or PWA | Member-facing mobile app |
| `web/` | Next.js | Marketing site + member web app |
| `tablet/` | React | Door / venue tablet surface |
| `admin/` | React | Internal admin dashboard |

## When to add an app here

When a surface graduates from `design/prototypes/` and gets a real implementation. See the productionization checklist in [`CLAUDE.md`](../CLAUDE.md).

Until then, this folder stays empty.
