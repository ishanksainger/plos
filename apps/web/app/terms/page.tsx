import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { LegalPage } from '@/components/nis/LegalPage';

export const metadata: Metadata = {
  title: 'Terms',
  description:
    'The terms of service for NIS — the marketing site, PLOS app, trackers, and shop.',
};

export default function Page() {
  return (
    <NisShell pillar="legal">
      <LegalPage
        title="Terms of service."
        lastUpdated="2026-05-25"
        intro={
          <>
            Using NIS — the website, the PLOS app, our trackers, or our shop —
            means you accept the terms on this page. If you disagree with any
            of them, please don&rsquo;t use the service.
          </>
        }
        sections={[
          {
            heading: 'Who we are',
            body: (
              <p>
                NIS Studio is operated by Ishank Sainger and Nikita (the
                &ldquo;Studio&rdquo;) from Pune, India. GSTIN
                <strong> 27AABCN1234F1Z5</strong>. Contact:{' '}
                <a href="mailto:hello@thenispace.com">hello@thenispace.com</a>.
              </p>
            ),
          },
          {
            heading: 'Accounts',
            body: (
              <ul>
                <li>You must be 13 or older to create a PLOS account.</li>
                <li>You&rsquo;re responsible for keeping your password safe.</li>
                <li>
                  You can delete your account from Settings → Plan at any time;
                  we delete the underlying data within 30 days.
                </li>
              </ul>
            ),
          },
          {
            heading: 'Purchases',
            body: (
              <>
                <p>
                  Tracker prices are shown in INR and are GST-inclusive. Once
                  you complete checkout via Razorpay, we email a download link
                  good for 7 days and 5 downloads. Trackers are licensed for
                  personal or single-business use — please don&rsquo;t redistribute
                  them.
                </p>
                <p>
                  Refunds are governed by our{' '}
                  <a href="/refund">refund policy</a>.
                </p>
              </>
            ),
          },
          {
            heading: 'What we promise',
            body: (
              <p>
                We try hard to keep PLOS available and to ship features that
                work. That said, software has bugs and outages happen. The
                service is provided &ldquo;as is&rdquo;. We won&rsquo;t be liable for indirect
                damages — like lost time or missed deadlines. Where local law
                requires a higher bar, that law wins.
              </p>
            ),
          },
          {
            heading: 'What we ask of you',
            body: (
              <ul>
                <li>Don&rsquo;t use the service to break Indian law.</li>
                <li>Don&rsquo;t scrape, reverse-engineer, or resell our APIs.</li>
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
            heading: 'Governing law',
            body: (
              <p>
                These terms are governed by Indian law. Disputes go before the
                courts in Pune, Maharashtra.
              </p>
            ),
          },
        ]}
      />
    </NisShell>
  );
}
