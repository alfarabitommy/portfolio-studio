/*
 * Floating glass pill navbar — docs/UX_UX_Spec.md §3A.
 *
 * Geometry, anatomy and glass formula come from the spec; the only addition is
 * `max-w-[calc(100vw-2rem)]`, which the spec's wireframe does not cover at
 * 320px-wide viewports (plan §9 D3).
 *
 * §3A scroll response: past NAV_SCROLL_THRESHOLD the capsule shrinks to 0.95,
 * the blur strengthens and the border becomes more visible.
 *
 * Motion contract (user-directed refactor; supersedes the CSS-only shrink that
 * Sub-Task A shipped under its deviation D-A / plan 02 §12 R4):
 *
 *   1. The SCALE is an `m.header` animation bound to SPRING_SURFACE, so the
 *      shrink/grow reads as a surface with mass and damping rather than a
 *      fixed-easing CSS transition.
 *   2. `origin-top` anchors the transform to the capsule's TOP edge. With the
 *      default centre origin, scaling to 0.95 pulled the top edge ~1.3px DOWN,
 *      away from its fixed `top-6` offset — the visual "jump" this refactor
 *      removes. The horizontal centre is unaffected either way (`mx-auto` +
 *      `w-max`, and `origin-top` is 50% horizontally).
 *   3. Border colour and backdrop blur remain CSS transitions, so exactly one
 *      system animates the element: `transform` is owned by motion and is
 *      therefore no longer in the CSS transition property list.
 *   4. Reduced motion (§8.2): the spring is replaced by an instant change.
 *
 * Bundle contract: `m` + the page's `<LazyMotion features={domMin} strict>`
 * already ship the renderer and the animation engine the drawer drives, so this
 * keeps the navbar at ~0 added gz — and the imperative `animate()` API is
 * deliberately NOT imported here (Sub-Task B measured +3,978 gz for it). Only
 * `m` is imported: no `motion.*`, no `LazyMotion`, no `domAnimation`/`domMax`,
 * which `strict` would reject anyway.
 *
 * SSR contract: `scrolled` starts false, so the server markup and the first
 * client render agree and there is no entry animation; a restored scroll
 * position is corrected on the first effect tick. `useReducedMotion()` is safe
 * in a server-rendered component because it only feeds `transition`, which is
 * never serialised into markup — the hook's server value is `null`.
 */
import { useEffect, useState } from 'react'
import { m, useReducedMotion } from 'motion/react'

import { cn } from '../lib/cn'
import { SPRING_SURFACE } from '../lib/motion'
import { NAV_LINKS, NAV_SCROLL_THRESHOLD, SITE_MONOGRAM } from '../lib/site'
import { ResumeTrigger } from './resume-trigger'
import { ThemeToggle } from './theme-toggle'

/** §3A: the capsule's settled size once the page is scrolled. */
const NAV_SCROLLED_SCALE = 0.95

const LINK_CLASS =
  'rounded-full px-3.5 py-2 text-sm text-text-secondary transition-colors hover:bg-text-primary/5 hover:text-text-primary focus-visible:ring-1 focus-visible:ring-text-primary/40 focus-visible:outline-none'

export interface NavbarProps {
  resumeUrl: string | null
  className?: string
}

export function Navbar({ resumeUrl, className }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  /*
   * Only ever consumed by `transition` below, never by markup — which is what
   * keeps the hook's `null`-on-the-server value from reaching the DOM.
   */
  const reducedMotion = useReducedMotion() === true

  /*
   * State changes only when the threshold is CROSSED — never per frame. The
   * spring interpolates between the two targets; no scroll position is written
   * to a motion value, so there is nothing to sample per event.
   */
  useEffect(() => {
    const handleScroll = () => {
      const next = window.scrollY > NAV_SCROLL_THRESHOLD
      setScrolled((current) => (current === next ? current : next))
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <m.header
      className={cn(
        'fixed inset-x-0 top-6 z-50 mx-auto flex w-max max-w-[calc(100vw-2rem)] items-center gap-1',
        // Anchors the scale to the top edge (see the header comment, item 2).
        'origin-top',
        'rounded-full border border-border-subtle bg-surface-glass px-2 py-2 backdrop-blur-md',
        'shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.37)]',
        // `transform` is intentionally absent: motion owns it now.
        'motion-safe:transition-[backdrop-filter,border-color] motion-safe:duration-300 motion-safe:ease-out',
        scrolled && 'border-border-hover backdrop-blur-lg',
        className,
      )}
      /*
       * No `initial` prop on purpose: motion then takes the first `animate`
       * value as the mount state, so the capsule is already at scale 1 on the
       * server and on the first client render — no entrance animation, and
       * nothing to mismatch.
       */
      animate={{ scale: scrolled ? NAV_SCROLLED_SCALE : 1 }}
      transition={reducedMotion ? { duration: 0 } : SPRING_SURFACE}
    >
      <a
        href="#hero"
        aria-label="Back to top"
        className={cn(LINK_CLASS, 'px-2.5 py-2 font-mono text-xs tracking-widest')}
      >
        <span aria-hidden="true">[ {SITE_MONOGRAM} ]</span>
      </a>

      <span aria-hidden="true" className="hidden h-5 w-px bg-border-subtle md:block" />

      <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} className={LINK_CLASS}>
            {link.label}
          </a>
        ))}
      </nav>

      <span aria-hidden="true" className="h-5 w-px bg-border-subtle" />

      <ThemeToggle />
      <ResumeTrigger resumeUrl={resumeUrl} />
    </m.header>
  )
}
