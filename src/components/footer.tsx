/*
 * Editorial footer — docs/UX_UX_Spec.md §3F, docs/ROADMAP.md §2.6.
 * plan/04-phase2-services-contact-plan.md §5 Step 5 and §9.
 *
 * Three responsibilities, each with its own hydration contract:
 *
 *   1. Copyright + direct channels — pure loader/module data, identical on the
 *      server and on the first client render.
 *   2. The CV download — `resumeUrl` comes from `site_configs.resume` through
 *      the route loader; a `null` value renders a DISABLED control (the
 *      `resume-trigger.tsx` precedent) rather than a dead link.
 *   3. The live clock — the one genuinely client-only value on the page. See
 *      `LiveClock` below: it renders the static "Jakarta, ID • GMT+7" on the
 *      server AND on the first client render, and only starts ticking from an
 *      effect. No `suppressHydrationWarning` anywhere: the mismatch is designed
 *      out, not silenced.
 *
 * Motion contract: nothing here imports `motion/react`; every state change is a
 * CSS colour/border transition, so the page's
 * `<LazyMotion features={domMin} strict>` tree gains no feature bundle.
 *
 * Semantics: this `<footer>` is rendered inside `<main>` (it is the last
 * content block of the single-page landing), so it deliberately does NOT carry
 * `role="contentinfo"` — that landmark is only valid at the top level, and
 * adding it here would be ignored at best and misleading at worst.
 */
import { useEffect, useState } from 'react'
import { ArrowUpRight, Download } from 'lucide-react'

import { cn } from '../lib/cn'
import {
  SITE_NAME,
  SITE_TZ_ABBREVIATION,
  SITE_TZ_LABEL,
  SITE_TZ_SUFFIX,
  SOCIAL_LINKS,
  formatJakartaTime,
} from '../lib/site'
import type { SocialLink } from '../lib/site'

const CONTROL_BASE =
  'inline-flex items-center gap-2 rounded-full border border-border-subtle px-3.5 py-2 font-mono text-[11px] tracking-widest uppercase transition-colors focus-visible:ring-1 focus-visible:ring-text-primary/40 focus-visible:outline-none'

const CONTROL_ACTIVE = 'text-text-secondary hover:border-border-hover hover:text-text-primary'

const CONTROL_DISABLED = 'cursor-not-allowed text-text-muted opacity-40'

const CV_CONTROL_CLASS = 'px-5 py-3'

export interface FooterProps {
  /** `site_configs.resume.url` (key `resume`, not `cv`). `null` → disabled. */
  resumeUrl: string | null
  /** Supplied by the loader so server and client render the same year. */
  copyrightYear: number
}

export function Footer({ resumeUrl, copyrightYear }: FooterProps) {
  return (
    <footer id="footer" className="border-t border-border-subtle px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs tracking-widest text-text-secondary uppercase">
            © {copyrightYear} {SITE_NAME}. All rights reserved.
          </p>

          <LiveClock />
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          <ul className="flex flex-wrap items-center gap-3">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.label}>
                <SocialControl link={link} />
              </li>
            ))}
          </ul>

          <CvDownload resumeUrl={resumeUrl} />
        </div>
      </div>
    </footer>
  )
}

interface SocialControlProps {
  link: SocialLink
}

/**
 * §3F direct channel. A pending URL is rendered as a disabled pill (with the
 * next step in its `title`) instead of an `<a>` that goes nowhere — same
 * pattern as `ResumeTrigger`.
 */
function SocialControl({ link }: SocialControlProps) {
  if (link.href === null) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title={`${link.label} — add the URL in src/lib/site.ts`}
        className={cn(CONTROL_BASE, CONTROL_DISABLED)}
      >
        <span aria-hidden="true">[ {link.label} ]</span>
        <span className="sr-only">{link.label} — not linked yet</span>
      </button>
    )
  }

  return (
    <a
      href={link.href}
      target="_blank"
      // Supabase/Storage and every social profile are different origins, so the
      // link always opens in a new tab; `noopener` is required with `_blank`.
      rel="noopener noreferrer"
      className={cn(CONTROL_BASE, CONTROL_ACTIVE)}
    >
      <span aria-hidden="true">[ {link.label} ]</span>
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

/**
 * §3F "Tombol besar Download CV (PDF)". No `download` attribute on purpose: it
 * is ignored for cross-origin URLs and Supabase Storage is a different origin.
 */
function CvDownload({ resumeUrl }: { resumeUrl: string | null }) {
  if (resumeUrl === null) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="CV not uploaded yet"
        className={cn(CONTROL_BASE, CV_CONTROL_CLASS, CONTROL_DISABLED)}
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download CV (PDF) — not uploaded yet
      </button>
    )
  }

  return (
    <a
      href={resumeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(CONTROL_BASE, CV_CONTROL_CLASS, CONTROL_ACTIVE)}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      Download CV (PDF)
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

/**
 * §3F clock — `Jakarta, ID • 17:14 WIB (GMT+7)`.
 *
 * Hydration contract: `time` starts `null`, so the server markup and the first
 * client render both produce exactly `Jakarta, ID • GMT+7`. The effect then
 * starts a 1 s interval and the suffix becomes the live `HH:MM WIB (GMT+7)`.
 * Because only the minute is displayed, 59 of every 60 ticks write the same
 * string and React bails out of the re-render — one render per minute.
 *
 * `null` is also the failure value of `formatJakartaTime` (a runtime without
 * full ICU keeps the static label rather than throwing).
 */
function LiveClock() {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    const update = () => setTime(formatJakartaTime(new Date()))
    update()

    const intervalId = window.setInterval(update, 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <p className="font-mono text-[11px] tracking-widest text-text-muted uppercase tabular-nums">
      {SITE_TZ_LABEL}
      {time === null ? (
        <span> • {SITE_TZ_SUFFIX}</span>
      ) : (
        // `min-w` reserves the widest form of the string so the timestamp
        // appearing cannot shift its neighbours (docs/UX_UX_Spec.md §8.4 CLS).
        <span className="inline-block min-w-[17ch]">
          {' '}
          • {time} {SITE_TZ_ABBREVIATION} ({SITE_TZ_SUFFIX})
        </span>
      )}
    </p>
  )
}
