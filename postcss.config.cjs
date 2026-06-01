// Intentionally empty. House of Fire authors plain CSS (no Tailwind/autoprefixer
// pipeline). This file shields the workspace from any postcss.config found
// higher up the directory tree so Vite/Vitest/Storybook don't try to load
// plugins this repo doesn't depend on.
module.exports = { plugins: {} };
