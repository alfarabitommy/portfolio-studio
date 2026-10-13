/*
 * Landing page — docs/PRD.md §4A.1, docs/ROADMAP.md §2.1–§2.4.
 * plan/03-phase2-works-drawer-plan.md §4 and §5 Steps 6/10.
 *
 * The loader calls `createServerFn`s rather than the server-only Supabase
 * helpers directly: route loaders run in the client too, and
 * src/lib/supabase.server.ts is rejected in the client graph at build time.
 *
 * `availability`, `resume`, `projects` and `copyrightYear` are serialised into
 * the SSR dehydration payload, so the first client render uses exactly the
 * values the server rendered with — that is what makes this page mismatch-free
 * without any client fetching.
 */
import { createFileRoute } from '@tanstack/react-router'
import { LazyMotion, domMin } from 'motion/react'

import { ContactSection } from '../components/contact-section'
import { FeaturedWorks } from '../components/featured-works'
import { Footer } from '../components/footer'
import { Hero } from '../components/hero'
import { Navbar } from '../components/navbar'
import { ProjectDrawer } from '../components/project-drawer'
import { Services } from '../components/services'
import { cn } from '../lib/cn'
import { useProjectDrawer } from '../lib/use-project-drawer'
import { getFeaturedProjects } from '../server-fns/projects'
import { getLandingConfig } from '../server-fns/site-config'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [config, featured] = await Promise.all([getLandingConfig(), getFeaturedProjects()])
    // A failed projects read yields `[]`, which FeaturedWorks already treats as
    // "render nothing" — no separate flag needs to cross the wire.
    //
    // `copyrightYear` is resolved HERE, on the server, and handed to the footer
    // through the dehydration payload: the client then renders the exact year
    // the server used, so the copyright line can never be a hydration mismatch
    // (the alternative, `new Date()` during render, differs for one second a
    // year — plan §3.2 A9).
    return { ...config, projects: featured.projects, copyrightYear: new Date().getFullYear() }
  },
  staleTime: 60_000,
  component: Home,
})

function Home() {
  const { availability, resume, projects, copyrightYear } = Route.useLoaderData()
  const drawer = useProjectDrawer(projects.length)

  /*
   * LazyMotion + `m`: only the minimal features this page actually uses are
   * shipped (plan §11). `strict` throws on any accidental `motion.*` usage.
   */
  return (
    <LazyMotion features={domMin} strict>
      {/*
       * `inert` while the drawer is open removes the whole background — navbar
       * included — from the tab order AND the accessibility tree; the drawer's
       * own focus trap is the second guard (project-drawer.tsx).
       *
       * The Navbar is deliberately OUTSIDE the recede wrapper below: a
       * `transform`/`filter` on an ancestor makes `position: fixed` descendants
       * position against that ancestor, which would stop the floating pill from
       * being viewport-fixed.
       */}
      <div inert={drawer.isOpen || undefined}>
        <Navbar resumeUrl={resume?.url ?? null} />

        {/* docs/UX_UX_Spec.md §4A: the page behind the drawer recedes. Skipped
            below `md` (the sheet + backdrop already cover the screen) and for
            reduced-motion users, per §8.2. */}
        <div
          className={cn(
            'motion-safe:transition-[transform,filter] motion-safe:duration-300 motion-safe:ease-out',
            drawer.isOpen && 'md:scale-[0.97] md:blur-[2px]',
          )}
        >
          <main>
            <Hero availability={availability} />
            <FeaturedWorks projects={projects} onOpenProject={drawer.open} />
            <Services />
            <ContactSection />
            <Footer resumeUrl={resume?.url ?? null} copyrightYear={copyrightYear} />
          </main>
        </div>
      </div>

      <ProjectDrawer
        projects={projects}
        activeIndex={drawer.activeIndex}
        onClose={drawer.close}
        onNext={drawer.next}
        onPrevious={drawer.previous}
      />
    </LazyMotion>
  )
}
