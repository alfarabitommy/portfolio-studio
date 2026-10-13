/*
 * Site-level constants.
 *
 * docs/UX_UX_Spec.md §3A fixes the navbar anatomy and vocabulary; this module
 * is the single place those literals live, so the shell (navbar), the footer
 * and the landing route cannot drift apart.
 */

/** Navbar anchor: a same-document fragment on the landing page. */
export interface NavLink {
  label: string
  href: string
}

/**
 * Monogram rendered by the floating pill (docs/UX_UX_Spec.md §3A wireframe).
 * Change this one line when the real initials are finalised.
 */
export const SITE_MONOGRAM = 'TA'

/** Full name used by the footer copyright line. */
export const SITE_NAME = 'Tommy Alfarabi'

/**
 * A direct channel shown in the footer (docs/UX_UX_Spec.md §3F).
 *
 * `href: null` means the URL is not configured yet. The footer renders a
 * DISABLED control in that case rather than a dead link — the same posture
 * `resume-trigger.tsx` takes for a missing CV. Filling one in is a one-line
 * change here.
 */
export interface SocialLink {
  label: string
  href: string | null
}

/**
 * §3F: "LinkedIn, GitHub, X (Twitter), dan WhatsApp". All four are pending
 * URLs, so every entry ships in the disabled state (plan §3.2 A6).
 */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: 'GitHub', href: null },
  { label: 'LinkedIn', href: null },
  { label: 'X', href: null },
  { label: 'WhatsApp', href: null },
] as const

/**
 * Navbar anchors in spec order. Targets (`#works`, `#services`, `#articles`,
 * `#contact`) are delivered by ROADMAP §2.3–§2.6; until then the browser
 * simply does not scroll, which is the accepted Phase 2.1 behaviour.
 */
export const NAV_LINKS: readonly NavLink[] = [
  { label: 'Works', href: '#works' },
  { label: 'Services', href: '#services' },
  { label: 'Articles', href: '#articles' },
  { label: 'Contact', href: '#contact' },
] as const

/** docs/UX_UX_Spec.md §3A: the pill shrinks once the page scrolls past 80px. */
export const NAV_SCROLL_THRESHOLD = 80

/* -------------------------------------------------------------------------- */
/* Footer clock (docs/UX_UX_Spec.md §3F)                                      */
/* -------------------------------------------------------------------------- */

/*
 * §3F fixes the clock's wording: "Jakarta, ID • 17:14 WIB (GMT+7)". It is split
 * into a static part and a live part so the footer can render a stable string
 * during SSR and hydration, and only start ticking after mount (see
 * src/components/footer.tsx).
 */

/** IANA zone the clock is anchored to — never the visitor's local zone. */
export const SITE_TIMEZONE = 'Asia/Jakarta'

/** Static prefix: rendered on the server AND on the first client render. */
export const SITE_TZ_LABEL = 'Jakarta, ID'

/** Static suffix, used alone before the first tick and inside the live string. */
export const SITE_TZ_SUFFIX = 'GMT+7'

/** Indonesian abbreviation for Western Indonesian Time. */
export const SITE_TZ_ABBREVIATION = 'WIB'

/*
 * Built lazily and defensively: constructing an `Intl.DateTimeFormat` with an
 * unsupported zone throws (a runtime without full ICU), and this module is
 * imported by both the server and the browser graph. On failure the clock keeps
 * the static label instead of crashing a render (plan §14 R7).
 */
let jakartaTimeFormatter: Intl.DateTimeFormat | null | undefined

function getJakartaTimeFormatter(): Intl.DateTimeFormat | null {
  if (jakartaTimeFormatter === undefined) {
    try {
      jakartaTimeFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: SITE_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        // `hourCycle: 'h23'` is what keeps midnight `00:00` rather than `24:00`;
        // `hour12: false` alone leaves that choice to the locale.
        hour12: false,
        hourCycle: 'h23',
      })
    } catch {
      jakartaTimeFormatter = null
    }
  }

  return jakartaTimeFormatter
}

/**
 * `HH:MM` in Jakarta, e.g. `17:14`. Locale-independent (`en-GB` + `h23`), so
 * server and client always agree on the string. Returns `null` when the runtime
 * cannot format the zone at all.
 */
export function formatJakartaTime(date: Date): string | null {
  const formatter = getJakartaTimeFormatter()
  return formatter === null ? null : formatter.format(date)
}
