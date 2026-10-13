/*
 * Core Competencies & Services — docs/UX_UX_Spec.md §3D, docs/ROADMAP.md §2.5.
 * plan/04-phase2-services-contact-plan.md §5 Step 4 and §7.
 *
 * "Elevated Monolithic Grid": the open hairline structure of §3D is kept — no
 * bento boxes, no cards — and the depth comes from LIGHT and SPACE instead of
 * chrome: uniform padding, an ambient radial wash tinted with `--accent-glow`,
 * etched micro-badges and a few kinetic details. Everything is CSS.
 *
 * Fully SSR-rendered: every input is a module constant, so the server markup
 * and the first client render are identical by construction.
 *
 * Motion contract: this component imports nothing from `motion/react`, so it
 * adds no features to the page's `<LazyMotion features={domMin} strict>` tree.
 * Every micro-interaction is a Tailwind transition, driven by `group-hover:`
 * and by pseudo-elements/aria-hidden spans:
 *   - opacity fades (the ambient wash) are NOT transform motion, so they run
 *     for everyone — §8.2 asks for exactly that substitution;
 *   - every transform (the hairline scale, the arrow nudge, the badge lift) is
 *     gated behind `motion-safe:`, so reduced-motion users get the colour and
 *     opacity changes with zero movement;
 *   - no layout property is transitioned: the animated set is colour, border,
 *     background, opacity and transform only (CLS stays 0).
 */
import { ArrowUpRight } from 'lucide-react'

import { SERVICE_PILLARS, SERVICES_SECTION_EYEBROW, SERVICES_SECTION_TITLE } from '../lib/services'
import { formatEditorialIndex } from '../lib/works'

/*
 * One pillar cell — identical geometry on all three columns.
 *
 * The previous cell mixed `py-8` with `lg:py-2 lg:pl-8` and then cancelled the
 * horizontal padding on the first column (`first:pt-0` / `lg:first:pl-0`). That
 * asymmetry is what put the emerald indicator ~8px above `[ 01 / 03 ]` on the
 * first pillar and gave the other two columns a different inner rhythm. Every
 * pillar now carries the SAME `py-10` / `lg:px-8 lg:py-12`, so the indicator
 * gets 40–48px of clearance and the gutters between columns are symmetric
 * (8 + 8). `lg:-mx-8` on the grid cancels that horizontal padding at the outer
 * edges only, keeping the first/last columns flush with the section heading.
 *
 * Hairlines stay per-item rather than `divide-*`: the mobile stack needs a top
 * rule on every item but the first and the `lg` grid needs a left rule on every
 * item but the first, which one `divide` axis cannot express.
 */
const PILLAR_CLASS = [
  'group relative isolate flex flex-col gap-6',
  'px-0 py-10 lg:px-8 lg:py-12',
  'border-t border-border-subtle first:border-t-0',
  'lg:border-t-0 lg:border-l lg:first:border-l-0',
  // Ambient depth: a radial wash of the §2A accent glow, centred on the
  // column's top edge and holding at 40% opacity on hover. `-z-10` keeps the
  // wash BEHIND the text rather than over it, and `isolate` above stops the
  // negative z-index from escaping into the section's stacking context.
  "before:content-[''] before:pointer-events-none",
  'before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-full',
  'before:bg-[radial-gradient(120%_85%_at_50%_0%,var(--accent-glow),transparent_72%)]',
  'before:opacity-0 before:transition-opacity before:duration-500 before:ease-out',
  'group-hover:before:opacity-40',
].join(' ')

/**
 * §3D "hairline border", doubled as the active indicator.
 *
 * Inset to the content box at `lg` so it starts exactly where `[ 01 / 03 ]`
 * starts and stops before the neighbouring column's vertical hairline instead
 * of running across the shared gutter.
 */
const PILLAR_RULE_CLASS = [
  'pointer-events-none absolute top-0 left-0 right-0 h-px lg:left-8 lg:right-8',
  'origin-left scale-x-0 bg-accent-emerald',
  'motion-safe:transition-transform motion-safe:duration-300',
  'group-hover:scale-x-100',
].join(' ')

const PILLAR_INDEX_CLASS = [
  'font-mono text-xs tracking-widest text-text-muted transition-colors duration-300 sm:text-sm',
  'group-hover:text-accent-emerald',
].join(' ')

const PILLAR_TITLE_CLASS = [
  'text-xl font-bold tracking-tight transition-colors duration-300 sm:text-2xl',
  'group-hover:text-accent-emerald',
].join(' ')

/*
 * Kinetic accent beside the title. It is decorative (aria-hidden, and the
 * pillars are not links), so it nudges along its own diagonal on hover rather
 * than rotating: `rotate-45` would sweep ↗ into →, promising a navigation the
 * column cannot honour.
 */
const PILLAR_ARROW_CLASS = [
  'mt-1 h-4 w-4 shrink-0 text-text-muted transition duration-300',
  'group-hover:text-accent-emerald',
  'motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5',
].join(' ')

/*
 * "Etched" micro-badge: a faint translucent plate with a hairline edge, so the
 * tag reads as engraved into the surface rather than outlined on top of it.
 * `text-text-secondary` (not `text-text-muted`) because the muted token
 * measures 2.46:1 on the light base — below AA — while secondary is 7.41:1
 * light / 7.76:1 dark (see plan/04 summary F-1). The plate is a
 * `text-primary` tint at 4%, which inverts with the theme by construction.
 */
const TAG_CLASS = [
  'inline-flex items-center rounded-full border border-border-subtle bg-text-primary/[0.04] px-2.5 py-1',
  'font-mono text-[11px] tracking-widest text-text-secondary uppercase',
  'transition duration-300',
  'group-hover:border-border-hover group-hover:bg-text-primary/[0.07] group-hover:text-text-primary',
  'motion-safe:group-hover:-translate-y-px',
].join(' ')

export function Services() {
  return (
    <section
      id="services"
      className="relative border-t border-border-subtle px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-3">
          <span className="font-mono text-xs tracking-widest text-text-muted">
            {SERVICES_SECTION_EYEBROW}
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {SERVICES_SECTION_TITLE}
          </h2>
        </header>

        {/*
         * 1 column below `lg`, 3 columns at `lg` and up (§3D). The negative
         * margin pairs with the columns' `lg:px-8` (see PILLAR_CLASS).
         */}
        <ul className="mt-10 grid grid-cols-1 lg:-mx-8 lg:grid-cols-3">
          {SERVICE_PILLARS.map((pillar, index) => (
            <li key={pillar.id} data-pillar={pillar.id} className={PILLAR_CLASS}>
              <span aria-hidden="true" className={PILLAR_RULE_CLASS} />

              <span className={PILLAR_INDEX_CLASS}>
                {formatEditorialIndex(index, SERVICE_PILLARS.length)}
              </span>

              <div className="flex items-start gap-3">
                <h3 className={PILLAR_TITLE_CLASS}>{pillar.title}</h3>
                <ArrowUpRight aria-hidden="true" className={PILLAR_ARROW_CLASS} />
              </div>

              <p className="text-text-secondary">{pillar.summary}</p>

              {/* `mt-auto` keeps every badge row on the same baseline in the
                  `lg` grid, whatever the summary length. */}
              <ul className="mt-auto flex flex-wrap gap-2">
                {pillar.tags.map((tag) => (
                  <li key={tag} className={TAG_CLASS}>
                    {tag}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
