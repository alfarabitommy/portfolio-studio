/*
 * Works-section vocabulary and geometry.
 *
 * docs/UX_UX_Spec.md §3C fixes the editorial index format and the category /
 * tech-chip typography; §4A and §4B fix the drawer and bottom-sheet geometry.
 * Keeping those literals here mirrors src/lib/site.ts (shell vocabulary) and
 * src/lib/motion.ts (physics constants), so the two components of
 * ROADMAP §2.3–§2.4 cannot drift apart.
 *
 * plan/03-phase2-works-drawer-plan.md §3.3.
 */

/** §2.3 section heading copy (docs/UX_UX_Spec.md §3C vocabulary). */
export const WORKS_SECTION_TITLE = 'Featured Works'

/** §3C eyebrow above the section heading, set in Geist Mono. */
export const WORKS_SECTION_EYEBROW = '[ WORKS ]'

/** §4A/§4B breakpoint: at and above this width the drawer is a right slide-over. */
export const DRAWER_DESKTOP_QUERY = '(min-width: 768px)'

/** §4B: the bottom sheet occupies 92% of the (small) viewport height. */
export const SHEET_HEIGHT_CLASS = 'h-[92svh]'

/** Share of the sheet height a downward drag must exceed to dismiss it. */
export const SHEET_DISMISS_DISTANCE_RATIO = 0.25

/** Downward flick speed, px/ms, that dismisses the sheet regardless of distance. */
export const SHEET_DISMISS_VELOCITY = 0.5

/**
 * §3C "Nomor indeks editorial" — `[ 01 / 02 ]`. Both numbers are zero-padded to
 * at least two digits, and to the width of `total` beyond that, so a 12-project
 * list reads `[ 01 / 12 ]` without any call-site changes.
 */
export function formatEditorialIndex(index: number, total: number): string {
  const width = Math.max(2, String(total).length)
  return `[ ${String(index + 1).padStart(width, '0')} / ${String(total).padStart(width, '0')} ]`
}

/**
 * §4A item 7 — wrap-around project navigation. Returns an index in
 * `[0, total)`. A non-positive `total` yields 0 so callers render nothing
 * rather than compute `NaN`.
 */
export function cycleIndex(current: number, delta: 1 | -1, total: number): number {
  if (total <= 0) return 0
  return (((current + delta) % total) + total) % total
}
