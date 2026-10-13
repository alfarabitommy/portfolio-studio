/*
 * Featured Works — docs/UX_UX_Spec.md §3C, docs/ROADMAP.md §2.3.
 * plan/03-phase2-works-drawer-plan.md §7.
 *
 * Fully SSR-rendered: every input is loader data, so the server markup and the
 * first client render are identical. The card's trigger only *sets state* — the
 * drawer itself is client-only (project-drawer.tsx), which is why no part of
 * the case study exists in the initial HTML.
 *
 * Hover/focus reveal is pure CSS (`group-hover:` / `group-focus-within:`):
 * `whileHover` would require motion's gesture features (`domAnimation`), which
 * are outside the page's `<LazyMotion features={domMin} strict>` budget. The
 * scale is gated by `motion-safe:` so docs/UX_UX_Spec.md §8.2 users get the
 * colour reveal with no transform.
 */
import { ArrowUpRight } from 'lucide-react'

import { WORKS_SECTION_EYEBROW, WORKS_SECTION_TITLE, formatEditorialIndex } from '../lib/works'
import type { FeaturedProject } from '../server-fns/projects'

export interface FeaturedWorksProps {
  projects: FeaturedProject[]
  onOpenProject: (index: number) => void
}

const MEDIA_CLASS =
  'aspect-[16/10] overflow-hidden rounded-2xl border border-border-subtle bg-surface-card'

const MEDIA_IMAGE_CLASS =
  'h-full w-full object-cover grayscale transition-[filter,transform] duration-500 ease-out group-hover:grayscale-0 group-focus-within:grayscale-0 motion-safe:group-hover:scale-[1.02] motion-safe:group-focus-within:scale-[1.02]'

const TECH_CHIP_CLASS =
  'rounded-full border border-border-subtle px-3 py-1 font-mono text-[11px] tracking-widest text-text-muted uppercase'

/*
 * The trigger is the project TITLE itself, and its `::after` overlay is what
 * makes the whole card clickable. That keeps the accessible name equal to the
 * title, keeps the focus ring on the title, and avoids nesting interactive
 * content inside a card-wide <button> (which would also flatten the <h3>).
 */
const CARD_TRIGGER_CLASS =
  "text-left after:absolute after:inset-0 after:content-[''] rounded-sm focus-visible:ring-1 focus-visible:ring-text-primary/40 focus-visible:outline-none"

export function FeaturedWorks({ projects, onOpenProject }: FeaturedWorksProps) {
  // Data outage or an empty table degrades the section away (plan §3.2 A6) —
  // exactly how a missing availability pill degrades the hero.
  if (projects.length === 0) return null

  return (
    <section
      id="works"
      className="relative border-t border-border-subtle px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <header className="flex flex-col gap-3">
          <span className="font-mono text-xs tracking-widest text-text-muted">
            {WORKS_SECTION_EYEBROW}
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{WORKS_SECTION_TITLE}</h2>
        </header>

        <ul className="mt-14 flex flex-col">
          {projects.map((project, index) => (
            <li key={project.id} className="border-t border-border-subtle first:border-t-0">
              <article className="group relative py-12 sm:py-16">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-xs tracking-widest text-text-muted sm:text-sm">
                    {formatEditorialIndex(index, projects.length)}
                  </span>
                  <span className="font-mono text-xs tracking-widest text-text-secondary uppercase">
                    {project.category}
                  </span>
                </div>

                <div className={`mt-6 ${MEDIA_CLASS}`}>
                  <img
                    src={project.cover_image_url}
                    width={1600}
                    height={1000}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className={MEDIA_IMAGE_CLASS}
                  />
                </div>

                <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      <button
                        type="button"
                        aria-haspopup="dialog"
                        onClick={() => onOpenProject(index)}
                        className={CARD_TRIGGER_CLASS}
                      >
                        {project.title}
                      </button>
                    </h3>

                    <p className="mt-3 text-text-secondary">{project.summary}</p>

                    <ul className="mt-5 flex flex-wrap gap-2">
                      {project.tech_stack.map((tech) => (
                        <li key={tech} className={TECH_CHIP_CLASS}>
                          [ {tech} ]
                        </li>
                      ))}
                    </ul>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-2 font-mono text-xs tracking-widest text-text-secondary uppercase transition-colors group-focus-within:text-text-primary group-hover:text-text-primary">
                    View Case Study
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform group-focus-within:rotate-45 group-hover:rotate-45"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
