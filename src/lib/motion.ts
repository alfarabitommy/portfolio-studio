/*
 * Motion constants and capability probes.
 *
 * Every physics number the interaction layer uses lives here so
 * docs/UX_UX_Spec.md §6A (spring physics), §6B (magnetic button) and §6C
 * (theme reveal) are auditable against a single file.
 *
 * The two probe helpers read `window`; they must only ever be CALLED from an
 * effect or an event handler. Calling them during render would make the server
 * and client markup disagree (see plan/02-phase2-navbar-hero-plan.md §5.3).
 */
import type { Transition } from 'motion/react'

/** §6A "Scale & Hover Feedback" — pointer-level feedback. */
export const SPRING_HOVER: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
}

/**
 * §6A "Drawer & Modal" — surfaces with mass.
 *
 * Two consumers:
 *   - the Phase 2.4 drawer and bottom sheet (src/components/project-drawer.tsx):
 *     the panel's slide-in / slide-out and the sheet's drag spring-back;
 *   - the floating navbar capsule (src/components/navbar.tsx), which shrinks to
 *     0.95 past the scroll threshold. That was originally a CSS transition
 *     (Sub-Task A deviation D-A); it was moved onto this spring by an explicit
 *     user request so the shrink reads as a surface with mass rather than a
 *     fixed easing curve.
 *
 * It stays the single auditable definition of §6A's surface physics.
 */
export const SPRING_SURFACE: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 32,
  mass: 1,
}

/** §3B Layer 1 — spotlight diameter in px. */
export const SPOTLIGHT_SIZE = 600

/** §3B Layer 1 — damped follow factor (lerp 0.08). */
export const SPOTLIGHT_LERP = 0.08

/** §6B — pointer detection radius in px. */
export const MAGNETIC_RADIUS = 35

/** §6B — maximum displacement of a magnetic control, in px. */
export const MAGNETIC_MAX_OFFSET = 8

/** §6C — circular theme reveal duration in ms. Kept in sync with the
 * `theme-reveal` keyframes in src/styles/app.css, which must use a literal. */
export const THEME_REVEAL_MS = 400

/** True on desktop-class pointers; the magnetic effect is mouse-only. */
export function isFinePointer() {
  return window.matchMedia('(pointer: fine)').matches
}

/** docs/UX_UX_Spec.md §8.2 — users who asked for less motion. */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
