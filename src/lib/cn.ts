/*
 * Conditional class-name helper.
 *
 * `clsx` and `tailwind-merge` are already dependencies; this is the only
 * wrapper around them. `twMerge` matters for the composed components in
 * src/components: the navbar, CTA and pill all append state classes
 * (scroll/glass/motion-off) on top of a base string, and Tailwind's own
 * cascade cannot resolve conflicts between two utilities of the same family.
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
