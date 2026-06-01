# packages/

Shared libraries consumed by every app in `apps/`.

## Planned

| Package | Purpose |
|---|---|
| `ui/` | Productionized component library (extracted from `hof-ui.jsx`) |
| `design-tokens/` | Colors, type scale, spacing, radii, motion — single source of truth |
| `brand/` | Logos, wordmarks, brand assets (moved out of `/assets`) |
| `icons/` | Icon set |

## Adding a package

1. Create `packages/<name>/` with a `package.json` (`@hof/<name>`)
2. Wire it into the workspace root (`pnpm-workspace.yaml`, once we add pnpm)
3. Export tokens / components / assets via `index.ts`
4. Consume from apps as `import { Foo } from '@hof/ui'`

Until tooling is set up, packages stay empty placeholders.
