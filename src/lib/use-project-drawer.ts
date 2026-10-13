/*
 * Drawer selection state — plan/03-phase2-works-drawer-plan.md §4.3.
 *
 * `activeIndex` starts `null` on the server AND on the first client render, so
 * the SSR markup and hydration agree by construction: nothing drawer-related is
 * rendered until a user click sets a non-null index. No `window` is read during
 * render, so this hook stays SSR-safe.
 */
import { useCallback, useState } from 'react'

import { cycleIndex } from './works'

export interface ProjectDrawerController {
  /** `null` while the drawer is closed. */
  activeIndex: number | null
  isOpen: boolean
  /** Opens the drawer for a project, clamped to the available range. */
  open: (index: number) => void
  close: () => void
  /** Cycles forward/backward with wrap-around; no-op while closed. */
  next: () => void
  previous: () => void
}

export function useProjectDrawer(total: number): ProjectDrawerController {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const open = useCallback(
    (index: number) => {
      if (total <= 0) return
      setActiveIndex(Math.min(Math.max(index, 0), total - 1))
    },
    [total],
  )

  const close = useCallback(() => setActiveIndex(null), [])

  const next = useCallback(() => {
    setActiveIndex((current) =>
      current === null || total < 2 ? current : cycleIndex(current, 1, total),
    )
  }, [total])

  const previous = useCallback(() => {
    setActiveIndex((current) =>
      current === null || total < 2 ? current : cycleIndex(current, -1, total),
    )
  }, [total])

  return { activeIndex, isOpen: activeIndex !== null, open, close, next, previous }
}
