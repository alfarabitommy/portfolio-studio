/*
 * CV download affordance — docs/UX_UX_Spec.md §3A (Quick Resume Trigger).
 *
 * The URL comes from `site_configs.resume` (key `resume`, NOT `cv` — verified
 * against the live project in Phase 1). This component never rewrites it, and
 * it renders a disabled control while the value is still null so the pill's
 * width stays stable instead of the button appearing/disappearing.
 *
 * No `download` attribute on purpose: it is ignored for cross-origin URLs and
 * Supabase Storage is a different origin — `target="_blank"` is the honest
 * behaviour. A forced attachment would use Supabase's `?download` flag
 * (plan §13).
 */
import { Download } from 'lucide-react'

import { cn } from '../lib/cn'

const TRIGGER_CLASS =
  'inline-flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors focus-visible:ring-1 focus-visible:ring-text-primary/40 focus-visible:outline-none'

export interface ResumeTriggerProps {
  resumeUrl: string | null
  className?: string
}

export function ResumeTrigger({ resumeUrl, className }: ResumeTriggerProps) {
  if (resumeUrl === null) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="CV not uploaded yet"
        className={cn(TRIGGER_CLASS, 'cursor-not-allowed opacity-40', className)}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Download CV (PDF) — not uploaded yet</span>
      </button>
    )
  }

  return (
    <a
      href={resumeUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download CV (PDF)"
      className={cn(TRIGGER_CLASS, 'hover:bg-text-primary/5 hover:text-text-primary', className)}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
    </a>
  )
}
