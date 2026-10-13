/*
 * Contact-section seam — schema, vocabulary and copy.
 *
 * docs/PRD.md §6.3 requires every form input to be validated TWICE, in the
 * browser and on the server, with Zod. Both sides therefore read the SAME
 * schema object from this module:
 *
 *   - the browser: `validateContactInput(values)` inside
 *     src/components/contact-section.tsx (field errors, aria-invalid);
 *   - the server:  `.validator(contactSchema)` on the `submitContactMessage`
 *     server function (src/server-fns/contact.ts).
 *
 * The server half is not a duplicate of the client half. TanStack Start strips
 * the `validator()` call from the client copy of a server-function module
 * (@tanstack/start-plugin-core …/start-compiler/handleCreateServerFn.js:140)
 * and re-runs it server-side only (…/start-client-core …/createServerFn.js:101),
 * so a payload that bypasses the form is still rejected before it reaches
 * PostgREST.
 *
 * This module is deliberately ISOMORPHIC — it imports nothing from
 * `../lib/supabase.server`, `@tanstack/react-start/server` or any other
 * server-only module, so the browser can import it directly without relying on
 * the server-function extraction rewrite (plan/04-phase2-services-contact-plan.md
 * §3.2 A3).
 *
 * docs/UX_UX_Spec.md §3F fixes the section copy and the pill vocabulary.
 */
import { z } from 'zod/mini'

/* -------------------------------------------------------------------------- */
/* Intent vocabulary (docs/PRD.md §4A.1 item 5, docs/UX_UX_Spec.md §3F)       */
/* -------------------------------------------------------------------------- */

/** The three collaboration intents offered as pills. Never includes the DB's
 * `'general'` default — the form always submits one of these three. */
export const CONTACT_INTENT_TYPES = ['freelance', 'fulltime', 'consulting'] as const

export type ContactIntentType = (typeof CONTACT_INTENT_TYPES)[number]

/** Pill labels, verbatim from docs/UX_UX_Spec.md §3F ("Freelance / Fulltime /
 * Consulting"). */
export const CONTACT_INTENT_LABELS: Record<ContactIntentType, string> = {
  freelance: 'Freelance',
  fulltime: 'Fulltime',
  consulting: 'Consulting',
}

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

/*
 * Every rule carries a specific message (the brief, and docs/PRD.md §6.3's
 * "validasi dua arah").
 *
 * Two zod details this schema depends on:
 *
 * 1. `z.trim()` is declared FIRST in each `.check(...)` list, so it runs before
 *    the length checks — a payload of spaces can never satisfy
 *    `minLength(2)` / `minLength(10)`.
 * 2. The entry point is `zod/mini`, not `zod`. The classic build measured
 *    ~22 KB gz of client budget on its own (plan §11.4 / §14 R1); mini costs
 *    ~5 KB gz for the same schema because it drops the classic method
 *    wrappers. The API difference is confined to this file and
 *    `validateContactInput` below: mini schemas have no parse METHODS.
 *
 * `email` carries a defensive `.max(254)` on top of the brief's "valid email
 * string": zod's format check alone does not bound the length, and this text
 * lands in a `text` column.
 */
export const contactSchema = z.object({
  name: z
    .string()
    .check(
      z.trim(),
      z.minLength(2, { message: 'Please enter at least 2 characters.' }),
      z.maxLength(100, { message: 'Please keep your name under 100 characters.' }),
    ),

  email: z
    .email({ message: 'Please enter a valid email address.' })
    .check(z.maxLength(254, { message: 'Please enter a valid email address.' })),

  intent_type: z.enum(CONTACT_INTENT_TYPES, {
    message: 'Please choose a type of collaboration.',
  }),

  message: z
    .string()
    .check(
      z.trim(),
      z.minLength(10, { message: 'Please write at least 10 characters.' }),
      z.maxLength(2000, { message: 'Please keep your message under 2,000 characters.' }),
    ),
})

/** Validated, trimmed payload — the shape that crosses the server-function
 * boundary and the shape `inbox_messages` stores. */
export type ContactInput = z.infer<typeof contactSchema>

/**
 * The FORM's draft shape: identical to `ContactInput` except that
 * `intent_type` may be `''` — the deliberate "nothing chosen yet" state.
 *
 * Keeping the draft distinct from the validated payload is what lets the radio
 * group start empty while the schema still demands one of the three literals.
 * `validateContactInput` rejects `''` with "Please choose a type of
 * collaboration.", and only the parsed result (`ContactInput`) is ever handed
 * to the server function. Widening the schema instead — e.g.
 * `z.enum([...]).or(z.literal(''))` — would let an empty intent reach
 * PostgREST, which is exactly what forcing a conscious choice must prevent.
 */
export type ContactDraft = Omit<ContactInput, 'intent_type'> & {
  intent_type: ContactIntentType | ''
}

/**
 * Browser-side validation entry point.
 *
 * The component calls this instead of `contactSchema.safeParse(...)` because
 * this module imports the `zod/mini` entry point (plan §11.4: the classic entry
 * point measured ~22 KB gz of client budget on its own, over the sub-task's
 * gate). Mini schemas deliberately carry no parse METHODS — parsing is a
 * top-level function there — so the call shape lives behind this seam and the
 * component stays independent of which zod entry point built the schema.
 */
export function validateContactInput(value: unknown) {
  return z.safeParse(contactSchema, value)
}

/** The four fields the form renders, in document order. */
export const CONTACT_FIELDS = [
  'name',
  'email',
  'intent_type',
  'message',
] as const satisfies readonly (keyof ContactInput)[]

export type ContactField = keyof ContactInput

/** One message per field — the first issue Zod reports for that field. */
export type ContactFieldErrors = Partial<Record<ContactField, string>>

/**
 * The slice of a Zod issue this module actually reads, typed structurally.
 *
 * Deliberate: `zod/mini` does not re-export the `ZodError` type from its
 * external surface, and the mapper should not care which zod entry point built
 * the schema. Any `{ issues }` carrier satisfies it.
 */
export interface ContactIssue {
  readonly path: readonly PropertyKey[]
  readonly message: string
}

export function isContactField(value: string): value is ContactField {
  return (CONTACT_FIELDS as readonly string[]).includes(value)
}

/**
 * Flatten a Zod error into `{ [field]: message }`.
 *
 * `issue.path[0]` is the top-level key; anything else (a nested path, or a
 * symbol from a custom check) is dropped rather than rendered as a stray
 * message. Only the FIRST issue per field is kept, so the UI shows the most
 * relevant constraint instead of a contradiction ("too short" + "too long").
 */
export function toFieldErrors(error: {
  readonly issues: readonly ContactIssue[]
}): ContactFieldErrors {
  const fieldErrors: ContactFieldErrors = {}

  for (const issue of error.issues) {
    const [field] = issue.path
    if (typeof field === 'string' && isContactField(field) && fieldErrors[field] === undefined) {
      fieldErrors[field] = issue.message
    }
  }

  return fieldErrors
}

/**
 * The form's initial state — also the state it returns to after a successful
 * submission. `intent_type` is `''` on purpose: no pill is preselected, so the
 * visitor makes a conscious choice and Zod's
 * "Please choose a type of collaboration." is what enforces it. (This
 * supersedes plan §3.2 A5, which preselected `freelance`; the draft type above
 * is what makes the empty state expressible without weakening the schema.)
 * Frozen because it is shared by every render.
 */
export const EMPTY_CONTACT_FORM: ContactDraft = Object.freeze({
  name: '',
  email: '',
  intent_type: '',
  message: '',
})

/* -------------------------------------------------------------------------- */
/* Copy (docs/UX_UX_Spec.md §3F)                                              */
/* -------------------------------------------------------------------------- */

export const CONTACT_SECTION_EYEBROW = '[ CONTACT ]'

/** §3F headline, verbatim. */
export const CONTACT_SECTION_TITLE = 'Have a project in mind, or looking for your next tech lead?'

/**
 * §3F body copy. Rendered as text; the direct-email anchor is composed next to
 * it in src/components/contact-section.tsx so this constant stays a plain
 * string.
 */
export const CONTACT_SECTION_SUMMARY =
  'Tell me what you are building, what is in the way, and when it needs to be live. I read every message myself and reply within two working days.'

/** Direct channel offered beside the form (plan §16 open item 3). */
export const CONTACT_EMAIL = 'tommy.alfarabi@gmail.com'
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`

/** Success panel copy (plan §8 "Success"). */
export const CONTACT_STORED_MESSAGE =
  'Thank you — your message is in my inbox. I will reply to the address you gave within two working days.'

/** Returned INSIDE `{ ok: false }` when the insert fails. Fixed copy on
 * purpose: the PostgREST error never reaches the DOM (plan §14 R5). */
export const CONTACT_FAILURE_MESSAGE =
  'Something went wrong on my side, so your message was not stored. Please try again in a moment, or email me directly.'

/** Shown when the server function itself could not be reached (offline, 500,
 * or the server-side validator rejecting a payload the client never sends).
 * Also fixed copy: the rejected promise carries framework error text
 * (…/client-rpc/serverFnFetcher.js:174) that must not be rendered. */
export const CONTACT_UNREACHABLE_MESSAGE =
  'Your message could not be sent just now. Please check your connection and try again, or email me directly.'
