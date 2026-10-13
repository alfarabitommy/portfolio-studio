/*
 * Editorial hero — docs/UX_UX_Spec.md §3B, four composited layers:
 *   Layer 1  damped cursor spotlight        <HeroSpotlight /> (client-only)
 *   Layer 2  massive background typography  (below)
 *   Layer 3  portrait cutout + status pill  (below)
 *   Layer 4  value proposition + CTAs       (below, magnetic)
 *
 * SSR contract (plan §5.3): every input is loader data, so the server markup
 * and the first client render are identical. Nothing here reads localStorage,
 * matchMedia or the scroll position during render, and the only client-only
 * layer (Layer 1) renders nothing until after hydration.
 *
 * Reduced motion (docs/UX_UX_Spec.md §8.2) is handled at the two places it can
 * actually change behaviour: `prefersReducedMotion()` short-circuits the
 * pointer-driven effects in hero-spotlight.tsx and magnetic-button.tsx, and
 * `motion-safe:` variants cover the CSS animations.
 */
import { ArrowUpRight } from 'lucide-react'

import portraitUrl from '../assets/portrait-placeholder.svg?url&no-inline'
import type { LandingConfig } from '../server-fns/site-config'
import { AvailabilityPill } from './availability-pill'
import { HeroSpotlight } from './hero-spotlight'
import { MagneticButton } from './magnetic-button'

export interface HeroProps {
  availability: LandingConfig['availability']
}

export function Hero({ availability }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative isolate flex min-h-svh items-center overflow-hidden px-6 py-32 sm:px-10 lg:px-16"
    >
      {/* Layer 1 — ambient spotlight (client-only; see hero-spotlight.tsx). */}
      <HeroSpotlight />

      {/* Layer 2 — massive, low-saturation background typography (spec §3B). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center select-none"
      >
        <span className="font-display text-[15vw] leading-[0.8] font-extrabold tracking-tighter whitespace-nowrap text-text-primary/[0.06] dark:text-text-primary/[0.04]">
          ENGINEER
        </span>
      </div>

      <div className="relative z-40 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
        {/* Layer 4 — value proposition and calls to action. */}
        <div className="order-2 lg:order-1 lg:col-span-7">
          <h1 className="max-w-3xl font-display text-5xl leading-[0.95] font-extrabold tracking-tighter sm:text-7xl lg:text-8xl">
            Crafting high-impact digital systems with architectural precision.
          </h1>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <MagneticButton href="#contact">Start a Project</MagneticButton>
            <MagneticButton href="#works" variant="secondary">
              Explore Works
              <ArrowUpRight
                className="h-4 w-4 transition-transform group-hover:rotate-45"
                aria-hidden="true"
              />
            </MagneticButton>
          </div>
        </div>

        {/* Layer 3 — monochrome portrait cutout, with the live status pill.
            The image is decorative (alt=""); the pill is NOT, so it sits
            outside the aria-hidden wrapper — its label is real information
            read from site_configs (plan §6.10 refinement, see summary). */}
        <div className="relative order-1 mx-auto w-[min(60vw,420px)] lg:order-2 lg:col-span-5 lg:mx-0 lg:w-[min(42vw,420px)]">
          <div aria-hidden="true" className="relative">
            <img
              src={portraitUrl}
              width={1200}
              height={1600}
              alt=""
              decoding="async"
              loading="eager"
              fetchPriority="high"
              className="hero-portrait-mask h-auto w-full object-cover contrast-125 grayscale"
            />
          </div>

          {availability !== null ? (
            <AvailabilityPill
              label={availability.label}
              status={availability.status}
              className="absolute -bottom-3 left-4 z-30"
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}
