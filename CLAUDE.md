# CLAUDE.md

Conventions for any agent (or human) working in this repo. Keep this short and enforced; expand only when a convention is being broken often enough that documenting it earns its keep.

---

## Toolchain

- **Package manager:** pnpm 10 (workspaces). See `pnpm-workspace.yaml` and root `packageManager` field.
- **Task runner:** Turborepo (`turbo.json`). Run `pnpm dev`, `pnpm build`, `pnpm lint`, etc. — never `cd` into a package to run scripts unless you know what you're doing.
- **TypeScript:** 5.9.x, strict mode, `noUncheckedIndexedAccess` on. Extend `tsconfig.base.json` from every package.
- **Formatter + linter:** Biome 2 (`biome.json`). `pnpm format` to fix, `pnpm format:check` in CI.
- **Versioning:** Changesets (`.changeset/`). After changing a published package, run `pnpm changeset` and commit the generated file with your PR.
- **Node:** pinned via `.nvmrc` (24.x Active LTS). Use `nvm use` or volta.
- **Next.js:** 16.x (Active LTS) for `apps/mobile` and `apps/admin`. Auth/session refresh uses `src/proxy.ts` (Next 16 network boundary).

## Repository map

```
index.html              → Prototype entry. Loads design/prototypes/*.jsx via Babel.
assets/                 → Brand assets (logos, photos) referenced from the prototype.
design/prototypes/      → React + Babel design prototypes. Source of truth for UI exploration.
apps/                   → Production surfaces (mobile / web / tablet / admin). Empty until built.
packages/               → Shared libraries (ui / design-tokens / brand / icons). Empty until extracted.
docs/                   → Design system docs and decision records.
```

When unsure where something belongs, default to `design/prototypes/` — that's where new ideas live until they're worth productionizing.

---

## Prototype conventions (`design/prototypes/`)

### File layout
- One screen per file: `screen-<name>.jsx`
- Sheets and overlays: `<topic>-sheet.jsx` or `<topic>-sheets.jsx`
- Shared primitives go in `hof-ui.jsx` — do not duplicate buttons, cards, or type styles per screen
- Static data fixtures: `posts-data.jsx`, `system-states.jsx`

### React + Babel rules
This project uses inline JSX transpiled by Babel in the browser. Each `<script type="text/babel">` gets its own scope, so:

- **Export components to `window`** at the end of every file you want shared:
  ```jsx
  Object.assign(window, { ScreenHome, HeroBlock, /* ... */ });
  ```
- **Never name a style object `styles`** — collisions will silently break everything. Use a component-prefixed name: `const homeStyles = { ... }` or use inline styles.
- Load order in `index.html` matters. Dependencies (`hof-ui.jsx`, data files) must come before files that consume them. `app.jsx` is always last.

### Pinned React + Babel versions (prototype)

React 19 no longer ships UMD builds. The prototype loads React 19 via an **import map** (`esm.sh`) and exposes `window.React` / `window.ReactDOM` for Babel-in-browser scripts. Babel standalone is pinned in `index.html` (`@babel/standalone@7.29.0` with `integrity` hash). Do not upgrade casually — test all prototype screens after any CDN change.

### Asset paths
Relative to `index.html`, not to the JSX file. So:
```jsx
<img src="assets/hof-logo.png" />        // ✅
<img src="../../assets/hof-logo.png" />  // ❌
```

### Visual language
- **Type:** Clash Display (display), Inter (body), JetBrains Mono (code/data). Loaded from Google Fonts + Fontshare in `index.html`.
- **Background:** `#f0eee9` (warm off-white). Don't introduce new neutrals without a reason.
- **Accent:** House orange `rgba(232,101,26,*)` — used in `hof-glow`, gold badges, press states.
- **Shared utilities:** `.hof-display`, `.hof-mono`, `.hof-press`, `.hof-scroll`, `.hof-btn`. Prefer these over reinventing.
- **Animations:** keyframes live in `index.html` (`hof-shimmer`, `hof-pulse`, `hof-glow`, `hof-scanline`). Reuse, don't redefine.

### Layout primitives
- Prefer `display: flex` / `display: grid` with `gap:` over margin-based spacing
- Artboards are static frames — never nest a `height: 100%` + `overflow: scroll` child inside an artboard. Size the artboard to the content.

---

## When productionizing

Moving something from `design/prototypes/` into `apps/` or `packages/` is a deliberate act, not a copy-paste:

1. Extract tokens (colors, type scale, spacing, radii) into `packages/design-tokens/` first
2. Move components into `packages/ui/` with proper TypeScript types, props, and stories
3. The prototype version stays put — it's a sketch, not a build artifact
4. Update this file if the production conventions diverge from prototype conventions

---

## Do not

- Recreate copyrighted or branded UI from other companies' products. Make original designs.
- Add filler content (lorem ipsum, placeholder stats, decorative icons that aren't earning their place).
- Hand-draw SVG illustrations for imagery — use the photos in `assets/photos/` or a placeholder block.
- Use emoji unless they're already part of the brand vocabulary (they aren't, currently).
- Bulk-rename or restructure files without updating `index.html`'s script tags in the same change.
