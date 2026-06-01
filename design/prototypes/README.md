# design/prototypes/

Interactive React + Babel design prototypes. This is the source of truth for UI exploration before anything gets productionized.

## How it loads

`/index.html` (at the repo root) pulls every `.jsx` file in this folder via `<script type="text/babel" src="design/prototypes/...">`. There's no build step — open `index.html` in a browser and it runs.

## Adding a screen

1. Create `screen-<name>.jsx` in this folder
2. At the end of the file, expose components on `window`:
   ```jsx
   Object.assign(window, { ScreenName, SubComponent });
   ```
3. Add a `<script>` tag to `/index.html` **before** `app.jsx`:
   ```html
   <script type="text/babel" src="design/prototypes/screen-<name>.jsx"></script>
   ```
4. Drop the component into a `<DCArtboard>` inside `app.jsx`

## File conventions

| Pattern | Use |
|---|---|
| `screen-*.jsx` | Full screens — one artboard each |
| `*-sheet.jsx` / `*-sheets.jsx` | Modal sheets, overlays, drawers |
| `hof-ui.jsx` | Shared primitives (buttons, cards, wordmark, type) |
| `brand-artifacts.jsx`, `final-artifacts.jsx` | Brand artifacts — emails, tickets, social |
| `posts-data.jsx`, `system-states.jsx` | Static data + state fixtures |
| `*-frame.jsx`, `*-window.jsx`, `design-canvas.jsx` | Frame chrome and the canvas shell |
| `app.jsx` | Root — composes everything into the canvas |

## Gotchas

- **Asset paths are relative to `index.html`**, not to the JSX file. Use `src="assets/hof-logo.png"`.
- **Never name a style object `styles`** — Babel transpiles each `<script>` into the global scope; collisions silently break things. Use `homeStyles`, `ticketStyles`, etc.
- **Load order matters.** Files that depend on `hof-ui.jsx` must come after it in `index.html`. `app.jsx` is always last.

See [`/CLAUDE.md`](../../CLAUDE.md) for the full set of conventions.
