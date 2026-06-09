import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { LegalPage } from '@/components/nis/LegalPage';

export const metadata: Metadata = {
  title: 'Terms',
  description:
    'The terms of service for NIS — the marketing site, the PLOS app, our trackers, e-books, and merch shop.',
};

export default function Page() {
  return (
    <NisShell pillar="legal">
      <LegalPage
        draft
        title="Terms of service."
        lastUpdated="2026-06-09"
        intro={
          <>
            Using NIS — the website, the PLOS app, our trackers, e-books, or our
            merch shop — means you accept the terms on this page. If you disagree
            with any of them, please don&rsquo;t use the service.
          </>
        }
        sections={[
          {
            heading: 'Who we are',
            body: (
              <p>
                NIS (&ldquo;Nest of Innovative Space&rdquo;) is operated by{' '}
                <strong>Ishank Sainger</strong> as a sole proprietor based in
                Pune, Maharashtra, India. Contact:{' '}
                <a href="mailto:hello@thenispace.com">hello@thenispace.com</a>.
                References to &ldquo;we&rdquo;, &ldquo;us&rdquo;, and
                &ldquo;NIS&rdquo; mean this proprietorship.
              </p>
            ),
          },
          {
            heading: 'Accounts',
            body: (
              <ul>
                <li>You must be 18 or older to create a PLOS account.</li>
                <li>You&rsquo;re responsible for keeping your password safe.</li>
                <li>The information you give us must be accurate and current.</li>
                <li>
                  You can delete your account from Settings → Plan at any time;
                  we delete the underlying data within 30 days.
                </li>
              </ul>
            ),
          },
          {
            heading: 'What you can buy',
            body: (
              <ul>
                <li>
                  <strong>Digital trackers &amp; e-books</strong> — delivered as
                  a download link after payment.
                </li>
                <li>
                  <strong>Merch</strong> — print-on-demand physical goods,
                  produced and shipped through our partner Qikink.
                </li>
                <li>
                  <strong>PLOS</strong> — a subscription app (free tier today;
                  paid tiers when launched).
                </li>
              </ul>
            ),
          },
          {
            heading: 'Pricing, taxes & payment',
            body: (
              <>
                <p>
                  All prices are shown in Indian Rupees (INR) and are payable
                  through Razorpay. The price displayed at checkout is the price
                  you pay.
                </p>
                <p>
                  We are a small sole proprietorship operating below the GST
                  registration threshold, so we do <strong>not</strong> currently
                  charge GST and do not issue a GST tax invoice. If that changes,
                  prices and invoices will be updated to reflect the applicable
                  tax. You are responsible for any duties or charges your own
                  jurisdiction may impose.
                </p>
              </>
            ),
          },
          {
            heading: 'Digital goods & licence',
            body: (
              <p>
                After you complete checkout, we email a download link valid for
                7 days and 5 downloads. Trackers and e-books are{' '}
                <strong>licensed</strong> to you for personal or single-business
                use — not sold outright. You may not redistribute, resell,
                sublicense, or publicly share the files. All intellectual
                property in our content, software, branding, and designs remains
                ours (or our licensors&rsquo;).
              </p>
            ),
          },
          {
            heading: 'Merch orders',
            body: (
              <>
                <p>
                  Merch is made to order by our print partner after payment is
                  confirmed. Production and delivery timelines, and how returns
                  work for physical goods, are set out in our{' '}
                  <a href="/refund">refund &amp; cancellation policy</a>.
                </p>
                <p>
                  Because each item is custom-printed, an order generally
                  can&rsquo;t be changed or cancelled once it has gone into
                  production — write to us quickly if you spot a mistake.
                </p>
              </>
            ),
          },
          {
            heading: 'Refunds & cancellations',
            body: (
              <p>
                Refunds and cancellations for trackers, merch, and the PLOS
                subscription are governed by our{' '}
                <a href="/refund">refund &amp; cancellation policy</a>, which
                forms part of these terms.
              </p>
            ),
          },
          {
            heading: 'What we promise',
            body: (
              <p>
                We try hard to keep PLOS available and to ship features that
                work. That said, software has bugs and outages happen. The
                service is provided &ldquo;as is&rdquo;. To the extent permitted
                by law, we won&rsquo;t be liable for indirect damages — like lost
                time or missed deadlines — and our total liability for any claim
                is limited to the amount you paid us for the item in question.
                Nothing here limits any right you have under the Consumer
                Protection Act, 2019; where local law requires a higher bar, that
                law wins.
              </p>
            ),
          },
          {
            heading: 'What we ask of you',
            body: (
              <ul>
                <li>Don&rsquo;t use the service to break Indian law.</li>
                <li>Don&rsquo;t scrape, reverse-engineer, or resell our APIs.</li>
                <li>Don&rsquo;t resell or redistribute our digital files.</li>
                <li>Don&rsquo;t share another person&rsquo;s data without their consent.</li>
              </ul>
            ),
          },
          {
            heading: 'Termination',
            body: (
              <p>
                If you breach these terms we may suspend or terminate your
                account. We&rsquo;ll write to you first wherever possible. You can
                stop using the service at any time — no notice required.
              </p>
            ),
          },
          {
            heading: 'Grievances & disputes',
            body: (
              <>
                <p>
                  For any complaint, reach our Grievance Officer,{' '}
                  <strong>Ishank Sainger</strong>, at{' '}
                  <a href="mailto:hello@thenispace.com">hello@thenispace.com</a>.
                  We acknowledge within 48 hours and aim to resolve within 30
                  days, as required by the Consumer Protection (E-Commerce)
                  Rules, 2020.
                </p>
                <p>
                  These terms are governed by the laws of India, and the courts
                  in Pune, Maharashtra have exclusive jurisdiction over any
                  dispute.
                </p>
              </>
            ),
          },
        ]}
      />
    </NisShell>
  );
}
