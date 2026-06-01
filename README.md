# House of Fire

Monorepo for the House of Fire product surfaces — mobile PWA, web, tablet, admin, and the shared design system that powers them all.

> **Status:** Early-stage. Currently houses interactive design prototypes in `design/prototypes/`. Production app packages will land in `apps/` and `packages/` as they're built.

---

## Quick start

### Run the prototype (no install needed)

```bash
# Open directly, or serve it
open index.html
# or
npx serve .
```

### Set up the monorepo toolchain

```bash
# Use the pinned Node version
nvm use

# Install workspace deps
pnpm install

# Common tasks (Turbo orchestrates across workspaces)
pnpm dev          # run all dev servers
pnpm build        # build everything
pnpm lint         # biome lint
pnpm format       # biome format --write
pnpm typecheck    # tsc across packages
pnpm test         # run tests
```

The prototype is a static React + Babel HTML page. Every screen, sheet, and brand artifact lives as a standalone `.jsx` file under `design/prototypes/` and gets pulled in by `index.html`.

---

## Repository structure

```
house-of-fire/
├── index.html              # Prototype entry point — loads all design/prototypes/*.jsx
├── assets/                 # Brand assets used by the prototype (logos, photos)
│
├── apps/                   # Production app surfaces (to come)
│   ├── mobile/             # iOS/Android — React Native or mobile PWA
│   ├── web/                # Marketing site + member web app
│   ├── tablet/             # Door / tablet surface
│   └── admin/              # Admin dashboard
│
├── packages/               # Shared libraries consumed by apps/
│   ├── ui/                 # Component library (productionized from hof-ui)
│   ├── design-tokens/      # Colors, type, spacing, motion, radii
│   ├── brand/              # Logos, wordmarks, sonic & visual brand assets
│   └── icons/              # Icon set
│
├── design/                 # Design artifacts and explorations
│   └── prototypes/         # Interactive .jsx prototypes (current source of truth)
│
└── docs/                   # Design system docs, guidelines, decision records
```

### Why monorepo

- Shared design tokens, components, and brand assets across every surface
- One place for issues, PRs, and design reviews
- Refactors that touch tokens + ui + apps land atomically
- Small team / early stage — splitting later is easier than merging later

### When to split

Extract a surface into its own repo when it gains an independent team, a wildly different stack, or needs separate access/security boundaries. Until then, keep it in here.

---

## Working with the prototype

The current `index.html` is the live design surface. To add a new screen:

1. Create `design/prototypes/screen-<name>.jsx`
2. At the end of the file, expose components: `Object.assign(window, { ScreenName });`
3. Add a `<script type="text/babel" src="design/prototypes/screen-<name>.jsx"></script>` to `index.html`, **before** `app.jsx`
4. Wire it into `app.jsx` (drop it into a `<DCArtboard>` inside the design canvas)

Asset paths inside `.jsx` files are relative to `index.html`, so `<img src="assets/hof-logo.png" />` works from any prototype file.

### File conventions

- `screen-*.jsx` — full screens (one artboard each)
- `*-sheet.jsx` / `*-sheets.jsx` — modal sheets and overlays
- `hof-ui.jsx` — shared primitives (buttons, cards, type, the wordmark)
- `*-artifacts.jsx` — brand artifacts (emails, tickets, social posts)
- `posts-data.jsx`, `system-states.jsx` — data + state fixtures

---

## Production roadmap

When a surface in `apps/` is ready to start, the path is:

1. **Extract tokens** from `hof-ui.jsx` → `packages/design-tokens/`
2. **Productionize components** from `hof-ui.jsx` + screen files → `packages/ui/`
3. **Stand up the app shell** in `apps/<name>/`, consuming `@hof/ui` and `@hof/design-tokens`
4. **Keep the prototype alive** — `design/prototypes/` stays as the place to explore new ideas before they hit production

### Recommended tooling (when we get there)

- **pnpm workspaces** for package management ✅ configured
- **Turborepo** for task orchestration and caching ✅ configured
- **Changesets** for versioning shared packages ✅ configured
- **Biome** for formatting + linting ✅ configured
- **Playwright** for cross-surface visual regression — add when first app lands

---

## Contributing

See [`CLAUDE.md`](./CLAUDE.md) for conventions enforced across the repo. If you're adding to the prototype, follow the file layout above. If you're starting a production package, open an issue first so we can scope it.
