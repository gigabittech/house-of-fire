import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Singleton cookie-backed browser client (one Realtime websocket per tab). */
export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
    );
  }
  return browserClient;
}
