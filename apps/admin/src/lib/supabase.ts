import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types.js';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Cookie-backed browser client — must match middleware/server SSR clients. */
export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
    );
  }
  return browserClient;
}
