# Postgres 17 upgrade (hosted Supabase)

Follow these steps to upgrade your **hosted** Supabase project from Postgres 15 to 17.

## Pre-flight

1. Open Supabase Dashboard → **Project Settings → Database** and note the current version.
2. In the SQL editor, list extensions:

   ```sql
   SELECT * FROM pg_extension ORDER BY extname;
   ```

3. Confirm none of these are installed (they block PG17 on Supabase):
   - `timescaledb`, `plv8`, `plls`, `plcoffee`, `pgjwt`

   This project's migrations do not use any of the above.

## Staging (recommended)

1. Create a Supabase branch or duplicate project if available.
2. Run the platform upgrade: **Project Settings → Infrastructure → Upgrade to Postgres 17**.
3. After upgrade, run migrations from this repo:

   ```bash
   SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.<project-ref>.supabase.co:5432/postgres" \
     pnpm db:migrate
   ```

4. Smoke-test mobile + admin against the upgraded database.

## Production

1. Schedule a maintenance window.
2. Run the same dashboard upgrade on the production project.
3. Re-run `pnpm db:migrate` against production.
4. Regenerate TypeScript types if schema changed:

   ```bash
   supabase gen types typescript --project-id <ref> > apps/mobile/src/lib/database.types.ts
   cp apps/mobile/src/lib/database.types.ts apps/admin/src/lib/database.types.ts
   ```

## Local dev

Local config is set to PG17 in [`supabase/config.toml`](../supabase/config.toml).

If you have an existing local volume on PG15:

```bash
supabase stop
supabase db reset   # destructive — re-applies migrations/
supabase start
pnpm db:migrate     # if needed against remote-style URL
```

See also: [Supabase PG17 upgrade guide](https://supabase.com/docs/guides/platform/upgrading).
