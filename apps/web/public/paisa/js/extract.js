// Reads a PDF in the browser with pdf.js and returns positioned text lines.
// Nothing leaves the device: the file bytes go to pdf.js's worker (same tab), never to a server.

export const PDFJS_VERSION = '6.5.438';
// The legacy build: the modern one calls very new JS (Uint8Array.toHex, Math.sumPrecise,
// Map.getOrInsertComputed) with no fallback, so it fails on iOS < 18.2 and older Android WebViews,
// including the Instagram in-app browser the DM link opens in.
// Served first-party from /paisa/vendor (copied from the npm package, sha384 checked), so a blocked
// or slow CDN can never break PDF reading, and the page talks to no other host.
const VENDOR = new URL(`../vendor/pdfjs-${PDFJS_VERSION}/`, import.meta.url).href;

let pdfjsPromise = null;
export function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import(`${VENDOR}pdf.min.mjs`).then((m) => {
      m.GlobalWorkerOptions.workerSrc = `${VENDOR}pdf.worker.min.mjs`;
      return m;
    }).catch((e) => { pdfjsPromise = null; throw e; });
  }
  return pdfjsPromise;
}

// One pdf.js worker for the whole visit: the worker script is fetched once, so a second statement still
// opens with no network (offline / flaky data), and nothing is fetched again per file.
let pdfWorker = null;
function sharedWorker(pdfjs) {
  if (!pdfWorker || pdfWorker.destroyed) pdfWorker = new pdfjs.PDFWorker({ verbosity: 0 });
  return pdfWorker;
}

export class StatementError extends Error {
  constructor(kind, message) { super(message || kind); this.kind = kind; }
}

/**
 * @param {Uint8Array} bytes
 * @param {{password?: string, onProgress?: (done:number,total:number)=>void}} opts
 * @returns {Promise<{pages: Array<{num:number, width:number, height:number, items: Array}>}>}
 */
// pdf.js 6 (legacy build too) calls Promise.withResolvers with no fallback: iOS Safari 17.4+ / Chrome 119+.
// On older phones (iPhone 8 / X stay on iOS 16) say so plainly, instead of a vague error. CSV needs none of this.
export const pdfSupported = () => typeof Promise.withResolvers === 'function';

export async function readPdf(bytes, { password, onProgress } = {}) {
  if (!pdfSupported()) throw new StatementError('old-browser');
  let pdfjs;
  try { pdfjs = await loadPdfjs(); } catch {
    throw new StatementError('offline', 'The PDF reader could not load. Check your connection and try again.');
  }
  const task = pdfjs.getDocument({
    worker: sharedWorker(pdfjs),
    data: bytes.slice(), // pdf.js takes ownership of the buffer it is given
    password: password || undefined,
    isEvalSupported: false,
    enableXfa: false,
    useSystemFonts: false,
    disableFontFace: true,
    stopAtErrors: false,
    verbosity: 0,
  });
  let doc;
  try {
    doc = await task.promise;
  } catch (e) {
    if (e && e.name === 'PasswordException') {
      throw new StatementError(e.code === 2 ? 'wrong-password' : 'need-password');
    }
    throw new StatementError('bad-pdf', 'This file could not be opened as a PDF.');
  }
  const pages = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const vp = page.getViewport({ scale: 1 });
      const tc = await page.getTextContent();
      const items = [];
      for (const it of tc.items) {
        if (typeof it.str !== 'string') continue;
        const str = it.str.replace(/\u0000/g, '');
        if (!str.trim()) continue;
        const [a, b, , d, x, y] = it.transform;
        const size = Math.hypot(b, d) || Math.abs(a) || 8;
        items.push({ str, x, y, w: it.width, h: size });
      }
      pages.push({ num: n, width: vp.width, height: vp.height, items });
      page.cleanup();
      onProgress && onProgress(n, doc.numPages);
    }
  } finally {
    try { await task.destroy(); } catch { /* already closed */ }
  }
  return { pages };
}

/**
 * Group text items into visual lines by their baseline (y), left to right.
 * Returns [{page, y, items:[{str,x,x2,h}], text}] top to bottom, page by page.
 */
export function toLines(pages) {
  const lines = [];
  for (const p of pages) {
    const items = p.items.slice().sort((a, b) => b.y - a.y || a.x - b.x);
    const pageLines = [];
    for (const it of items) {
      const tol = Math.max(1.5, it.h * 0.35);
      let line = pageLines.find((l) => Math.abs(l.y - it.y) <= tol);
      if (!line) { line = { page: p.num, y: it.y, items: [] }; pageLines.push(line); }
      line.items.push({ str: it.str, x: it.x, x2: it.x + it.w, h: it.h });
    }
    pageLines.sort((a, b) => b.y - a.y);
    for (const l of pageLines) {
      l.items.sort((a, b) => a.x - b.x);
      // merge items that touch (pdf.js may split one word into several runs)
      const merged = [];
      for (const it of l.items) {
        const prev = merged[merged.length - 1];
        const gap = prev ? it.x - prev.x2 : Infinity;
        if (prev && gap < it.h * 0.12) { prev.str += it.str; prev.x2 = Math.max(prev.x2, it.x2); }
        else if (prev && gap < it.h * 0.45 && !/\s$/.test(prev.str)) { prev.str += ' ' + it.str; prev.x2 = Math.max(prev.x2, it.x2); }
        else merged.push({ ...it });
      }
      l.items = merged;
      l.text = merged.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim();
      lines.push(l);
    }
  }
  return lines;
}
