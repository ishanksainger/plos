import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { LegalPage } from '@/components/nis/LegalPage';

export const metadata: Metadata = {
  title: 'Refund & cancellation policy',
  description:
    'How refunds and cancellations work for NIS trackers, e-books, merch, and the PLOS subscription.',
};

export default function Page() {
  return (
    <NisShell pillar="legal">
      <LegalPage
        title="Refund & cancellation policy."
        lastUpdated="2026-06-09"
        intro={
          <>
            We&rsquo;d rather refund a confused customer than keep an unhappy one.
            The rules below explain when a refund is automatic and when we need
            to look at the order before deciding.
          </>
        }
        sections={[
          {
            heading: 'Digital trackers & e-books',
            body: (
              <>
                <p>
                  Email <a href="mailto:hello@thenispace.com">hello@thenispace.com</a>{' '}
                  within <strong>7 days</strong> of purchase with your order ID
                  and we&rsquo;ll refund in full, no questions asked, as long as
                  you&rsquo;ve used the download link fewer than 3 times.
                </p>
                <p>
                  After 7 days or after the 3rd download we look at the order
                  case by case — if there&rsquo;s a clear product fault we&rsquo;ll
                  still refund. Because these are instantly-delivered digital
                  goods, we can&rsquo;t accept a refund simply because the file
                  has been fully downloaded and used.
                </p>
              </>
            ),
          },
          {
            heading: 'Merch (shop)',
            body: (
              <>
                <p>
                  Merch is <strong>made to order</strong> by our print partner.
                  Once an item has gone into production it generally can&rsquo;t
                  be cancelled or changed — so if you spot a mistake in your
                  order, write to us immediately and we&rsquo;ll try to catch it
                  before printing.
                </p>
                <p>
                  Print-on-demand items can be returned for refund or replacement
                  if they arrive <strong>damaged, defective, or printed wrong</strong>.
                  Mail us a photo within <strong>14 days</strong> of delivery and
                  we&rsquo;ll arrange a replacement or refund. We can&rsquo;t
                  accept returns of correctly-made custom prints, because they
                  can&rsquo;t be resold.
                </p>
              </>
            ),
          },
          {
            heading: 'PLOS subscription',
            body: (
              <>
                <p>
                  PLOS bills monthly or yearly. You can cancel any time from
                  Settings → Plan; the cancellation takes effect at the end of
                  the current billing cycle, and we don&rsquo;t pro-rate.
                </p>
                <p>
                  If you cancel within <strong>14 days</strong> of your first
                  subscription start and you&rsquo;ve barely used the app, write to
                  us — we&rsquo;ll refund the period in full.
                </p>
              </>
            ),
          },
          {
            heading: 'How refunds are paid',
            body: (
              <p>
                Approved refunds go back to the original payment method via
                Razorpay. For UPI and net banking, expect 5–7 business days. For
                credit cards, expect 7–14 days depending on your bank.
              </p>
            ),
          },
          {
            heading: 'Failed payments',
            body: (
              <p>
                If Razorpay debits you but our system doesn&rsquo;t register the
                order within 24 hours, the payment is automatically reversed. If
                it isn&rsquo;t, write to us with the UPI reference / Razorpay
                payment ID and we&rsquo;ll chase it.
              </p>
            ),
          },
          {
            heading: 'Still not sorted?',
            body: (
              <p>
                If a refund or cancellation isn&rsquo;t resolved to your
                satisfaction, escalate to our Grievance Officer,{' '}
                <strong>Ishank Sainger</strong>, at{' '}
                <a href="mailto:hello@thenispace.com">hello@thenispace.com</a>. We
                acknowledge within 48 hours and aim to resolve within 30 days, in
                line with the Consumer Protection (E-Commerce) Rules, 2020.
              </p>
            ),
          },
        ]}
      />
    </NisShell>
  );
}
