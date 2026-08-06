import { test } from 'node:test';
import assert from 'node:assert/strict';
import { madeToOrderSpec, missingRequired, buildDetailsSummary } from '../made-to-order-fields.ts';

test('each made-to-order SKU gets its own scoped fields (no general "what did you order")', () => {
  const single = madeToOrderSpec('wedding-video-invite');
  const box = madeToOrderSpec('wedding-box');
  assert.ok(single, 'single video has a spec');
  assert.ok(box, 'wedding box has a spec');

  // The ₹199 buyer must never be offered the ₹999 box — the old Google-Form leak.
  const allText = JSON.stringify([single, box]).toLowerCase();
  assert.ok(!allText.includes('what did you order'), 'no general order-type question');

  // Single video asks which ONE ceremony; the box does not.
  assert.ok(single!.fields.some((f) => f.name === 'ceremony' && f.kind === 'radio'));
  assert.ok(!box!.fields.some((f) => f.name === 'ceremony'));

  // The box asks for all four ceremonies' dates/venues; the single video does not.
  assert.ok(box!.fields.some((f) => f.name === 'haldiDate'));
  assert.ok(box!.fields.some((f) => f.name === 'saganVenue'));
  assert.ok(!single!.fields.some((f) => f.name === 'haldiDate'));
});

test('non-made-to-order SKUs have no personalisation spec', () => {
  assert.equal(madeToOrderSpec('budget-upi'), null);
  assert.equal(madeToOrderSpec('nonexistent'), null);
});

test('missingRequired flags empty required fields, ignores optional + whitespace-only', () => {
  const spec = madeToOrderSpec('wedding-video-invite')!;

  assert.deepEqual(
    new Set(missingRequired(spec, {})),
    new Set(['ceremony', 'coupleNames', 'date', 'venue']),
  );

  // whitespace does NOT satisfy a required field
  assert.deepEqual(
    missingRequired(spec, { ceremony: 'Haldi', coupleNames: 'Aanya & Rohan', date: '12 Dec 2026', venue: '   ' }),
    ['venue'],
  );

  // all required filled → none missing (optional 'note' left blank is fine)
  assert.deepEqual(
    missingRequired(spec, {
      ceremony: 'Haldi',
      coupleNames: 'Aanya & Rohan',
      date: '12 Dec 2026',
      venue: 'Rambagh Palace, Jaipur',
    }),
    [],
  );
});

test('buildDetailsSummary keeps only filled fields, in spec order, with labels', () => {
  const spec = madeToOrderSpec('wedding-video-invite')!;
  const summary = buildDetailsSummary(spec, {
    ceremony: 'Haldi',
    coupleNames: 'Aanya & Rohan',
    date: '12 Dec 2026',
    venue: 'Rambagh Palace',
    phone: '', // empty → dropped
    note: '  ', // whitespace → dropped
  });
  assert.deepEqual(summary, [
    { label: 'Which ceremony is this video for?', value: 'Haldi' },
    { label: "Bride's & groom's names", value: 'Aanya & Rohan' },
    { label: 'Ceremony date', value: '12 Dec 2026' },
    { label: 'Venue & city', value: 'Rambagh Palace' },
  ]);
});
