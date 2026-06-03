/**
 * Strip .js / .jsx suffixes from relative import/export specifiers so Turbopack
 * can resolve TypeScript sources without webpack extensionAlias.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');
const dirs = ['apps', 'packages'];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === 'dist') continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

const files = dirs.flatMap((d) => walk(path.join(root, d)));

let changed = 0;
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const next = src
    .replace(/from\s+(['"])([^'"]+?)(\.(?:js|jsx))\1/g, (_m, q, base) => {
      if (!base.startsWith('.') && !base.startsWith('@/') && !base.startsWith('next/')) return _m;
      return `from ${q}${base}${q}`;
    })
    .replace(/import\s+(['"])([^'"]+?)(\.(?:js|jsx))\1/g, (_m, q, base) => {
      if (!base.startsWith('.') && !base.startsWith('@/') && !base.startsWith('next/')) return _m;
      return `import ${q}${base}${q}`;
    });
  if (next !== src) {
    writeFileSync(file, next);
    changed++;
  }
}

console.log(`Updated ${changed} files`);
