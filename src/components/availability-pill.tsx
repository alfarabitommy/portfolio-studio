/*
 * Dynamic availability pill — docs/UX_UX_Spec.md §3B Layer 3.
 *
 * `label` is user data read from `site_configs.availability` (live value today:
 * "Available for Projects"); it is never hardcoded here.
 *
 * The glowing status dot is a CSS keyframe animation (`status-pulse`, defined
 * in src/styles/app.css) behind Tailwind's `motion-safe:` variant, so §8.2 —
 * no pulsing for users who asked for less motion — needs no JS branch and can
 * never differ between server and client.
 */
import type { SiteAvailabilityStatus } from '../types/database'

import { cn } from '../lib/cn'

export interface AvailabilityPillProps {
  label: string
  status: SiteAvailabilityStatus
  className?: string
}

export function AvailabilityPill({ label, status, className }: AvailabilityPillProps) {
  const isAvailable = status === 'available'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-glass px-3 py-1.5',
        'font-mono text-[11px] tracking-widest text-text-secondary uppercase backdrop-blur-md',
        className,
      )}
    >
      <span aria-hidden="true" className="relative flex h-1.5 w-1.5 items-center justify-center">
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            isAvailable ? 'bg-accent-emerald' : 'bg-text-muted',
          )}
        />
        {isAvailable ? (
          <span className="absolute inset-0 rounded-full bg-accent-emerald opacity-0 motion-safe:animate-[status-pulse_2.4s_ease-out_infinite]" />
        ) : null}
      </span>
      {label}
    </span>
  )
}
