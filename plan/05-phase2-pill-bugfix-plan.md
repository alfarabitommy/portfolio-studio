# Phase 2 — Sub-Task C.1: Contact Intent Pills — Selected-State Leak

| | |
| --- | --- |
| **Status** | Diagnosis complete, fix selected — execution not started |
| **Scope** | `src/components/contact-section.tsx` only. No other file is expected to change. |
| **Decision record** | User-selected fix: **label wraps the input + `has-checked:`** (vs. isolated wrapper `<div>`; vs. named peers) |
| **Supersedes** | `plan/04-phase2-services-contact-plan.md` risk **R4** (predicted the wrong failure mode) and its G9 assertion `peer-checked pill rule emitted` |
| **Deliverable of this file** | A fix that preserves the pill's exact tokens, glow and geometry |

---

## 1. Diagnosis — why the CSS state leaks across siblings

**DOM shape today** (`Fragment` = no wrapper), all six nodes are direct children of one
`flex flex-wrap gap-3` container:

```
I1(.peer) L1   I2(.peer) L2   I3(.peer) L3     I = <input class="peer sr-only">, L = <label class=PILL_CLASS>
```

**What Tailwind 4.3.3 actually compiles `peer` to** — the *general* sibling combinator `~`:

```js
// node_modules/tailwindcss/dist/lib.mjs  (peer variant)
v.selector = `&:is(${k} ~ *)`     // k = ":where(.peer)"  or  ":where(.peer\/<name>)"
```

already recorded in this repo at `plan/04-phase2-services-contact-summary.md:205`:
`.peer-checked\:…:is(:where(.peer):checked~*)`.

`~` means **any following sibling**, not "the label that is mine". The styled subject is the
*label*, so a pill lights up whenever **any** preceding sibling in that flat list carries
`.peer:checked`. The number of lit pills is therefore a function of the checked input's
**index**:

| Checked pill | Input position | Labels that match `~` | Observed |
| --- | --- | --- | --- |
| Freelance | 1st (`I1`) | `L1 L2 L3` | **all three light up** |
| Fulltime | 2nd (`I2`) | `L2 L3` | two light up, order-dependent |
| Consulting | 3rd (`I3`) | `L3` | **only itself lights up** |

That is exactly the reported behaviour — "first pill lights everything, last pill lights only
itself, the ones in between behave unpredictably". `peer-focus-visible:` leaks the same way.

**Not broken:** React state. `checked={values.intent_type === intent}` is correctly
controlled, so the submitted payload / DB row are right; only the *presentation* of the
selected state is wrong.

**Blast radius:** `grep -rn peer src/` → this file only (`:70-81`, `:386`). One fix site.

---

## 2. The fix — state scoped by containment instead of by sibling order

The label **becomes the pill and contains its own radio**, so the selected state can only ever
be read from inside a single pill's own subtree. There is no combinator left that *can* leak,
under any future markup arrangement.

**`PILL_CLASS` (only the three variant prefixes change; every token is byte-identical otherwise):**

```diff
-  'peer-checked:border-accent-emerald peer-checked:text-text-primary',
-  'peer-checked:shadow-[0_0_0_1px_var(--accent-glow)]',
-  'peer-focus-visible:ring-1 peer-focus-visible:ring-text-primary/40',
+  'has-checked:border-accent-emerald has-checked:text-text-primary',
+  'has-checked:shadow-[0_0_0_1px_var(--accent-glow)]',
+  'has-focus-visible:ring-1 has-focus-visible:ring-text-primary/40',
```

**Map body** — `Fragment`, the `radioId` variable and the `htmlFor`/`id` pairing all disappear
(containment *is* the label association):

```tsx
<div className="flex flex-wrap gap-3">
  {CONTACT_INTENT_TYPES.map((intent) => (
    <label key={intent} className={PILL_CLASS}>
      <input
        type="radio" name="intent_type" value={intent} required
        className="sr-only"
        checked={values.intent_type === intent}
        onChange={() => setField('intent_type', intent)}
        aria-invalid={invalidFlag(errors.intent_type)}
      />
      {CONTACT_INTENT_LABELS[intent]}
    </label>
  ))}
</div>
```

**Import line must lose `Fragment`** — `import { useEffect, useId, useRef, useState } from 'react'`.
Under `noUnusedLocals` (AGENTS.md, `npm run typecheck`) a stale `Fragment` import fails the gate.

### Why this is inert elsewhere

- `has-*` is a confirmed Tailwind 4.3.3 compound variant: `compound("has",2,…)` rewrites
  `&:checked` → `&:has(*:checked)` (`lib.mjs`). No `app.css` change, no token change.
- **Geometry unchanged:** the label is still the flex item of the same `flex flex-wrap gap-3`
  row; `sr-only` is `position:absolute` + clipped, so it stays out of flow exactly as before
  (and no positioning ancestor was introduced — the label is not `relative`).
- **A11y invariants untouched:** `aria-invalid` stays on the radios (so the focus effect's
  `formRef.querySelector('[aria-invalid="true"]')` still resolves), `required` stays, the
  `<fieldset>`/`<legend>`/`aria-describedby` wiring is unchanged, and the pill remains a real
  `<input type="radio" name="intent_type">` group → arrow-key navigation and AT state for free.
- **Motion contract intact:** still pure CSS colour/border/shadow transitions; no `motion/react`
  import (plan/04 D1).

### Non-goals

No `src/styles/app.css`, token, copy, `src/lib/contact.ts`, zod or server-function change.

---

## 3. Verification gates

| # | Gate | Assertion |
| --- | --- | --- |
| G1 | `npm run typecheck` | exit 0 (proves the `Fragment` removal) |
| G2 | `npm run build` | exit 0 → `.output/` |
| G3 | generated-CSS grep (replaces plan/04 G9's `peer-checked` assertion) | built CSS contains `.has-checked\:border-accent-emerald:has(` and `.has-focus-visible\:ring-1:has(`; `--accent-glow` shadow utility still emitted |
| G4 | SSR check: `npm run dev` then `curl -s localhost:3000/` | `name="intent_type"` ×3 · exactly one `checked` (A5: `freelance` preselected) · `aria-invalid="true"` ×0 · **0** occurrences of `peer` · 3× the pill class string |
| G5 | Hand-driven interaction (no test runner exists in this repo — AGENTS.md) | click 1st, 2nd, 3rd pill in turn → **exactly one** label shows `border-emerald` + `--accent-glow` ring (devtools computed style); Tab into the group, Arrow keys → selection moves and the focus ring follows only the focused pill |

---

## 4. Risks & fallback

| # | Risk | Mitigation |
| --- | --- | --- |
| R1 | `:has()` browser floor (Chrome 105+ / Safari 15.4+ / Firefox 121+); UX spec has no browser matrix, and Tailwind v4 already requires modern CSS | Fallback is a one-structure swap: isolated `<div className="flex">` per pill with the **old** `peer-checked:` string restored |
| R2 | `has-*` compound variant not emitted | Detectable at G3 before any interaction test; same fallback as R1 |
| R3 | The default-selected `freelance` pill (A5) regresses | G4 asserts exactly one `checked` |

---

## 5. Execution order

0. Write this document to `plan/05-phase2-pill-bugfix-plan.md`.
1. Edit `src/components/contact-section.tsx`: `PILL_CLASS` variant prefixes → `has-*`; the map
   body → label-wrapped input; drop `radioId`; drop `Fragment` from the import.
2. Run G1 → G4.
3. Hand-verify G5 and report the observed result verbatim (no test suite to lean on).
4. Optional, per repo convention: `plan/05-phase2-pill-bugfix-summary.md` recording the emitted
   selector and the gate results.
