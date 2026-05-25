import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { LegalPage } from '@/components/nis/LegalPage';

export const metadata: Metadata = {
  title: 'Refund policy',
  description:
    'How refunds and cancellations work for NIS trackers, merch, and the PLOS subscription.',
};

export default function Page() {
  return (
    <NisShell pillar="legal">
      <LegalPage
        title="Refund policy."
        lastUpdated="2026-05-25"
        intro={
          <>
            We&rsquo;d rather refund a confused customer than keep an unhappy one.
            The rules below explain when a refund is automatic and when we
            need to look at the order before deciding.
          </>
        }
        sections={[
          {
            heading: 'Digital trackers',
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
                  case by case — if there&rsquo;s a clear product fault we&rsquo;ll still
                  refund.
                </p>
              </>
            ),
          },
          {
            heading: 'Merch (shop)',
            body: (
              <p>
                Print-on-demand items can be returned for refund or replacement
                if they&rsquo;re damaged, defective, or printed wrong. Mail us a
                photo within <strong>14 days</strong> of delivery and we&rsquo;ll
                arrange a replacement or refund. We don&rsquo;t accept returns of
                undamaged custom prints because we can&rsquo;t resell them.
              </p>
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
                Refunds go back to the original payment method via Razorpay.
                For UPI and net banking, expect 5–7 business days. For credit
                cards, expect 7–14 days depending on your bank.
              </p>
            ),
          },
          {
            heading: 'Failed payments',
            body: (
              <p>
                If Razorpay debits you but our system doesn&rsquo;t register the
                order within 24 hours, the payment is automatically reversed.
                If it isn&rsquo;t, write to us with the UPI reference / Razorpay
                payment ID and we&rsquo;ll chase it.
              </p>
            ),
          },
        ]}
      />
    </NisShell>
  );
}
