/*
 * Client-safe Supabase accessors.
 *
 * This module MUST stay importable from the browser: it may only depend on
 * `@supabase/ssr`'s browser client. Anything that touches request cookies or
 * server-only secrets belongs in `./supabase.server.ts`, which carries the
 * `server-only` marker.
 *
 * See plan/01-phase1-foundation-plan.md §3.4 / §3.5.
 */
import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '../types/database'

/**
 * Browser Supabase client.
 *
 * `createBrowserClient` is a singleton by design (see its `isSingleton`
 * option), so calling this repeatedly — e.g. once per component render — is
 * intended and cheap.
 *
 * Only `VITE_`-prefixed variables are available here; they are inlined into the
 * browser bundle at build time and must therefore never hold a secret.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  )
}
