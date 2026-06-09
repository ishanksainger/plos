'use client';

import Link from 'next/link';
import { NewsletterRow } from './NewsletterRow';

export function SiteFooter() {
  return (
    <footer className="nis-footer">
      <div className="nis-footer-inner">
        <div>
          <Link href="/" className="nis-logo" style={{ marginBottom: 16 }}>
            <span className="nis-mark" />
            <span>NIS</span>
          </Link>
          <p
            style={{
              color: 'var(--ink-3)',
              fontSize: 13,
              maxWidth: '28ch',
              margin: '0 0 20px',
              lineHeight: 1.55,
            }}
          >
            Nest of Innovative Space. A small studio in India building tools, trackers, and one life-OS for India.
          </p>
          <NewsletterRow />
        </div>
        <div>
          <h4>Products</h4>
          <ul>
            <li><Link href="/trackers">Trackers</Link></li>
            <li><Link href="/canvas">Canvas</Link></li>
            <li><Link href="/shop">Shop</Link></li>
            <li><Link href="/plos">PLOS</Link></li>
          </ul>
        </div>
        <div>
          <h4>Studio</h4>
          <ul>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/refund">Refund policy</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </div>
        <div>
          <h4>Find us</h4>
          <ul>
            <li><a href="mailto:hello@thenispace.com">hello@thenispace.com</a></li>
            <li><span>New Delhi · India</span></li>
          </ul>
        </div>
      </div>
      <div className="nis-footer-legal">
        <span>© 2026 NIS · made in India</span>
        <span>operated by Ishank Sainger · New Delhi</span>
      </div>
    </footer>
  );
}
