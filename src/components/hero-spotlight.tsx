/*
 * Hero Layer 1 — damped cursor spotlight (docs/UX_UX_Spec.md §3B Layer 1).
 *
 * CLIENT-ONLY BY CONSTRUCTION: returns null until after hydration. The layer
 * has no SSR value (an unpositioned radial gradient), and gating it removes an
 * entire class of hydration-mismatch risk for the least load-bearing layer
 * (plan §6.9 / §12 R2).
 *
 * Performance (plan §7.2): the pointer position lives in MotionValues and is
 * written to the DOM by motion — no React state, therefore no re-render per
 * pointermove. The listener is attached to the PARENT (the hero section) with
 * `passive: true`, so nothing runs while the cursor is outside the hero.
 */
import { useEffect, useRef, useState } from 'react'
import { m, useAnimationFrame, useMotionTemplate, useMotionValue } from 'motion/react'

import { cn } from '../lib/cn'
import {
  SPOTLIGHT_LERP,
  SPOTLIGHT_SIZE,
  isFinePointer,
  prefersReducedMotion,
} from '../lib/motion'

export interface HeroSpotlightProps {
  className?: string
  size?: number
  lerp?: number
}

export function HeroSpotlight({
  className,
  size = SPOTLIGHT_SIZE,
  lerp = SPOTLIGHT_LERP,
}: HeroSpotlightProps) {
  const [mounted, setMounted] = useState(false)
  const elementRef = useRef<HTMLDivElement | null>(null)
  const activeRef = useRef(false)

  const targetX = useMotionValue(0)
  const targetY = useMotionValue(0)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const opacity = useMotionValue(0)

  // §3B Layer 1: a 600px radial gradient tracking the pointer.
  const backgroundImage = useMotionTemplate`radial-gradient(${size}px circle at ${x}px ${y}px, var(--accent-glow), transparent 70%)`

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const element = elementRef.current
    const host = element?.parentElement
    if (!mounted || !element || !host) return
    // §8.2 + plan §8.2: no spotlight on coarse pointers or reduced motion.
    if (!isFinePointer() || prefersReducedMotion()) return

    const handlePointerMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      targetX.set(event.clientX - rect.left)
      targetY.set(event.clientY - rect.top)

      if (!activeRef.current) {
        activeRef.current = true
        opacity.set(1)
      }
    }

    host.addEventListener('pointermove', handlePointerMove, { passive: true })

    return () => {
      host.removeEventListener('pointermove', handlePointerMove)
      activeRef.current = false
    }
  }, [mounted, opacity, targetX, targetY])

  // Damped follow, lerp 0.08 — the literal spec value, which a spring cannot express.
  useAnimationFrame(() => {
    if (!activeRef.current) return

    const currentX = x.get()
    const currentY = y.get()
    x.set(currentX + (targetX.get() - currentX) * lerp)
    y.set(currentY + (targetY.get() - currentY) * lerp)
  })

  if (!mounted) return null

  return (
    <m.div
      ref={elementRef}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 z-0 transition-opacity duration-300',
        className,
      )}
      style={{ opacity, backgroundImage }}
    />
  )
}
