/*
 * Featured-works data seam — plan/03-phase2-works-drawer-plan.md §6.
 *
 * Same shape as the site-config seam: the route loader runs on the CLIENT too,
 * so it must never touch src/lib/supabase.server.ts (which carries the enforced
 * `server-only` marker). It is imported here, inside a `createServerFn` module,
 * whose handler body is compiled out of the client bundle.
 *
 * The read is RLS-filtered: `getPublishedProjects()` selects only
 * `is_published = true` and orders by `display_order asc` (docs/PRD.md §5E).
 */
import { createServerFn } from '@tanstack/react-start'

import { getPublishedProjects } from '../lib/supabase.server'
import type { Project } from '../types/database'

/**
 * Layout/DoS guard only — the published set is curated via `display_order`, so
 * this cap is not expected to bind. The editorial index (`[ 01 / 02 ]`) reflects
 * the returned length, so a slice stays internally consistent.
 */
const MAX_FEATURED_PROJECTS = 12

/**
 * The subset of `projects` the landing page renders, derived from the DB row
 * type so the two cannot drift. Only `gallery_images` needs widening: the DDL
 * defaults it to `'{}'` without NOT NULL, so it arrives as `string[] | null`
 * and is normalised to `string[]` here (plan §6).
 *
 * `display_order`, `is_published`, `created_at` and `updated_at` are dropped:
 * the query already applies ordering and the published filter, and the card +
 * drawer never display timestamps — so they never reach the dehydration
 * payload.
 */
export type FeaturedProject = Pick<
  Project,
  | 'id'
  | 'title'
  | 'slug'
  | 'category'
  | 'summary'
  | 'problem_statement'
  | 'solution_statement'
  | 'cover_image_url'
  | 'tech_stack'
  | 'live_url'
  | 'repo_url'
> & { gallery_images: string[] }

export interface FeaturedProjectsResult {
  /** False when the read failed; the section then renders nothing. */
  ok: boolean
  projects: FeaturedProject[]
}

/*
 * The returned value crosses the SSR dehydration boundary, so it must be plain
 * JSON: strings, string arrays and null. Every field below is copied verbatim
 * from a non-null text/array column; no Date, no class instance, no undefined.
 */
function toFeaturedProject(row: Project): FeaturedProject {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    summary: row.summary,
    problem_statement: row.problem_statement,
    solution_statement: row.solution_statement,
    cover_image_url: row.cover_image_url,
    gallery_images: row.gallery_images ?? [],
    tech_stack: row.tech_stack,
    live_url: row.live_url,
    repo_url: row.repo_url,
  }
}

/**
 * Published projects for the Featured Works list (ROADMAP §2.3).
 *
 * Errors are swallowed deliberately, exactly as in the site-config seam: a
 * Supabase outage or a missing env var must degrade the section, not 500 the
 * landing page.
 */
export const getFeaturedProjects = createServerFn({ method: 'GET' }).handler(
  async (): Promise<FeaturedProjectsResult> => {
    try {
      const rows = await getPublishedProjects()

      return {
        ok: true,
        projects: rows.slice(0, MAX_FEATURED_PROJECTS).map(toFeaturedProject),
      }
    } catch (error) {
      console.error('[projects] failed to read projects:', error)
      return { ok: false, projects: [] }
    }
  },
)
