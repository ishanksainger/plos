'use client';

import { EbookCard } from '@/components/nis/EbookCard';
import { listEbooks } from '@/lib/ebook-catalog';

export function EbooksPage() {
  const ebooks = listEbooks();

  return (
    <section className="nis-section">
      <div className="nis-section-head">
        <div>
          <div className="nis-section-eyebrow">02 · E-books</div>
          <h1 className="nis-h2">Short books, worth the read.</h1>
        </div>
        <p className="nis-section-body">
          Practical guides we wished existed — written for Indian freelancers and
          dual-income households, not a global audience. Each one is something we
          actually do, written down so you can do it too. Delivered as a PDF to your
          inbox the moment you buy.
        </p>
      </div>

      {ebooks.length === 0 ? (
        <p className="nis-section-body" style={{ marginTop: 24 }}>
          The first e-book is being written. Check back soon.
        </p>
      ) : (
        <div className="nis-tracker-grid">
          {ebooks.map((e) => (
            <EbookCard key={e.slug} e={e} />
          ))}
        </div>
      )}
    </section>
  );
}
