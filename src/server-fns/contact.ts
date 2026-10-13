/*
 * Contact-form server seam — plan/04-phase2-services-contact-plan.md §6.
 *
 * Same shape as the site-config and projects seams: the route/component graph
 * runs in the browser too, so it must never import `src/lib/supabase.server.ts`
 * (which carries the enforced `server-only` marker). That module is imported
 * here instead, inside a `createServerFn`, whose handler body is extracted into
 * a `?tss-serverfn-split` provider module and therefore compiled out of the
 * client bundle.
 *
 * The validator runs on the SERVER ONLY: TanStack strips the `validator()`
 * call from the client copy of this module and re-applies it in the handler
 * chain, so a payload crafted outside the form is parsed before it reaches
 * PostgREST. The browser runs the same `contactSchema` itself for field-level
 * errors — see src/lib/contact.ts.
 */
import { createServerFn } from '@tanstack/react-start'

import { CONTACT_FAILURE_MESSAGE, contactSchema } from '../lib/contact'
import { insertInboxMessage } from '../lib/supabase.server'
import type { InboxMessageInsert } from '../types/database'

/** Re-exported so callers can type their form state from the seam. */
export type { ContactInput } from '../lib/contact'

/**
 * Serialisable result (docs/PRD.md §4A.1 item 5). The handler never throws to
 * the client: an outage degrades to an inline form banner instead of a 500.
 */
export interface ContactSubmitResult {
  ok: boolean
  error?: string
}

/**
 * Persist one contact-form submission into `public.inbox_messages`
 * (ROADMAP §2.6). RLS: `anon` holds INSERT only (docs/PRD.md §5E).
 *
 * `method: 'POST'` because the call mutates state; `strict` stays at its
 * default, so the request payload is checked to be serialisable at compile
 * time.
 */
export const submitContactMessage = createServerFn({ method: 'POST' })
  /*
   * The Zod schema is passed straight through (plan §3.2 A2): zod v4 implements
   * Standard Schema, so TanStack resolves the handler's `data` type and the
   * client's required payload from `~standard.types` — no wrapper function
   * needed, and `data` below is `ContactInput`, not `unknown`.
   */
  .validator(contactSchema)
  .handler(async ({ data }): Promise<ContactSubmitResult> => {
    try {
      /*
       * Typed as the table's Insert shape so that a schema/DDL drift (a column
       * added with NOT NULL and no default) fails `typecheck`, not production.
       */
      const message: InboxMessageInsert = {
        name: data.name,
        email: data.email,
        intent_type: data.intent_type,
        message: data.message,
      }

      // Creates the per-request Supabase client inside (plan §3.1 D3).
      await insertInboxMessage(message)

      return { ok: true }
    } catch (error) {
      // Detail stays server-side; the caller only ever sees fixed copy.
      console.error('[contact] failed to store message:', error)
      return { ok: false, error: CONTACT_FAILURE_MESSAGE }
    }
  })
