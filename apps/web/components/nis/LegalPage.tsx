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
}: {
  title: string;
  /** ISO date string or human label, e.g. "2026-05-25". */
  lastUpdated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <section className="nis-section nis-legal">
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
