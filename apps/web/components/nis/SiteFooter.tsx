'use client';

import Link from 'next/link';

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
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            Nest of Innovative Space. A small studio in Pune building tools, trackers, and one life-OS for India.
          </p>
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
            <li><a>Journal</a></li>
            <li><a>Press kit</a></li>
            <li><Link href="/refund">Refund policy</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </div>
        <div>
          <h4>Find us</h4>
          <ul>
            <li><a href="mailto:hello@thenispace.com">hello@thenispace.com</a></li>
            <li><a>Etsy shop</a></li>
            <li><a>Instagram</a></li>
            <li><a>Pune · Mumbai</a></li>
          </ul>
        </div>
      </div>
      <div className="nis-footer-legal">
        <span>© 2026 NIS Studio · made in India</span>
        <span>GSTIN · 27AABCN1234F1Z5</span>
      </div>
    </footer>
  );
}
