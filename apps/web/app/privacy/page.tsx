import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { LegalPage } from '@/components/nis/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'How NIS collects, uses, and protects personal information across the website, the PLOS app, and our trackers.',
};

export default function Page() {
  return (
    <NisShell pillar="legal">
      <LegalPage
        title="Privacy notice."
        lastUpdated="2026-05-25"
        intro={
          <>
            NIS is operated by a small team in Pune. We only collect what we need
            to deliver a download, run an app you signed up for, or follow up
            on a question you asked. We don&rsquo;t sell, rent, or trade your data.
          </>
        }
        sections={[
          {
            heading: 'What we collect',
            body: (
              <>
                <p>
                  <strong>You give us:</strong> your email and (for paid orders)
                  the billing information Razorpay needs. If you sign up for
                  PLOS, we also store the responsibilities, persons, and notes
                  you create inside the app.
                </p>
                <p>
                  <strong>We log automatically:</strong> request IP, user agent,
                  and timing — used for fraud protection and to keep the service
                  honest. We don&rsquo;t use this for advertising.
                </p>
              </>
            ),
          },
          {
            heading: 'How we use it',
            body: (
              <>
                <ul>
                  <li>Deliver downloads after purchase.</li>
                  <li>Send transactional email — receipts, password resets, important PLOS notices.</li>
                  <li>
                    Reply when you contact us. Marketing emails (if any) are
                    opt-in only and easy to leave.
                  </li>
                  <li>
                    Compute aggregate, identity-free numbers — e.g.{' '}
                    &ldquo;how many active users this week&rdquo; — to decide what to build.
                  </li>
                </ul>
              </>
            ),
          },
          {
            heading: 'Who we share with',
            body: (
              <>
                <ul>
                  <li>
                    <strong>Razorpay</strong> — payment processing. They see the
                    minimum needed to take payment. <a href="https://razorpay.com/privacy/" rel="noreferrer">Razorpay privacy</a>.
                  </li>
                  <li>
                    <strong>Resend</strong> — transactional email delivery.{' '}
                    <a href="https://resend.com/legal/privacy-policy" rel="noreferrer">Resend privacy</a>.
                  </li>
                  <li>
                    <strong>Supabase</strong> — managed Postgres for product and
                    PLOS data. Servers configured in <em>ap-south-1</em> (Mumbai).
                  </li>
                </ul>
                <p>
                  We do not share your data with advertising networks or data
                  brokers, and we do not allow third parties to set tracking
                  cookies through our site.
                </p>
              </>
            ),
          },
          {
            heading: 'Your rights',
            body: (
              <p>
                You can ask for a copy of your data, ask us to correct
                inaccuracies, or ask us to delete everything. Email{' '}
                <a href="mailto:hello@thenispace.com">hello@thenispace.com</a> with
                &ldquo;DPDP request&rdquo; in the subject line; we respond within 30 days
                per the Digital Personal Data Protection Act, 2023.
              </p>
            ),
          },
          {
            heading: 'Children',
            body: (
              <p>
                The PLOS app and the trackers are not designed for children under
                13. If you believe a child has signed up, write to us and we
                will remove the account.
              </p>
            ),
          },
          {
            heading: 'Changes',
            body: (
              <p>
                When this notice changes meaningfully, we&rsquo;ll email anyone with
                an account at least 14 days before the new version takes effect.
                Minor edits (typos, clarifications) ship immediately and get a
                new &ldquo;last updated&rdquo; date.
              </p>
            ),
          },
        ]}
      />
    </NisShell>
  );
}
