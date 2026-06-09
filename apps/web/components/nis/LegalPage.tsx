'use client';

import type { ReactNode } from 'react';

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

export function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
  draft = false,
}: {
  title: string;
  /** ISO date string or human label, e.g. "2026-05-25". */
  lastUpdated: string;
  intro: ReactNode;
  sections: LegalSection[];
  /**
   * When true, render a prominent notice that the copy is an internal draft
   * pending professional legal review (i.e. not yet binding). Keep this on
   * until a lawyer has red-lined the page and the business contact details
   * (registered address, phone) are filled in.
   */
  draft?: boolean;
}) {
  return (
    <section className="nis-section nis-legal">
      {draft && (
        <div className="nis-legal-draft" role="note">
          <span className="nis-section-eyebrow">Draft · pending legal review</span>
          <span>
            This is a working draft prepared in-house and <strong>not yet
            reviewed by a lawyer</strong>. It is not the final, binding version.
            Treat the headline commitments (refund windows, timelines, contact)
            as our genuine intent, but the precise wording may change once it is
            professionally reviewed.
          </span>
        </div>
      )}

      <div className="nis-legal-banner">
        <span className="nis-section-eyebrow">Heads up</span>
        <span>
          This is our plain-English version, written by us and kept simple.
          For anything urgent, write to{' '}
          <a href="mailto:hello@thenispace.com">hello@thenispace.com</a>.
        </span>
      </div>

      <header className="nis-legal-head">
        <div className="nis-section-eyebrow">Legal</div>
        <h1 className="nis-h2" style={{ fontSize: 'clamp(40px, 6vw, 80px)', margin: '8px 0 18px' }}>
          {title}
        </h1>
        <p className="nis-legal-updated">
          Last updated · <strong>{lastUpdated}</strong>
        </p>
        <p className="nis-legal-intro">{intro}</p>
      </header>

      {sections.length > 1 && (
        <nav aria-label="Sections" className="nis-legal-toc">
          <ol>
            {sections.map((s, i) => (
              <li key={s.heading}>
                <a href={`#sec-${i + 1}`}>
                  <span className="nis-legal-toc-num">{String(i + 1).padStart(2, '0')}</span>
                  <span>{s.heading}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="nis-legal-body">
        {sections.map((s, i) => (
          <article key={s.heading} id={`sec-${i + 1}`} className="nis-legal-section">
            <h2 className="nis-h3">
              <span className="nis-legal-section-num">{String(i + 1).padStart(2, '0')}</span>
              {s.heading}
            </h2>
            <div className="nis-legal-prose">{s.body}</div>
          </article>
        ))}
      </div>

      <footer className="nis-legal-foot">
        Questions about this page? Email{' '}
        <a href="mailto:hello@thenispace.com">hello@thenispace.com</a> — we&rsquo;ll reply
        within two business days.
      </footer>
    </section>
  );
}
