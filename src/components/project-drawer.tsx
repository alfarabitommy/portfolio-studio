/*
 * Interactive project detail drawer + mobile bottom sheet —
 * docs/UX_UX_Spec.md §4A, §4B, §8 and docs/ROADMAP.md §2.4.
 * plan/03-phase2-works-drawer-plan.md §8–§10.
 *
 * Motion contract: this file lives inside the page's
 * `<LazyMotion features={domMin} strict>` tree, so it uses `m.*` only.
 * `domMin` ships `renderer + animations + exit`, which covers `initial` /
 * `animate` / `exit` / springs and `AnimatePresence` at no extra bundle cost;
 * gesture features (`whileHover`, `drag`) live in `domAnimation` / `domMax` and
 * are deliberately NOT used — the sheet's swipe-down is hand-rolled with
 * pointer events.
 *
 * SSR contract: nothing renders until `activeIndex` becomes non-null, and that
 * only ever happens from a click. The server and the first client render both
 * produce no drawer markup, so there is nothing to mismatch.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from 'react'
import { AnimatePresence, m, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { ArrowLeft, ArrowRight, Code, ExternalLink, X } from 'lucide-react'

import { cn } from '../lib/cn'
import { SPRING_SURFACE } from '../lib/motion'
import {
  DRAWER_DESKTOP_QUERY,
  SHEET_DISMISS_DISTANCE_RATIO,
  SHEET_DISMISS_VELOCITY,
  SHEET_HEIGHT_CLASS,
  formatEditorialIndex,
} from '../lib/works'
import type { FeaturedProject } from '../server-fns/projects'

/** Everything inside the panel that can take focus, in DOM order. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const HEADER_ACTION_CLASS =
  'inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-3 py-1.5 font-mono text-[11px] tracking-widest text-text-secondary uppercase transition-colors hover:text-text-primary focus-visible:ring-1 focus-visible:ring-text-primary/40 focus-visible:outline-none'

const FOOTER_BUTTON_CLASS =
  'inline-flex items-center gap-2 rounded-full px-2 py-2 font-mono text-[11px] tracking-widest text-text-secondary uppercase transition-colors hover:text-text-primary focus-visible:ring-1 focus-visible:ring-text-primary/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-text-secondary'

const SECTION_LABEL_CLASS = 'font-mono text-xs tracking-widest text-text-muted uppercase'

export interface ProjectDrawerProps {
  projects: FeaturedProject[]
  activeIndex: number | null
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
}

export function ProjectDrawer({
  projects,
  activeIndex,
  onClose,
  onNext,
  onPrevious,
}: ProjectDrawerProps) {
  const isOpen = activeIndex !== null
  const project = activeIndex === null ? null : (projects[activeIndex] ?? null)
  /*
   * Read here, not inside the panel: `ProjectDrawer` mounts with the page, so
   * the effect below has already resolved the breakpoint long before the first
   * click. The panel itself mounts per open, and a first frame with the wrong
   * geometry would flash a bottom sheet on desktop (plan §4.3).
   */
  const isDesktop = useMediaQuery(DRAWER_DESKTOP_QUERY)
  const panelRef = useRef<HTMLElement | null>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  /*
   * Modal side effects, keyed on `isOpen` — NOT on `activeIndex`, so cycling
   * between projects does not re-run the scroll lock or bounce focus back to
   * the card.
   */
  useEffect(() => {
    if (!isOpen) return

    const previouslyFocused = document.activeElement
    restoreFocusRef.current = previouslyFocused instanceof HTMLElement ? previouslyFocused : null

    const { body } = document
    const previousOverflow = body.style.overflow
    const previousPaddingRight = body.style.paddingRight
    // Compensate for the removed scrollbar so the page does not shift.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    const frame = requestAnimationFrame(() => panelRef.current?.focus())

    return () => {
      cancelAnimationFrame(frame)
      // Restores both the scroll lock and the document scroll position: the
      // `overflow` technique never touches `scrollY`.
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPaddingRight
      restoreFocusRef.current?.focus()
    }
  }, [isOpen])

  // §8.1: Escape always closes the modal.
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // §8.1: focus trap. The background is also `inert` (routes/index.tsx), but
  // the trap is kept as the authoritative guard.
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      const insidePanel = active instanceof Node && panel.contains(active)

      if (event.shiftKey) {
        if (!insidePanel || active === first) {
          event.preventDefault()
          last.focus()
        }
        return
      }

      if (!insidePanel || active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  /*
   * Two keyed siblings so `AnimatePresence` can animate each out
   * independently. While exiting, it keeps rendering the previous children, so
   * the panel still holds its `project` props — no "last project" ref needed.
   */
  return (
    <AnimatePresence>
      {project !== null ? (
        <m.div
          key="project-drawer-backdrop"
          aria-hidden="true"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xl"
        />
      ) : null}

      {project !== null ? (
        <ProjectDrawerPanel
          key="project-drawer-panel"
          project={project}
          index={activeIndex ?? 0}
          total={projects.length}
          isDesktop={isDesktop}
          onClose={onClose}
          onNext={onNext}
          onPrevious={onPrevious}
          panelRef={panelRef}
        />
      ) : null}
    </AnimatePresence>
  )
}

interface ProjectDrawerPanelProps {
  project: FeaturedProject
  index: number
  total: number
  /** Resolved by ProjectDrawer before the panel mounts (never a first-frame guess). */
  isDesktop: boolean
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  panelRef: RefObject<HTMLElement | null>
}

/*
 * The panel is a separate component on purpose: it mounts per open, so the
 * drag offset always starts at 0 and there is no cross-open state to reset.
 */
function ProjectDrawerPanel({
  project,
  index,
  total,
  isDesktop,
  onClose,
  onNext,
  onPrevious,
  panelRef,
}: ProjectDrawerPanelProps) {
  const reducedMotion = useReducedMotion() === true
  const headingId = useId()
  const bodyRef = useRef<HTMLDivElement | null>(null)

  /*
   * Drag offset. `dragTarget` is what the finger writes; `dragY` is the
   * SPRING_SURFACE follow of it. Using `useSpring` rather than the imperative
   * `animate()` API keeps the drawer's bundle delta near zero — `animate()` is
   * motion v12's animation-subject machinery (measured at +3,978 gz on this
   * chunk) and is not otherwise imported, while `useSpring` is already in the
   * page bundle via magnetic-button.tsx. The gesture therefore carries the same
   * mass as the panel (docs/UX_UX_Spec.md §6A / §1.3).
   */
  const dragTarget = useMotionValue(0)
  const dragY = useSpring(dragTarget, SPRING_SURFACE)
  const draggingRef = useRef(false)
  const dragStartYRef = useRef(0)
  const velocityRef = useRef(0)
  const sampleRef = useRef({ y: 0, time: 0 })

  /*
   * §8.2: with reduced motion the panel fades instead of sliding, and the
   * background recede transition is dropped (routes/index.tsx).
   */
  const enterExit = reducedMotion ? { opacity: 0 } : isDesktop ? { x: '100%' } : { y: '100%' }
  const settled = reducedMotion ? { opacity: 1 } : isDesktop ? { x: 0 } : { y: 0 }

  const handleNavigate = useCallback(
    (direction: 'next' | 'previous') => {
      // §4A item 7: instant swap, so the new case study opens at its top.
      if (bodyRef.current) bodyRef.current.scrollTop = 0
      if (direction === 'next') onNext()
      else onPrevious()
    },
    [onNext, onPrevious],
  )

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = true
    // Resume from the current offset, so re-grabbing mid spring-back is smooth.
    dragStartYRef.current = event.clientY - dragY.get()
    velocityRef.current = 0
    sampleRef.current = { y: event.clientY, time: event.timeStamp }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return

    dragTarget.set(Math.max(0, event.clientY - dragStartYRef.current))

    const elapsed = event.timeStamp - sampleRef.current.time
    if (elapsed > 0) {
      velocityRef.current = (event.clientY - sampleRef.current.y) / elapsed
    }
    sampleRef.current = { y: event.clientY, time: event.timeStamp }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return
    draggingRef.current = false

    const distance = Math.max(0, event.clientY - dragStartYRef.current)
    const panelHeight = panelRef.current?.offsetHeight ?? 0
    const dismissed =
      distance > panelHeight * SHEET_DISMISS_DISTANCE_RATIO ||
      velocityRef.current > SHEET_DISMISS_VELOCITY

    if (dismissed) {
      // The exit spring continues from the current position, so there is no jump.
      onClose()
      return
    }

    // Below the threshold: spring back to 0 with the §6A drawer physics.
    dragTarget.set(0)
  }

  return (
    <m.aside
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      tabIndex={-1}
      initial={enterExit}
      animate={settled}
      exit={enterExit}
      transition={SPRING_SURFACE}
      className={cn(
        'fixed z-70 flex flex-col overflow-hidden border-border-subtle bg-surface-card/95 backdrop-blur-xl focus:outline-none',
        isDesktop
          ? 'inset-y-0 right-0 w-[55vw] max-w-[100vw] min-w-[640px] border-l'
          : cn('inset-x-0 bottom-0 rounded-t-3xl border-t', SHEET_HEIGHT_CLASS),
      )}
    >
      {/* The offset wrapper carries the drag; the panel carries the entrance. */}
      <m.div style={{ y: dragY }} className="flex min-h-0 flex-1 flex-col">
        {isDesktop ? null : (
          <div
            aria-hidden="true"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="flex h-11 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
          >
            <span className="h-1 w-10 rounded-full bg-text-muted/40" />
          </div>
        )}

        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border-subtle bg-surface-card/95 px-5 py-3 backdrop-blur-md sm:px-8">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close case study"
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 font-mono text-[11px] tracking-widest text-text-secondary uppercase transition-colors hover:text-text-primary focus-visible:ring-1 focus-visible:ring-text-primary/40 focus-visible:outline-none"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Esc</span>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <DrawerActionLink href={project.live_url} label="Live Demo">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </DrawerActionLink>
              <DrawerActionLink href={project.repo_url} label="Source Code">
                <Code className="h-3.5 w-3.5" aria-hidden="true" />
              </DrawerActionLink>
            </div>
          </header>

          <div className="flex flex-col gap-10 px-5 pt-8 pb-12 sm:px-8">
            <figure className="aspect-[16/10] overflow-hidden rounded-2xl border border-border-subtle bg-surface-card">
              <img
                src={project.cover_image_url}
                width={1600}
                height={1000}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </figure>

            <div className="flex flex-col gap-4">
              <span className="font-mono text-xs tracking-widest text-text-secondary uppercase">
                {project.category}
              </span>
              <h2 id={headingId} className="text-2xl font-bold tracking-tight sm:text-3xl">
                {project.title}
              </h2>
              <p className="text-text-secondary">{project.summary}</p>
            </div>

            <section className="flex flex-col gap-3">
              <h3 className={SECTION_LABEL_CLASS}>The Challenge</h3>
              <p className="text-text-secondary">{project.problem_statement}</p>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className={SECTION_LABEL_CLASS}>The Architecture</h3>
              <p className="text-text-secondary">{project.solution_statement}</p>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className={SECTION_LABEL_CLASS}>Tech Stack</h3>
              <ul className="flex flex-wrap gap-2">
                {project.tech_stack.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full border border-border-subtle px-3 py-1 font-mono text-[11px] tracking-widest text-text-muted uppercase"
                  >
                    [ {tech} ]
                  </li>
                ))}
              </ul>
            </section>

            {/* §4A item 6 — preview grid. The lightbox zoom is a follow-up
                (plan §3.2 A4); an empty gallery renders nothing. */}
            {project.gallery_images.length > 0 ? (
              <section className="flex flex-col gap-3">
                <h3 className={SECTION_LABEL_CLASS}>Gallery</h3>
                <ul className="grid grid-cols-2 gap-3">
                  {project.gallery_images.map((src, galleryIndex) => (
                    <li
                      key={`${src}-${galleryIndex}`}
                      className="aspect-[16/10] overflow-hidden rounded-xl border border-border-subtle bg-surface-card"
                    >
                      <img
                        src={src}
                        width={1200}
                        height={750}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border-subtle px-5 py-3 sm:px-8">
          <button
            type="button"
            onClick={() => handleNavigate('previous')}
            disabled={total < 2}
            aria-label="Previous project"
            className={FOOTER_BUTTON_CLASS}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Previous Project</span>
          </button>

          <span className="font-mono text-xs tracking-widest text-text-muted">
            {formatEditorialIndex(index, total)}
          </span>

          <button
            type="button"
            onClick={() => handleNavigate('next')}
            disabled={total < 2}
            aria-label="Next project"
            className={FOOTER_BUTTON_CLASS}
          >
            <span className="hidden sm:inline">Next Project</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </footer>
      </m.div>
    </m.aside>
  )
}

interface DrawerActionLinkProps {
  href: string | null
  label: string
  children: ReactNode
}

/*
 * plan §3.2 A7 — the ResumeTrigger precedent: a missing URL renders a disabled
 * control rather than a dead link, so the header layout stays stable.
 */
function DrawerActionLink({ href, label, children }: DrawerActionLinkProps) {
  if (href === null) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title={`${label} — not available yet`}
        className={cn(HEADER_ACTION_CLASS, 'cursor-not-allowed opacity-40')}
      >
        {children}
        {label}
      </button>
    )
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={HEADER_ACTION_CLASS}>
      {children}
      {label}
    </a>
  )
}

/**
 * Client-only breakpoint probe. `false` on the first render and corrected in an
 * effect, so it can never make the server and client markup disagree — the
 * drawer that consumes it only renders after a click.
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    media.addEventListener('change', handleChange)

    return () => media.removeEventListener('change', handleChange)
  }, [query])

  return matches
}
