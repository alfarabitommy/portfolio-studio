/*
 * Landing-page data seam — plan/02-phase2-navbar-hero-plan.md §5.
 *
 * This is the ONLY place the browser is allowed to see `site_configs` data.
 * Route loaders run on the client as well as the server, so `supabase.server`
 * can never be imported by the route itself; it is imported here, inside a
 * `createServerFn` module, whose handler body is compiled out of the client
 * bundle (TanStack Start's import-protection plugin treats server-function
 * lookup modules as server-only — see plan §2.3).
 */
import { createServerFn } from '@tanstack/react-start'

import { getSiteConfig } from '../lib/supabase.server'
import type { SiteConfigValueMap } from '../types/database'

export interface LandingConfig {
  /** False when the read failed; the page then degrades instead of throwing. */
  ok: boolean
  availability: SiteConfigValueMap['availability'] | null
  resume: SiteConfigValueMap['resume'] | null
}

/*
 * `site_configs.value` is `jsonb`, so PostgREST hands back whatever shape an
 * admin wrote. These guards keep a typo from reaching the UI as
 * `[object Object]`; an unrecognised payload degrades to `null`, which simply
 * hides the availability pill (plan §5.4).
 */
function isAvailability(value: unknown): value is SiteConfigValueMap['availability'] {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as { label?: unknown; status?: unknown }
  return (
    typeof candidate.label === 'string' &&
    (candidate.status === 'available' || candidate.status === 'busy')
  )
}

function isResume(value: unknown): value is SiteConfigValueMap['resume'] {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as { url?: unknown; updated_at?: unknown }
  return (
    (typeof candidate.url === 'string' || candidate.url === null) &&
    (typeof candidate.updated_at === 'string' || candidate.updated_at === null)
  )
}

/**
 * Live landing-page config: the availability label (never hardcoded) and the
 * CV asset URL (key `resume`, not `cv`).
 *
 * Errors are swallowed deliberately: a Supabase outage or a missing env var
 * must degrade the pill and the download trigger, not 500 the landing page.
 */
export const getLandingConfig = createServerFn({ method: 'GET' }).handler(
  async (): Promise<LandingConfig> => {
    try {
      const [availability, resume] = await Promise.all([
        getSiteConfig('availability'),
        getSiteConfig('resume'),
      ])

      return {
        ok: true,
        availability: isAvailability(availability) ? availability : null,
        resume: isResume(resume) ? resume : null,
      }
    } catch (error) {
      console.error('[site-config] failed to read site_configs:', error)
      return { ok: false, availability: null, resume: null }
    }
  },
)
