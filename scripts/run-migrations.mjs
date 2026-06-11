// House of Fire — migration runner
// Connects to Supabase Postgres over the wire protocol and runs every .sql
// file in supabase/migrations in order.
//
// Usage:
//   SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.cvhopagpeiuzihivvtnm.supabase.co:5432/postgres" \
//   node scripts/run-migrations.mjs
//
// Get the connection string from:
//   Supabase Dashboard → Project Settings → Database → Connection string → URI
//   (use the "Direct connection" or "Session pooler" URI and paste your DB password)

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('✗ SUPABASE_DB_URL is not set.');
  console.error(
    '  Pass the Supabase Postgres connection string (with password) as SUPABASE_DB_URL.',
  );
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  // Supabase requires TLS; the cert chain is public so we don't pin it here.
  ssl: { rejectUnauthorized: false },
});

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort(); // 001_, 002_ run in numeric order

console.log(`Found ${files.length} migration(s): ${files.join(', ')}`);

try {
  await client.connect();
  console.log('✓ Connected to Postgres');

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    process.stdout.write(`→ Running ${file} ... `);
    // Each file is wrapped in a transaction so a failure rolls back cleanly.
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('done');
    } catch (err) {
      await client.query('ROLLBACK');
      console.log('FAILED');
      console.error(`  ${err.message}`);
      throw err;
    }
  }

  // Quick sanity check — count the tables we just created.
  const { rows } = await client.query(
    `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`,
  );
  console.log(`✓ All migrations applied. public schema now has ${rows[0].n} tables.`);
} catch (err) {
  console.error('✗ Migration run failed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
