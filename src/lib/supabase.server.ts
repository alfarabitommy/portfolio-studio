/*
 * Server-only Supabase accessors.
 *
 * The `server-only` marker below is ENFORCED, not decorative: TanStack Start's
 * import-protection plugin marks this module as server-only and fails the build
 * if any client-environment module imports it. That is what keeps
 * `@tanstack/react-start/server` (which must never reach the browser) and the
 * service-role key out of the client bundle — see plan/01-phase1-foundation-plan.md §3.4 / §3.5.
 */
import '@tanstack/react-start/server-only'

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { getCookies, setCookie, setResponseHeader } from '@tanstack/react-start/server'

import type {
  Article,
  Database,
  InboxMessageInsert,
  Project,
  SiteConfigKey,
  SiteConfigValueMap,
} from '../types/database'

/*
 * Environment access rules (plan §3.4):
 * - Read every variable INSIDE the factory, never at module scope: on edge
 *   runtimes env is injected per request, so a module-scope read is undefined.
 * - `process.env` is the only correct source for a server-only secret. The
 *   `VITE_` prefix filter means `import.meta.env.SUPABASE_SERVICE_ROLE_KEY` is
 *   always undefined, so the service-role key is structurally unable to leak
 *   through `import.meta.env`.
 */
function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        'In development add it to .env; in production set it in the Vercel project settings.',
    )
  }
  return value
}

/**
 * Per-request Supabase client backed by request cookies.
 *
 * A NEW client must be created for every request — never share one across
 * requests. `@supabase/ssr` delivers its `Cache-Control: private, no-store`
 * headers only with the first cookie write, so a reused client would leave
 * later responses without them (risking a session token being served from a
 * shared cache).
 *
 * Only call this inside a server function, server route, or middleware:
 * TanStack Start loaders run on the client too, and `getCookies()`/
 * `setCookie()` throw outside an active request.
 */
export function createSupabaseServerClient() {
  return createServerClient<Database>(
    requireEnv('VITE_SUPABASE_URL'),
    requireEnv('VITE_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return Object.entries(getCookies()).map(([name, value]) => ({ name, value }))
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            setCookie(name, value, options)
          })
          Object.entries(headers).forEach(([name, value]) => {
            setResponseHeader(name, value)
          })
        },
      },
    },
  )
}

/**
 * Service-role client for privileged, session-less server work.
 *
 * Uses `@supabase/supabase-js` directly: `@supabase/ssr` is explicitly the
 * wrong tool here, because a service-role client has no user session to persist
 * in cookies.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(
    requireEnv('VITE_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

/*
 * Typed read helpers. These exist so the RLS assumptions from docs/PRD.md §5E
 * live in one reviewable place: every public read filters `is_published = true`
 * and relies on the `anon` SELECT policies.
 */

/** Published projects, in editorial display order. */
export async function getPublishedProjects(): Promise<Project[]> {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

/** Published articles, newest first. */
export async function getPublishedArticles(): Promise<Article[]> {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Read one of the canonical `site_configs` keys (availability pill, CV asset).
 * Returns `null` when the row is absent, so callers can render a fallback.
 */
export async function getSiteConfig<K extends SiteConfigKey>(
  key: K,
): Promise<SiteConfigValueMap[K] | null> {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('site_configs')
    .select('value')
    .eq('key', key)
    .maybeSingle()

  if (error) throw error
  return (data?.value as SiteConfigValueMap[K] | undefined) ?? null
}

/*
 * Typed write helpers. Same purpose as the read helpers above: the RLS
 * assumption lives next to the call instead of at the call site.
 */

/**
 * Store one public contact-form submission (docs/PRD.md §4A.1 item 5,
 * ROADMAP §2.6).
 *
 * `.insert()` is called WITHOUT `.select()` on purpose. Chaining `.select()`
 * makes PostgREST emit `INSERT … RETURNING *`, which requires the SELECT
 * privilege that `anon` deliberately does not have (docs/PRD.md §5E: `anon` may
 * only INSERT into `inbox_messages`; SELECT/UPDATE/DELETE are `authenticated`
 * only). The supabase-js default `Prefer: return=minimal` keeps the request on
 * the granted verb — and it is also why the row cannot be read back here.
 *
 * The client is created per call (never at module scope): see the note on
 * `createSupabaseServerClient` above.
 */
export async function insertInboxMessage(message: InboxMessageInsert): Promise<void> {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('inbox_messages').insert(message)

  if (error) throw error
}
