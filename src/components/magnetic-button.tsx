/*
 * Magnetic call to action — docs/UX_UX_Spec.md §6B and §6A.
 *
 * The hit field is the wrapper: padding (and an equal negative margin) of
 * MAGNETIC_RADIUS px extend the pointer-sensitive area around the button
 * without a global pointermove listener. Displacement is capped at
 * MAGNETIC_MAX_OFFSET and driven by `useSpring(SPRING_HOVER)`, so the motion
 * has mass but never delays a click.
 *
 * Hydration: both springs start at 0 and the wrapper geometry is static, so
 * the server markup and the first client render are identical (plan §6.8).
 */
import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { m, useSpring } from 'motion/react'

import { cn } from '../lib/cn'
import {
  MAGNETIC_MAX_OFFSET,
  MAGNETIC_RADIUS,
  SPRING_HOVER,
  isFinePointer,
  prefersReducedMotion,
} from '../lib/motion'

const VARIANT_CLASS: Record<'primary' | 'secondary', string> = {
  primary:
    'inline-flex items-center gap-2 rounded-full border border-accent-emerald/40 bg-surface-glass px-6 py-3 font-medium text-text-primary backdrop-blur-md transition-shadow hover:shadow-[0_0_0_1px_var(--accent-glow),0_8px_32px_var(--accent-glow)] focus-visible:ring-1 focus-visible:ring-text-primary/40 focus-visible:outline-none',
  secondary:
    'group inline-flex items-center gap-2 rounded-full px-3 py-3 font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:ring-1 focus-visible:ring-text-primary/40 focus-visible:outline-none',
}

export interface MagneticButtonProps {
  children: ReactNode
  href: string
  variant?: 'primary' | 'secondary'
  className?: string
}

export function MagneticButton({
  children,
  href,
  variant = 'primary',
  className,
}: MagneticButtonProps) {
  const anchorRef = useRef<HTMLAnchorElement | null>(null)
  const x = useSpring(0, SPRING_HOVER)
  const y = useSpring(0, SPRING_HOVER)

  function handlePointerMove(event: ReactPointerEvent<HTMLSpanElement>) {
    // §6B is a desktop-pointer effect only.
    if (event.pointerType !== 'mouse' || !isFinePointer() || prefersReducedMotion()) return

    const anchor = anchorRef.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    const offsetX = event.clientX - (rect.left + rect.width / 2)
    const offsetY = event.clientY - (rect.top + rect.height / 2)
    const distance = Math.hypot(offsetX, offsetY)

    if (distance === 0) {
      x.set(0)
      y.set(0)
      return
    }

    // Suck-in strength: proportional to the distance, capped at the spec's 8px.
    const magnitude = Math.min(distance, MAGNETIC_MAX_OFFSET)
    anchor.style.willChange = 'transform'
    x.set((offsetX / distance) * magnitude)
    y.set((offsetY / distance) * magnitude)
  }

  function reset() {
    if (anchorRef.current) anchorRef.current.style.willChange = ''
    x.set(0)
    y.set(0)
  }

  return (
    <span
      className="relative inline-flex"
      style={{ padding: MAGNETIC_RADIUS, margin: -MAGNETIC_RADIUS }}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
    >
      <m.a
        ref={anchorRef}
        href={href}
        style={{ x, y }}
        className={cn(VARIANT_CLASS[variant], className)}
      >
        {children}
      </m.a>
    </span>
  )
}
