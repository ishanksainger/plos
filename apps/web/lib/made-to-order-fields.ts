/**
 * Per-SKU personalisation fields for made-to-order products.
 *
 * The whole point: the details form is scoped to the *exact* item the buyer is
 * paying for. A ₹199 single-video buyer is never shown "The Wedding Box" as an
 * option, and never asked for four ceremonies' worth of dates — they answer for
 * one ceremony. This replaces the single general Google Form (which let a ₹199
 * buyer self-declare the ₹999 box) and is collected BEFORE payment, so no one
 * pays and then wonders where their product went.
 *
 * These are pure data + pure helpers so they can be unit-tested without a
 * browser or a network — see `__tests__/made-to-order-fields.test.ts`.
 */

export type MtoField = {
  name: string;
  label: string;
  kind: 'text' | 'textarea' | 'radio';
  placeholder?: string;
  /** radio only */
  options?: string[];
  required?: boolean;
};

export type MtoSpec = {
  slug: string;
  /** Shown above the form so the buyer knows why we ask before charging. */
  intro: string;
  fields: MtoField[];
};

export type MtoAnswers = Record<string, string>;
export type MtoDetail = { label: string; value: string };

const INTRO =
  'We personalise this by hand, so we need a few details before payment. Nothing is charged until you continue to pay.';

// ── ₹199 — one video for ONE ceremony + the four cards ──────────────────────
const SINGLE_VIDEO: MtoSpec = {
  slug: 'wedding-video-invite',
  intro: INTRO,
  fields: [
    {
      name: 'ceremony',
      label: 'Which ceremony is this video for?',
      kind: 'radio',
      required: true,
      options: ['Main Wedding', 'Haldi', 'Mehendi & Sangeet', 'Sagan / Ring Ceremony'],
    },
    { name: 'coupleNames', label: "Bride's & groom's names", kind: 'text', required: true, placeholder: 'Aanya & Rohan' },
    { name: 'date', label: 'Ceremony date', kind: 'text', required: true, placeholder: 'Saturday, 12 December 2026' },
    { name: 'venue', label: 'Venue & city', kind: 'text', required: true, placeholder: 'The Rambagh Palace, Jaipur' },
    { name: 'phone', label: 'Phone (WhatsApp)', kind: 'text', placeholder: 'Optional' },
    { name: 'side', label: "Bride's side, groom's side, or both?", kind: 'text', placeholder: 'Optional' },
    { name: 'note', label: 'Anything you would like customised?', kind: 'textarea', placeholder: 'Optional' },
  ],
};

// ── ₹999 — all four videos + four cards + the planner ───────────────────────
const WEDDING_BOX: MtoSpec = {
  slug: 'wedding-box',
  intro: INTRO,
  fields: [
    { name: 'coupleNames', label: "Bride's & groom's names", kind: 'text', required: true, placeholder: 'Aanya & Rohan' },
    { name: 'phone', label: 'Phone (WhatsApp)', kind: 'text', placeholder: 'Optional' },
    { name: 'mainDate', label: 'Main Wedding — date', kind: 'text', required: true, placeholder: 'Saturday, 12 December 2026' },
    { name: 'mainVenue', label: 'Main Wedding — venue & city', kind: 'text', required: true, placeholder: 'The Rambagh Palace, Jaipur' },
    { name: 'haldiDate', label: 'Haldi — date', kind: 'text', placeholder: 'Leave blank if not having this ceremony' },
    { name: 'haldiVenue', label: 'Haldi — venue & city', kind: 'text', placeholder: 'Optional' },
    { name: 'mehendiDate', label: 'Mehendi & Sangeet — date', kind: 'text', placeholder: 'Leave blank if not having this ceremony' },
    { name: 'mehendiVenue', label: 'Mehendi & Sangeet — venue & city', kind: 'text', placeholder: 'Optional' },
    { name: 'saganDate', label: 'Sagan / Ring Ceremony — date', kind: 'text', placeholder: 'Leave blank if not having this ceremony' },
    { name: 'saganVenue', label: 'Sagan / Ring Ceremony — venue & city', kind: 'text', placeholder: 'Optional' },
    { name: 'side', label: "Bride's side, groom's side, or both?", kind: 'text', placeholder: 'Optional' },
    { name: 'note', label: 'Anything you would like customised?', kind: 'textarea', placeholder: 'Optional' },
  ],
};

const SPECS: Record<string, MtoSpec> = {
  [SINGLE_VIDEO.slug]: SINGLE_VIDEO,
  [WEDDING_BOX.slug]: WEDDING_BOX,
};

/** The personalisation spec for a made-to-order SKU, or null if it has none. */
export function madeToOrderSpec(slug: string): MtoSpec | null {
  return SPECS[slug] ?? null;
}

/** Names of required fields whose answer is empty/whitespace. */
export function missingRequired(spec: MtoSpec, answers: MtoAnswers): string[] {
  return spec.fields
    .filter((f) => f.required && !(answers[f.name] ?? '').trim())
    .map((f) => f.name);
}

/**
 * Ordered, non-empty {label, value} pairs for the confirmation + ops emails.
 * Only fields the buyer actually filled are included, in spec order.
 */
export function buildDetailsSummary(spec: MtoSpec, answers: MtoAnswers): MtoDetail[] {
  return spec.fields
    .map((f) => ({ label: f.label, value: (answers[f.name] ?? '').trim() }))
    .filter((d) => d.value.length > 0);
}
