/*
 * Theme switch — docs/UX_UX_Spec.md §3A (anatomy) and §6C (seamless
 * transition).
 *
 * Hydration contract (plan §6.4): the resolved theme is NEVER read during
 * render. Which icon is visible is decided purely by CSS through the `dark`
 * class that the Phase 1 block script in src/routes/__root.tsx already put on
 * <html>, so the server markup and the first client render are identical.
 * `isDark` starts as `null` and is only ever used for the accessible label.
 */
import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { Moon, Sun } from 'lucide-react'

import { cn } from '../lib/cn'
import { prefersReducedMotion } from '../lib/motion'

/*
 * The View Transitions API is reached through a structural cast rather than a
 * dependency on lib.dom having `Document.startViewTransition` typed. No `any`,
 * and no @ts-ignore: the member is looked up as `unknown` and narrowed.
 */
interface ViewTransitionHandle {
  finished: Promise<void>
  ready: Promise<void>
  skipTransition: () => void
}

type StartViewTransition = (callback: () => void) => ViewTransitionHandle

function getStartViewTransition(): StartViewTransition | undefined {
  const candidate = (
    document as unknown as { startViewTransition?: StartViewTransition | undefined }
  ).startViewTransition
  return typeof candidate === 'function' ? candidate.bind(document) : undefined
}

/** The Phase 1 theme contract: `dark` class + colorScheme + localStorage. */
function applyTheme(isDark: boolean) {
  const root = document.documentElement
  root.classList.toggle('dark', isDark)
  root.style.colorScheme = isDark ? 'dark' : 'light'

  try {
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  } catch {
    // Private mode / storage disabled: the class above still applied the theme.
  }
}

export interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState<boolean | null>(null)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // Read the live DOM state at click time so the handler can never be stale.
    const next = !document.documentElement.classList.contains('dark')

    const startViewTransition = getStartViewTransition()

    if (!startViewTransition || prefersReducedMotion()) {
      // §8.2: no reveal animation for users who asked for less motion.
      applyTheme(next)
      setIsDark(next)
      return
    }

    // §6C: the circular mask expands from the button itself.
    const root = document.documentElement
    root.style.setProperty('--vt-x', `${event.clientX}px`)
    root.style.setProperty('--vt-y', `${event.clientY}px`)

    startViewTransition(() => applyTheme(next))
    setIsDark(next)
  }

  const label =
    isDark === null
      ? 'Toggle color theme'
      : isDark
        ? 'Switch to light theme'
        : 'Switch to dark theme'

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full',
        'text-text-secondary transition-colors hover:bg-text-primary/5 hover:text-text-primary',
        'focus-visible:ring-1 focus-visible:ring-text-primary/40 focus-visible:outline-none',
        className,
      )}
    >
      {/* Icon visibility is CSS-driven — see the hydration note above. */}
      <Moon className="h-4 w-4 dark:hidden" aria-hidden="true" />
      <Sun className="hidden h-4 w-4 dark:block" aria-hidden="true" />
    </button>
  )
}
