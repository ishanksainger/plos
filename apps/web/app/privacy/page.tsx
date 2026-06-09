import type { Metadata } from 'next';
import { NisShell } from '@/components/nis/Shell';
import { LegalPage } from '@/components/nis/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'How NIS collects, uses, shares, retains, and protects personal data across the website, the PLOS app, our trackers, and merch — written to the Digital Personal Data Protection Act, 2023.',
};

export default function Page() {
  return (
    <NisShell pillar="legal">
      <LegalPage
        draft
        title="Privacy notice."
        lastUpdated="2026-06-09"
        intro={
          <>
            NIS (&ldquo;Nest of Innovative Space&rdquo;) is operated by Ishank
            Sainger, a sole proprietor based in Pune, India — the{' '}
            <strong>data fiduciary</strong> for the personal data described here.
            We only collect what we need to deliver a download, fulfil an order,
            run an app you signed up for, or answer a question you asked. We
            don&rsquo;t sell, rent, or trade your data, and we process it under
            the Digital Personal Data Protection Act, 2023 (&ldquo;DPDP Act&rdquo;).
          </>
        }
        sections={[
          {
            heading: 'What we collect',
            body: (
              <>
                <p>
                  <strong>You give us:</strong> your email, and — for paid
                  orders — the billing details Razorpay needs to take payment.
                  For <strong>merch (physical) orders</strong> we also collect
                  your name, shipping address, and phone number so the item can
                  be printed and delivered. If you sign up for PLOS, we store
                  the responsibilities, persons, and notes you create inside the
                  app.
                </p>
                <p>
                  <strong>We log automatically:</strong> request IP, user agent,
                  and timing — used for security, fraud prevention, and to keep
                  the service honest. We don&rsquo;t use this for advertising.
                </p>
                <p>
                  We do <strong>not</strong> knowingly collect sensitive
                  categories such as government IDs, financial-account numbers,
                  health, or biometric data. Card details are entered on
                  Razorpay&rsquo;s PCI-DSS-compliant checkout and never touch our
                  servers.
                </p>
              </>
            ),
          },
          {
            heading: 'Why we process it (your consent)',
            body: (
              <>
                <p>
                  Under the DPDP Act we process your personal data on the basis
                  of the <strong>consent</strong> you give when you submit a form,
                  place an order, or create an account — and for the specific,
                  lawful purposes below:
                </p>
                <ul>
                  <li>Deliver digital downloads after purchase.</li>
                  <li>Fulfil and ship merch orders through our print partner.</li>
                  <li>
                    Send transactional email — receipts, download links, password
                    resets, order/shipping updates, and important PLOS notices.
                  </li>
                  <li>Run the PLOS app and the account you signed up for.</li>
                  <li>
                    Reply when you contact us. Marketing email (if any) is
                    strictly opt-in and easy to leave.
                  </li>
                  <li>
                    Compute aggregate, identity-free numbers — e.g.{' '}
                    &ldquo;how many active users this week&rdquo; — to decide what
                    to build.
                  </li>
                </ul>
                <p>
                  You can <strong>withdraw consent</strong> at any time (see
                  &ldquo;Your rights&rdquo;). Withdrawal doesn&rsquo;t affect
                  processing already done, and we may still keep the minimum data
                  the law requires us to retain.
                </p>
              </>
            ),
          },
          {
            heading: 'Who we share with',
            body: (
              <>
                <p>
                  We share data only with the processors that run the service,
                  and only the minimum each one needs:
                </p>
                <ul>
                  <li>
                    <strong>Razorpay</strong> — payment processing for all paid
                    orders.{' '}
                    <a href="https://razorpay.com/privacy/" rel="noreferrer">Razorpay privacy</a>.
                  </li>
                  <li>
                    <strong>Qikink</strong> — our print-on-demand partner. For
                    merch orders we pass your name, shipping address, and phone
                    so the item can be printed and couriered to you. Used only
                    for fulfilment.
                  </li>
                  <li>
                    <strong>Resend</strong> — transactional email delivery.{' '}
                    <a href="https://resend.com/legal/privacy-policy" rel="noreferrer">Resend privacy</a>.
                  </li>
                  <li>
                    <strong>Supabase</strong> — managed Postgres and file storage
                    for product and PLOS data. Configured in the{' '}
                    <em>ap-south-1</em> (Mumbai) region.
                  </li>
                </ul>
                <p>
                  We do not share your data with advertising networks or data
                  brokers, and we do not allow third parties to set tracking
                  cookies through our site. We may disclose data if compelled by
                  a valid Indian legal order.
                </p>
              </>
            ),
          },
          {
            heading: 'International transfers',
            body: (
              <p>
                Some of our processors (e.g. Razorpay, Resend, Qikink) may
                process or store data on servers outside India. Where that
                happens we rely on the processor&rsquo;s own safeguards and only
                use providers that are not in any country restricted for transfer
                under the DPDP Act. Our primary database is hosted in Mumbai
                (ap-south-1).
              </p>
            ),
          },
          {
            heading: 'Cookies',
            body: (
              <p>
                We use only the cookies needed to keep you logged in and to keep
                the site secure. We don&rsquo;t run third-party advertising or
                cross-site tracking cookies. Any product analytics we use are
                aggregate and privacy-respecting (no selling of personal data).
              </p>
            ),
          },
          {
            heading: 'How long we keep it',
            body: (
              <ul>
                <li>
                  <strong>Order &amp; payment records</strong> — kept as long as
                  needed to honour refunds, support, and any tax/accounting
                  obligation, then deleted or anonymised.
                </li>
                <li>
                  <strong>PLOS account data</strong> — kept while your account is
                  active; deleted within 30 days of you closing the account.
                </li>
                <li>
                  <strong>Download links / tokens</strong> — expire automatically
                  (7 days / 5 uses).
                </li>
                <li>
                  <strong>Server logs</strong> — rotated and retained only for a
                  short window for security.
                </li>
              </ul>
            ),
          },
          {
            heading: 'How we protect it',
            body: (
              <p>
                Data is encrypted in transit (HTTPS) and held by reputable
                managed providers. Access is limited to what&rsquo;s needed to run
                the service, and payment card data never reaches our servers. No
                system is perfectly secure, but if a breach ever affects your
                data we&rsquo;ll act on it and notify you and the Data Protection
                Board as the DPDP Act requires.
              </p>
            ),
          },
          {
            heading: 'Your rights',
            body: (
              <>
                <p>Under the DPDP Act you can:</p>
                <ul>
                  <li>ask for a copy of the personal data we hold about you;</li>
                  <li>ask us to correct or complete inaccurate data;</li>
                  <li>ask us to erase data we no longer need;</li>
                  <li>withdraw consent for any processing; and</li>
                  <li>
                    nominate someone to exercise these rights on your behalf if
                    you are unable to.
                  </li>
                </ul>
                <p>
                  To exercise any of these, email{' '}
                  <a href="mailto:hello@thenispace.com">hello@thenispace.com</a>{' '}
                  with &ldquo;DPDP request&rdquo; in the subject line, or write to
                  our Grievance Officer below. We respond within 30 days.
                </p>
              </>
            ),
          },
          {
            heading: 'Grievance Officer',
            body: (
              <>
                <p>
                  In line with the DPDP Act and the Consumer Protection
                  (E-Commerce) Rules, 2020, you can raise any privacy concern or
                  complaint with our Grievance Officer:
                </p>
                <ul>
                  <li><strong>Name:</strong> Ishank Sainger</li>
                  <li>
                    <strong>Email:</strong>{' '}
                    <a href="mailto:hello@thenispace.com">hello@thenispace.com</a>
                  </li>
                  <li><strong>Based in:</strong> Pune, Maharashtra, India</li>
                </ul>
                <p>
                  We acknowledge complaints within <strong>48 hours</strong> and
                  aim to resolve them within <strong>30 days</strong>.
                </p>
              </>
            ),
          },
          {
            heading: 'Children',
            body: (
              <p>
                The PLOS app and the trackers are not designed for children under
                18, and we do not knowingly process a child&rsquo;s data without
                verifiable parental consent. If you believe a child has signed
                up, write to us and we&rsquo;ll remove the account.
              </p>
            ),
          },
          {
            heading: 'Changes',
            body: (
              <p>
                When this notice changes meaningfully, we&rsquo;ll email anyone
                with an account at least 14 days before the new version takes
                effect. Minor edits (typos, clarifications) ship immediately and
                get a new &ldquo;last updated&rdquo; date.
              </p>
            ),
          },
        ]}
      />
    </NisShell>
  );
}
