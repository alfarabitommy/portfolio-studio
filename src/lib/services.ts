/*
 * Services-section vocabulary — docs/UX_UX_Spec.md §3D, docs/ROADMAP.md §2.5.
 * plan/04-phase2-services-contact-plan.md §3.3 and §7.
 *
 * Mirrors src/lib/works.ts and src/lib/site.ts: the section's copy and its
 * per-pillar tags live in one reviewable module so the component stays
 * presentational and the literals cannot drift from the spec.
 *
 * The three pillar TITLES are the spec's own English headings; the summaries
 * are the spec's Indonesian sentences rendered in the site's existing English
 * editorial voice (the same way §3C's "View Case Study" trigger was handled).
 */

export interface ServicePillar {
  /** Stable React key and the `data-pillar` hook used by the gates. */
  id: string
  title: string
  summary: string
  /** Geist Mono chips, rendered as `[ tag ]` (§3C/§3D chip treatment). */
  tags: readonly string[]
}

export const SERVICES_SECTION_EYEBROW = '[ SERVICES ]'

export const SERVICES_SECTION_TITLE = 'Core Competencies'

/** §3D, in the spec's order. The editorial index `[ 01 / 03 ]` is derived from
 * this array's length, so adding a fourth pillar needs no layout change. */
export const SERVICE_PILLARS: readonly ServicePillar[] = [
  {
    id: 'system-web-architecture',
    title: 'System & Web Architecture',
    summary:
      'Large-scale platform builds: server-rendered front ends, database design and query optimisation, caching layers and the performance budget that keeps all of it fast under real traffic.',
    tags: ['SSR', 'PostgreSQL', 'Caching', 'Edge'],
  },
  {
    id: 'product-engineering-ui-ux',
    title: 'Product Engineering & UI/UX',
    summary:
      'Translating design into interfaces that are visually precise and accessible by construction — component systems, interaction motion, keyboard semantics and Core Web Vitals treated as product features.',
    tags: ['React', 'Design Systems', 'Accessibility', 'Motion'],
  },
  {
    id: 'technical-consulting',
    title: 'Technical Consulting',
    summary:
      'Performance audits, Core Web Vitals remediation and legacy modernisation: an outside read on the architecture, a prioritised plan, and hands-on work where the risk actually sits.',
    tags: ['Audits', 'Core Web Vitals', 'Modernisation', 'Reviews'],
  },
] as const
