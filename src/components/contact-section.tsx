/*
 * Interactive contact section — docs/UX_UX_Spec.md §3F, docs/ROADMAP.md §2.6,
 * docs/PRD.md §4A.1 item 5 and §6.3.
 * plan/04-phase2-services-contact-plan.md §5 Step 6 and §8.
 * plan/05-phase2-pill-bugfix-plan.md §2 — the intent pills read their selected
 * state by containment (`has-checked:`), never through a sibling combinator.
 *
 * Dual-side validation (docs/PRD.md §6.3): this component runs
 * `validateContactInput` — the same Zod schema the server re-runs — in the
 * browser for field-level errors, and the server function it calls runs that
 * schema object again through `.validator(contactSchema)`. The server half is
 * not a duplicate: TanStack Start strips the validator from the client copy of
 * a server-function module and re-applies it in the handler chain, so a payload
 * that never touches this form is still parsed before it reaches PostgREST.
 *
 * Motion contract: no `motion/react` import. Every state change is a CSS
 * colour/border/shadow transition behind `motion-safe:`, so the page's
 * `<LazyMotion features={domMin} strict>` tree gains no features. The one
 * gesture-free affordance is the native radio group below.
 *
 * Accessibility contract:
 *   - one ALWAYS-MOUNTED `aria-live="polite"` region whose subtree swaps
 *     between the form and the thank-you panel, so the region pre-exists any
 *     change it has to announce (a live region created at the same time as its
 *     content is not reliably announced);
 *   - `aria-invalid` + `aria-describedby` are set only while a field is
 *     invalid, and the attribute is ABSENT when it is valid;
 *   - focus is moved once per settled state: the first invalid control, or the
 *     status panel when the failure carries no field errors.
 */
import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

import { cn } from '../lib/cn'
import {
  CONTACT_EMAIL,
  CONTACT_FAILURE_MESSAGE,
  CONTACT_INTENT_LABELS,
  CONTACT_INTENT_TYPES,
  CONTACT_MAILTO,
  CONTACT_SECTION_EYEBROW,
  CONTACT_SECTION_SUMMARY,
  CONTACT_SECTION_TITLE,
  CONTACT_STORED_MESSAGE,
  CONTACT_UNREACHABLE_MESSAGE,
  EMPTY_CONTACT_FORM,
  toFieldErrors,
  validateContactInput,
} from '../lib/contact'
import type { ContactDraft, ContactField, ContactFieldErrors } from '../lib/contact'
import { submitContactMessage } from '../server-fns/contact'

/** `idle → submitting → success | error` (plan §4.3). */
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

/*
 * Bottom-border-only input (docs/UX_UX_Spec.md §3F: "Bottom-border only
 * styling"). Focus lights the underline emerald and adds the §2A glow; an
 * invalid field swaps the underline to `text-primary` — the design system has
 * no danger colour and §2A is authoritative, so errors read as editorial
 * (brighter line + a mono message) rather than alarming (plan §3.2 A4).
 */
const INPUT_CLASS = [
  'w-full rounded-none border-0 border-b border-border-subtle bg-transparent px-0 py-3',
  'text-text-primary placeholder:text-text-muted',
  'focus:border-accent-emerald focus:shadow-[0_6px_16px_-8px_var(--accent-glow)] focus:outline-none',
  'aria-[invalid=true]:border-text-primary',
  'motion-safe:transition-[border-color,box-shadow] motion-safe:duration-300',
].join(' ')

/*
 * The label IS the pill and CONTAINS its own `<input class="sr-only">`, so the
 * selected state is read by containment — `has-checked:` / `has-focus-visible:`
 * compile to `:has(*:checked)` / `:has(*:focus-visible)`, which can only ever
 * match the radio inside this very label.
 *
 * This replaced a flat `peer sr-only` + sibling-`<label>` layout
 * (plan/05-phase2-pill-bugfix-plan.md §1). Tailwind's `peer` variant is a
 * GENERAL sibling selector (`&:is(:where(.peer):checked ~ *)`), so with all
 * three radios and all three labels as siblings of one flex row, every label
 * *after* a checked radio lit up: the 1st pill lit all three, the 2nd lit two,
 * the 3rd lit only itself. A wrapper element would also have isolated the
 * sibling combinator; containment removes the combinator entirely, so the leak
 * cannot return under any future markup arrangement.
 *
 * The control stays a real `<input type="radio">` inside the same
 * `name="intent_type"` group, so arrow-key navigation, `:checked`, and AT state
 * reporting all come for free. `:has()` is Baseline (Chrome 105+, Safari 15.4+,
 * Firefox 121+) and Tailwind v4 already requires a modern engine.
 */
const PILL_CLASS = [
  'cursor-pointer rounded-full border border-border-subtle bg-surface-glass px-4 py-2',
  'font-mono text-[11px] tracking-widest text-text-secondary uppercase backdrop-blur-md',
  'transition-colors hover:text-text-primary',
  'has-checked:border-accent-emerald has-checked:text-text-primary',
  'has-checked:shadow-[0_0_0_1px_var(--accent-glow)]',
  'has-focus-visible:ring-1 has-focus-visible:ring-text-primary/40',
].join(' ')

/*
 * Primary CTA. It reuses the site's established primary language — the hero's
 * `MagneticButton` (magnetic-button.tsx, variant `primary`) is the same glass
 * surface + emerald-tinted border + `text-text-primary` pairing — so the form's
 * terminal action reads as THE action on the page rather than a grey control.
 *
 * The previous revision was `border-border-subtle` + `text-text-secondary`,
 * which is the same weight as the disabled pills around it and read as
 * unavailable. Now: a real emerald edge, primary-coloured text and the §2A glow
 * on hover.
 *
 * Idle vs loading: `enabled:hover:` guards the hover treatment, so a disabled
 * (submitting) button falls back to the muted surface instead of lighting up
 * under the cursor — the state change is unmistakable, and it is reinforced by
 * the label swap and a `motion-safe:` pulse.
 */
const SUBMIT_CLASS = [
  'inline-flex items-center justify-center gap-2 self-start rounded-full',
  'border border-accent-emerald/40 bg-surface-glass px-7 py-3.5 backdrop-blur-md',
  'font-mono text-[11px] tracking-widest text-text-primary uppercase',
  'transition-[border-color,box-shadow,background-color,color,opacity] duration-300',
  'enabled:hover:border-accent-emerald enabled:hover:shadow-[0_0_15px_var(--accent-glow)]',
  'focus-visible:ring-1 focus-visible:ring-text-primary/40 focus-visible:outline-none',
  'disabled:cursor-wait disabled:border-border-subtle disabled:bg-transparent disabled:text-text-secondary disabled:opacity-80 disabled:shadow-none',
].join(' ')

/*
 * Functional field labels (and the radio legend) use `text-text-secondary`.
 * They previously used `text-text-muted`, which measures 2.46:1 on the light
 * base and 4.12:1 on the dark one — both below the 4.5:1 that UX §8.3 requires
 * of label text (plan/04 summary F-1). Secondary is 7.41:1 / 7.76:1. The
 * `text-text-muted` eyebrow treatment elsewhere on the page is unchanged.
 */
const FIELD_LABEL_CLASS = 'font-mono text-[11px] tracking-widest text-text-secondary uppercase'

/** Error copy is mono + `text-text-primary`: ≥ 4.5:1 in both themes (§8.3). */
const FIELD_ERROR_CLASS = 'font-mono text-[11px] tracking-widest text-text-primary uppercase'

/** `aria-describedby` target for a field, or `undefined` while it is valid. */
function errorLink(id: string, error: string | undefined): string | undefined {
  return error === undefined ? undefined : `${id}-error`
}

/** `true` while invalid, `undefined` otherwise so the attribute is ABSENT. */
function invalidFlag(error: string | undefined): true | undefined {
  return error === undefined ? undefined : true
}

export function ContactSection() {
  return (
    <section
      id="contact"
      className="relative border-t border-border-subtle px-6 py-24 sm:px-10 lg:px-16"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
        {/* Left half — copy and the direct channel, above the form on mobile so
            the invitation is read before the inputs. */}
        <div className="flex flex-col gap-6">
          <span className="font-mono text-xs tracking-widest text-text-muted">
            {CONTACT_SECTION_EYEBROW}
          </span>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {CONTACT_SECTION_TITLE}
          </h2>

          <p className="max-w-prose text-text-secondary">
            {CONTACT_SECTION_SUMMARY}{' '}
            <>
              Prefer email? Write to{' '}
              <a
                href={CONTACT_MAILTO}
                className="rounded-sm text-text-primary underline decoration-text-muted underline-offset-4 transition-colors hover:decoration-accent-emerald focus-visible:ring-1 focus-visible:ring-text-primary/40 focus-visible:outline-none"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </>
          </p>
        </div>

        <ContactForm />
      </div>
    </section>
  )
}

/*
 * The form is an internal component on purpose (the same shape as
 * project-drawer.tsx's panel): it owns the whole submission state machine, so
 * `ContactSection` stays a purely presentational grid.
 */
function ContactForm() {
  // `useId()` keeps the label/error/generated ids SSR-stable.
  const formId = useId()
  /** Base id for the intent radio group (legend + error paragraph). */
  const intentId = `${formId}-intent_type`

  const [values, setValues] = useState<ContactDraft>(EMPTY_CONTACT_FORM)
  const [errors, setErrors] = useState<ContactFieldErrors>({})
  const [status, setStatus] = useState<SubmitStatus>('idle')
  /** Server-side failure copy. Only ever one of the two fixed constants. */
  const [banner, setBanner] = useState<string | null>(null)

  const formRef = useRef<HTMLFormElement | null>(null)
  /** Attached to whichever panel is showing (error banner or thank-you). */
  const statusRef = useRef<HTMLDivElement | null>(null)
  const bannerRef = useRef<HTMLParagraphElement | null>(null)

  /*
   * Focus management, keyed on the settled state only — never on a keystroke,
   * and never while `submitting`. A client-side rejection focuses the first
   * invalid control; a server-side failure (which has no field errors) focuses
   * the banner; success focuses the thank-you panel.
   */
  useEffect(() => {
    if (status === 'idle' || status === 'submitting') return

    const firstInvalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    const target = firstInvalid ?? bannerRef.current ?? statusRef.current
    target?.focus()
  }, [status])

  function setField<K extends ContactField>(field: K, value: ContactDraft[K]) {
    setValues((current) => ({ ...current, [field]: value }))

    // Validate-all on submit, clear-on-edit while the user fixes a field
    // (plan §3.2 A11): no per-keystroke re-validation, so the form never
    // argues with someone mid-word.
    setErrors((current) => {
      if (current[field] === undefined) return current
      const next = { ...current }
      delete next[field]
      return next
    })

    if (status === 'error') {
      setStatus('idle')
      setBanner(null)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Guards a double submit from a double click / Enter + click.
    if (status === 'submitting') return

    // (1) Browser-side validation, with the same schema the server re-runs.
    const parsed = validateContactInput(values)
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error))
      setBanner(null)
      setStatus('error')
      return
    }

    setErrors({})
    setBanner(null)
    setStatus('submitting')

    try {
      // (2) Server-side validation + persistence. `parsed.data` is already
      //     trimmed and typed, so the wire payload is exactly `ContactInput`.
      const result = await submitContactMessage({ data: parsed.data })

      if (result.ok) {
        setValues(EMPTY_CONTACT_FORM)
        setStatus('success')
        return
      }

      setBanner(result.error ?? CONTACT_FAILURE_MESSAGE)
      setStatus('error')
    } catch (error) {
      /*
       * A rejected call (offline, 500, or the server validator refusing a
       * payload the browser never sends) carries framework error text on the
       * message — it is logged, never rendered. The user sees fixed copy.
       */
      console.error('[contact] submit failed:', error)
      setBanner(CONTACT_UNREACHABLE_MESSAGE)
      setStatus('error')
    }
  }

  return (
    /*
     * Architectural glass card — the right column is a surface, not floating
     * text on the page background.
     *
     * Surface choice: the brief suggested `bg-surface-glass/30`, but
     * `--surface-glass` is `rgba(9, 9, 11, 0.65)` in the DEFAULT (dark) theme, so
     * 30% of it over a `#09090b` page composites to `#09090b` — an invisible
     * card. `bg-surface-card/60` (dark `#18181b`, light `#ffffff`) gives a
     * subtle but real plate in both themes: light ≈ #fdfdfd, dark ≈ #0f0f11.
     * `backdrop-blur-md` + the hairline border carry the glass character.
     *
     * The card is also a plain presentational wrapper: the live region below is
     * a SEPARATE, always-mounted element that survives the form ↔ thank-you
     * swap, so the card can never affect announcement timing.
     */
    <div className="flex flex-col rounded-3xl border border-border-subtle bg-surface-card/60 p-8 backdrop-blur-md lg:p-10">
      {/*
       * One always-mounted live region (plan §3.2 A12). `aria-busy` is NOT set
       * here: it would suppress announcements for the whole region while
       * submitting, including the final result.
       */}
      <div aria-live="polite">
        {status === 'success' ? (
          <div
            ref={statusRef}
            tabIndex={-1}
            // No card styling of its own: the panel sits INSIDE the glass card,
            // so a second border/surface here would be a box in a box.
            className="flex flex-col gap-5 focus:outline-none"
          >
            <span className="inline-flex items-center gap-2 font-mono text-xs tracking-widest text-text-secondary uppercase">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-emerald" />
              Message stored
            </span>

            <p className="text-text-secondary">{CONTACT_STORED_MESSAGE}</p>

            <a
              href={CONTACT_MAILTO}
              className="self-start rounded-sm font-mono text-[11px] tracking-widest text-text-secondary uppercase underline decoration-text-muted underline-offset-4 transition-colors hover:text-text-primary hover:decoration-accent-emerald focus-visible:ring-1 focus-visible:ring-text-primary/40 focus-visible:outline-none"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        ) : (
          <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-8">
            <Field id={`${formId}-name`} label="Your name" error={errors.name}>
              <input
                id={`${formId}-name`}
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Jane Doe"
                value={values.name}
                onChange={(event) => setField('name', event.target.value)}
                aria-invalid={invalidFlag(errors.name)}
                aria-describedby={errorLink(`${formId}-name`, errors.name)}
                className={INPUT_CLASS}
              />
            </Field>

            <Field id={`${formId}-email`} label="Email address" error={errors.email}>
              <input
                id={`${formId}-email`}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="jane@studio.com"
                value={values.email}
                onChange={(event) => setField('email', event.target.value)}
                aria-invalid={invalidFlag(errors.email)}
                aria-describedby={errorLink(`${formId}-email`, errors.email)}
                className={INPUT_CLASS}
              />
            </Field>

            {/*
             * Required radio group.
             *
             * `mb-4` on the <legend> is doing real work: a rendered legend is not
             * a normal flex item, so the fieldset's `gap` never applied to it —
             * that is the spacing defect this replaces (the fieldset is no longer
             * a flex column at all, and the legend's block-end margin is what
             * separates it from the pills).
             *
             * `aria-describedby` lives on the fieldset so the group announces the
             * requirement once; `aria-invalid` sits on the radios themselves,
             * which is both valid on `input[type=radio]` and what lets the
             * focus-management effect find the group via `[aria-invalid="true"]`.
             *
             * NO pill is preselected: `EMPTY_CONTACT_FORM.intent_type` is `''`
             * (src/lib/contact.ts), so the group renders with zero checked
             * radios and the "choose a type" error is Zod's job, not a default.
             */}
            <fieldset
              className="min-w-0"
              aria-describedby={errorLink(intentId, errors.intent_type)}
            >
              <legend className={cn(FIELD_LABEL_CLASS, 'mb-4')}>
                Type of collaboration
              </legend>

              <div className="flex flex-wrap gap-3">
                {CONTACT_INTENT_TYPES.map((intent) => (
                  /*
                   * One label per pill, each holding its own radio. No wrapper
                   * element and no `htmlFor`/`id` pair is needed: the implicit
                   * label association comes from containment, which is also
                   * what scopes `has-checked:` to this pill alone.
                   */
                  <label key={intent} className={PILL_CLASS}>
                    <input
                      name="intent_type"
                      type="radio"
                      value={intent}
                      required
                      // `sr-only` keeps it in the tab order (it is NOT hidden
                      // from AT); the label around it carries the visuals.
                      className="sr-only"
                      checked={values.intent_type === intent}
                      onChange={() => setField('intent_type', intent)}
                      aria-invalid={invalidFlag(errors.intent_type)}
                    />
                    {CONTACT_INTENT_LABELS[intent]}
                  </label>
                ))}
              </div>

              {errors.intent_type === undefined ? null : (
                <p id={`${intentId}-error`} className={cn(FIELD_ERROR_CLASS, 'mt-3')}>
                  {errors.intent_type}
                </p>
              )}
            </fieldset>

            <Field id={`${formId}-message`} label="Message" error={errors.message}>
              <textarea
                id={`${formId}-message`}
                name="message"
                rows={5}
                required
                placeholder="What are you building, and what is in the way?"
                value={values.message}
                onChange={(event) => setField('message', event.target.value)}
                aria-invalid={invalidFlag(errors.message)}
                aria-describedby={errorLink(`${formId}-message`, errors.message)}
                className={cn(INPUT_CLASS, 'resize-y')}
              />
            </Field>

            {/*
             * Server-side failure copy. `min-h` reserves the line so the button
             * below cannot jump when the message appears (CLS 0 target).
             * `tabIndex={-1}` makes it a programmatic focus target; it is not a
             * nested live region — the wrapper above announces the change.
             */}
            <p
              ref={bannerRef}
              tabIndex={-1}
              className={cn(FIELD_ERROR_CLASS, 'min-h-5 focus:outline-none')}
            >
              {banner ?? ''}
            </p>

            <button
              type="submit"
              disabled={status === 'submitting'}
              aria-busy={status === 'submitting'}
              className={SUBMIT_CLASS}
            >
              {status === 'submitting' ? (
                <span className="motion-safe:animate-pulse">Sending…</span>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

interface FieldProps {
  id: string
  label: string
  error: string | undefined
  /** The control. Its `aria-*` wiring is set at the call site from the same
   * `id`/`error`, which is what keeps `aria-describedby` and the message's
   * `id` from drifting apart. */
  children: ReactNode
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={FIELD_LABEL_CLASS}>
        {label}
      </label>

      {children}

      {error === undefined ? null : (
        <p id={`${id}-error`} className={FIELD_ERROR_CLASS}>
          {error}
        </p>
      )}
    </div>
  )
}
