// Statement parsers: PhonePe PDF, HDFC-style bank PDF, a careful generic bank PDF fallback, and CSV.
// Every parser returns { format, label, confidence, txns, skipped, reconcile?, holder? }.
// txn = { date:'YYYY-MM-DD', time?, desc, amount (>0), dir:'in'|'out', balance?, ref?, status? }

import { toLines, StatementError } from './extract.js';

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n) => String(n).padStart(2, '0');
const year4 = (y) => { y = Number(y); return y < 100 ? 2000 + y : y; };
const valid = (y, m, d) => m >= 1 && m <= 12 && d >= 1 && y >= 2000 && y <= 2100 && d <= new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Parse many Indian statement date styles. Day comes before month for numeric dates. */
export function parseDate(s) {
  if (!s) return null;
  s = String(s).trim();
  let m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})\b/.exec(s);
  if (m) { const y = year4(m[3]), mo = +m[2], d = +m[1]; return valid(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null; }
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})\b/.exec(s);
  if (m) return valid(+m[1], +m[2], +m[3]) ? `${m[1]}-${pad(m[2])}-${pad(m[3])}` : null;
  m = /^(\d{1,2})[\s\-\/]([A-Za-z]{3,9})\.?,?[\s\-\/](\d{2}|\d{4})\b/.exec(s);
  if (m) { const mo = MONTHS[m[2].toLowerCase().slice(0, m[2].toLowerCase().startsWith('sept') ? 4 : 3)]; const y = year4(m[3]); return mo && valid(y, mo, +m[1]) ? `${y}-${pad(mo)}-${pad(m[1])}` : null; }
  m = /^([A-Za-z]{3,9})\.?\s(\d{1,2}),?\s(\d{4})\b/.exec(s);
  if (m) { const k = m[1].toLowerCase(); const mo = MONTHS[k.startsWith('sept') ? 'sept' : k.slice(0, 3)]; return mo && valid(+m[3], mo, +m[2]) ? `${m[3]}-${pad(mo)}-${pad(m[2])}` : null; }
  return null;
}
const DATE_START = /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\s\-][A-Za-z]{3,9}[\s\-,]+\d{2,4}|[A-Za-z]{3,9}\s\d{1,2},\s\d{4})/;

/** "₹1,07,355.55", "1,250.00 Dr", "(500)", "-250", "INR 500" -> number (sign kept for "-"/"()"). */
export function parseAmount(s) {
  if (s == null) return null;
  let t = String(s).replace(/ /g, ' ').trim();
  if (!t) return null;
  let neg = false;
  if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1); }
  t = t.replace(/^(₹|rs\.?|inr)\s*/i, '').replace(/\s*(₹|rs\.?|inr)$/i, '');
  const dc = /\s*\(?(dr|cr)\.?\)?$/i.exec(t);
  if (dc) t = t.slice(0, dc.index);
  t = t.replace(/^(₹|rs\.?|inr)\s*/i, '');
  if (/^[+-]/.test(t)) { neg = t[0] === '-'; t = t.slice(1).trim(); t = t.replace(/^(₹|rs\.?|inr)\s*/i, ''); }
  if (!/^\d[\d,]*(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t.replace(/,/g, ''));
  return Number.isFinite(n) ? (neg ? -n : n) : null;
}
const amountSide = (s) => { const m = /(dr|cr)\.?\)?\s*$/i.exec(String(s || '').trim()); return m ? (m[1].toLowerCase() === 'dr' ? 'out' : 'in') : null; };
const r2 = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------- PhonePe
const PP_DATE = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)[a-z]*\.?\s(\d{1,2}),\s(20\d{2})\b/g;

export function looksLikePhonePe(text) {
  return /Transaction ID/i.test(text) && /UTR\s*No/i.test(text) && /\b(DEBIT|CREDIT)\b/i.test(text) && new RegExp(PP_DATE.source).test(text);
}

export function parsePhonePeText(text) {
  const clean = text.replace(/\u0000/g, '')
    .split('\n')
    .filter((l) => !/^\s*Page \d+ of \d+/i.test(l) && !/system generated statement/i.test(l) && !/^\s*Date\s+Transaction Details/i.test(l))
    .join('\n');
  const marks = [...clean.matchAll(PP_DATE)];
  const txns = [];
  let skipped = 0;
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index, end = i + 1 < marks.length ? marks[i + 1].index : clean.length;
    let chunk = clean.slice(start, end);
    const date = parseDate(marks[i][0]);
    const type = /\b(DEBIT|CREDIT)\b/i.exec(chunk);
    // the ₹ glyph sometimes comes out of a PDF font as another character, so also take the number
    // right after DEBIT/CREDIT
    const amt = /(?:₹|INR|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i.exec(chunk) || /\b(?:DEBIT|CREDIT)\b\s*[^\d\s]{0,3}\s*(\d[\d,]*(?:\.\d{1,2})?)\b/.exec(chunk);
    const hasId = /Transaction ID|UTR\s*No/i.test(chunk);
    if (!type || !amt || !hasId) {
      if (hasId || type) skipped++; // looked like a record but could not be read
      continue;
    }
    const time = /\b(\d{1,2}):(\d{2})\s*([AP]M)\b/i.exec(chunk);
    let hh = null;
    if (time) { hh = (+time[1] % 12) + (/pm/i.test(time[3]) ? 12 : 0); }
    const id = /Transaction ID\s*:?\s*(\S+)/i.exec(chunk)?.[1];
    const utr = /UTR\s*No\.?\s*:?\s*(\S+)/i.exec(chunk)?.[1];
    let desc = chunk
      .replace(amt[0], ' ')
      .replace(marks[i][0], ' ')
      .replace(/\b\d{1,2}:\d{2}\s*[AP]M\b/i, ' ')
      .replace(/Transaction ID\s*:?\s*\S+/i, ' ')
      .replace(/UTR\s*No\.?\s*:?\s*\S+/i, ' ')
      .replace(/\b(Paid by|Debited from|Credited to)\s+(UPI Lite|[Xx*\d]+)/gi, ' ')
      .replace(/\b(DEBIT|CREDIT)\b/i, ' ')
      .replace(amt[0], ' ')
      .replace(/\s+/g, ' ').trim();
    const failed = /\b(failed|declined)\b/i.test(desc) || /\bstatus\s*:?\s*failed\b/i.test(chunk);
    desc = desc.replace(/\b(status\s*:?\s*)?(failed|success(ful)?|pending)\b/gi, '').trim();
    txns.push({
      date, time: hh != null ? `${pad(hh)}:${time[2]}` : undefined,
      desc, amount: parseAmount(amt[1]), dir: /debit/i.test(type[1]) ? 'out' : 'in',
      ref: utr || id, status: failed ? 'failed' : 'ok',
    });
  }
  return { txns, skipped };
}

// ---------------------------------------------------------------- column engine for bank PDFs
const HEAD = [
  ['valueDate', /^value\s*(dt|date)\.?$/i],
  ['date', /^(txn\.?\s*|tran\.?\s*|transaction\s*|post(ing)?\s*)?date$|^date$/i],
  ['desc', /narration|description|particulars|details|remarks/i],
  ['ref', /ref|chq|cheque/i],
  ['debit', /withdrawal|debit|^dr\.?$|paid\s*out/i],
  ['credit', /deposit|credit|^cr\.?$|paid\s*in/i],
  ['balance', /balance/i],
  ['amount', /^(txn\s*)?amount(\s*\(?(inr|rs\.?|₹)\)?)?$/i],
  ['type', /^(type|dr\s*\/\s*cr|cr\s*\/\s*dr)$/i],
];
function classifyHeader(line) {
  const cols = {};
  for (const it of line.items) {
    const s = it.str.trim();
    for (const [k, re] of HEAD) {
      if (re.test(s) && !cols[k]) { cols[k] = { x: it.x, x2: it.x2, label: s }; break; }
    }
  }
  const hasDate = !!cols.date;
  const hasMoney = (cols.debit && cols.credit) || cols.amount;
  return hasDate && hasMoney && (cols.balance || cols.desc) ? cols : null;
}
const isHdfcHeader = (line) => /narration/i.test(line.text) && /chq\.?\s*\/?\s*ref/i.test(line.text) && /withdrawal amt/i.test(line.text) && /deposit amt/i.test(line.text) && /closing balance/i.test(line.text);

// Column headers often wrap onto 2-3 lines ("Withdrawal" over "Amt."). Stack such lines into one
// header line by joining the words that sit in the same column.
const HAS_DATA = /\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d[\d,]*\.\d{2}\b/;
function stackLines(group) {
  const items = [];
  group.forEach((l, li) => l.items.forEach((it) => items.push({ ...it, li })));
  items.sort((a, b) => a.x - b.x);
  const cols = [];
  for (const it of items) {
    const c = cols.find((k) => it.x <= k.x2 + 2 && it.x2 >= k.x - 2);
    if (c) { c.parts.push(it); c.x = Math.min(c.x, it.x); c.x2 = Math.max(c.x2, it.x2); }
    else cols.push({ x: it.x, x2: it.x2, h: it.h, parts: [it] });
  }
  const merged = cols.sort((a, b) => a.x - b.x).map((c) => ({
    str: c.parts.sort((a, b) => a.li - b.li || a.x - b.x).map((p) => p.str).join(' '), x: c.x, x2: c.x2, h: c.h,
  }));
  return { page: group[0].page, y: group[0].y, items: merged, text: merged.map((i) => i.str).join(' ') };
}
/** Map of line index -> { line (possibly stacked), span } for every header line found. */
export function findHeaders(lines) {
  const found = new Map();
  for (let i = 0; i < lines.length; i++) {
    if (classifyHeader(lines[i])) { found.set(i, { line: lines[i], span: 1 }); continue; }
    if (HAS_DATA.test(lines[i].text)) continue;
    let best = null;
    for (let k = 2; k <= 3 && i + k <= lines.length; k++) {
      const g = lines.slice(i, i + k);
      const ok = g.every((l, j) => l.page === g[0].page && !HAS_DATA.test(l.text)
        && (j === 0 || Math.abs(g[j - 1].y - l.y) <= 1.6 * Math.max(...l.items.map((t) => t.h))));
      if (!ok) break;
      const st = stackLines(g);
      const c = classifyHeader(st);
      // keep the stack that names the most columns ("Closing" + "Balance" may sit on the 3rd line)
      if (c && (!best || Object.keys(c).length > best.n)) best = { line: st, span: k, n: Object.keys(c).length };
    }
    if (best) { found.set(i, { line: best.line, span: best.span }); i += best.span - 1; }
  }
  return found;
}

function parseBankLines(lines, { hdfc, headers = findHeaders(lines) }) {
  let cols = null;
  const rows = [];
  let cur = null, done = false, skipped = 0;
  let holder = null, opening = null;
  const all = lines.map((l) => l.text).join('\n');
  const hm = /\b(?:Account holder|Customer Name|Name)\s*:?\s*(?:MR\.?|MRS\.?|MS\.?)?\s*([A-Z][A-Z .]{2,40}?)(?:\s*\(|\s{2,}|\n|$)/.exec(all);
  if (hm) holder = hm[1].trim();
  const om = /Opening Balance[^\n]*\n\s*([\d,]+\.\d{2})/i.exec(all) || /Opening Balance\s*:?\s*(?:₹|INR|Rs\.?)?\s*([\d,]+\.\d{2})/i.exec(all);
  if (om) opening = parseAmount(om[1]);

  const numericCols = () => ['debit', 'credit', 'balance', 'amount'].filter((k) => cols[k]);
  const textColFor = (x) => {
    let best = null;
    for (const k of ['date', 'desc', 'ref', 'valueDate', 'type']) {
      const c = cols[k];
      if (!c) continue;
      if (c.x <= x + 4 && (!best || c.x > cols[best].x)) best = k;
    }
    return best;
  };
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    if (done) break;
    const t = line.text;
    const hd = headers.get(li);
    if (hd) { cols = classifyHeader(hd.line); li += hd.span - 1; continue; }
    if (!cols) continue;
    if (/^page \d+ of \d+/i.test(t) || /(system|computer) generated/i.test(t) || /^page\s*\d+$/i.test(t)) continue;
    if (/statement summary|^\*+\s*end of statement/i.test(t)) { done = true; break; }
    const cell = { date: '', desc: [], ref: '', valueDate: '', type: '', debit: null, credit: null, balance: null, amount: null, amountRaw: '' };
    for (const it of line.items) {
      const s = it.str.trim();
      const num = parseAmount(s);
      const isNumCell = num != null && /[.,]\d{2}(\s*\(?(cr|dr)\.?\)?)?$|^\d{1,3}(,\d{2,3})+$/i.test(s);
      if (isNumCell && it.x > (cols.desc ? cols.desc.x + 20 : 0)) {
        let best = null, bestD = Infinity;
        for (const k of numericCols()) {
          const d = Math.min(Math.abs(cols[k].x2 - it.x2), Math.abs(cols[k].x - it.x) + 6);
          if (d < bestD) { bestD = d; best = k; }
        }
        if (best && bestD < 60) {
          cell[best] = Math.abs(num);
          if (best === 'amount') cell.amountRaw = s;
          if (best === 'balance' && /dr\.?\)?$/i.test(s)) cell.balance = -Math.abs(num);
          continue;
        }
      }
      const k = textColFor(it.x);
      if (k === 'desc') { if (cell.descX == null) { cell.descX = it.x; cell.descW = (it.x2 - it.x) / Math.max(1, it.str.length); } cell.desc.push(it.str); }
      else if (k === 'date' && !cell.date) cell.date = s;
      else if (k === 'ref') cell.ref += s;
      else if (k === 'valueDate') cell.valueDate = s;
      else if (k === 'type') cell.type = s;
      else if (k) cell.desc.push(it.str);
    }
    const date = DATE_START.test(cell.date) ? parseDate(cell.date) : null;
    const hasMoney = cell.debit != null || cell.credit != null || cell.amount != null;
    if (date && (hasMoney || cell.balance != null)) {
      cur = { date, parts: [cell.desc.join(' ')], px: [cell.descX], cw: cell.descW, ref: cell.ref, balance: cell.balance, debit: cell.debit, credit: cell.credit, amount: cell.amount, amountRaw: cell.amountRaw, type: cell.type };
      rows.push(cur);
    } else if (cur && cell.desc.length && !date) {
      cur.parts.push(cell.desc.join(' ')); cur.px.push(cell.descX);
      if (cell.ref) cur.ref += cell.ref;
    } else if (date) {
      skipped++;
    }
  }
  if (!rows.length) return null;

  // Fixed-width wrapping (HDFC chunks narrations mid-word): join without spaces.
  const multi = rows.filter((r) => r.parts.length > 1);
  const firstLens = multi.map((r) => r.parts[0].length);
  const maxLen = Math.max(0, ...firstLens);
  const fixedWrap = multi.length >= 3 && firstLens.filter((n) => n >= maxLen - 1).length / multi.length > 0.6;

  const txns = [];
  let prev = opening;
  let ok = 0, fixed = 0;
  for (const r of rows) {
    // Fixed-width wraps cut mid-word, so pieces join with no space, except where the cut fell on a
    // space: then the line is one character short (trailing space dropped) or starts one character in.
    const desc = (fixedWrap
      ? r.parts.reduce((acc, p, i) => {
        if (!i) return p;
        const shortPrev = r.parts[i - 1].length < maxLen;
        const indented = r.px[i] != null && r.px[0] != null && r.cw && r.px[i] - r.px[0] > r.cw * 0.5;
        return acc + (shortPrev || indented || /^\s/.test(p) ? ' ' : '') + p;
      }, '')
      : r.parts.join(' ')).replace(/\s+/g, ' ').trim();
    let amount, dir;
    if (r.debit != null || r.credit != null) {
      if (r.debit && !r.credit) { amount = r.debit; dir = 'out'; }
      else if (r.credit && !r.debit) { amount = r.credit; dir = 'in'; }
      else { amount = r.debit || r.credit || 0; dir = r.debit ? 'out' : 'in'; }
    } else {
      amount = r.amount; dir = amountSide(r.amountRaw) || (/^c/i.test(r.type) ? 'in' : /^d/i.test(r.type) ? 'out' : null);
    }
    // Let the running balance confirm (or decide) the direction.
    if (r.balance != null && prev != null && amount != null) {
      const asOut = r2(prev - amount), asIn = r2(prev + amount);
      if (dir == null) dir = Math.abs(asOut - r.balance) < 0.011 ? 'out' : 'in';
      const expect = dir === 'out' ? asOut : asIn;
      if (Math.abs(expect - r.balance) < 0.011) ok++;
      else {
        const other = dir === 'out' ? asIn : asOut;
        if (Math.abs(other - r.balance) < 0.011) { dir = dir === 'out' ? 'in' : 'out'; fixed++; ok++; }
      }
    } else if (prev == null && r.balance != null) {
      ok++; // first row: nothing to check against
    }
    if (r.balance != null) prev = r.balance;
    if (!amount || !dir) { if (amount) skipped++; continue; } // rows with no amount (opening balance, B/F) are not transactions
    txns.push({ date: r.date, desc, amount: r2(amount), dir, balance: r.balance ?? undefined, ref: r.ref || undefined, status: 'ok' });
  }
  return { txns, skipped, holder, opening, reconcile: { rows: rows.length, ok, fixed, all: ok === rows.length }, hdfc };
}

// ---------------------------------------------------------------- CSV
export function splitCsv(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/).slice(0, 20).join('\n');
  const delim = [',', ';', '\t', '|'].map((d) => [d, (first.match(new RegExp(d === '|' ? '\\|' : d, 'g')) || []).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.map((r) => r.map((f) => f.trim()));
}

const CSV_HEAD = [
  ['date', /^(txn\.?\s*|tran(saction)?\.?\s*|post(ing)?\s*|value\s*)?date(\s*&\s*time)?$|^date\b/i],
  ['time', /^time$/i],
  ['desc', /narration|description|particulars|details|remarks|transaction\s*details|merchant|payee|name/i],
  ['debit', /withdrawal|debit(?!\s*\/)|^dr\.?$|paid\s*out|money\s*out/i],
  ['credit', /deposit|credit(?!\s*\/)|^cr\.?$|paid\s*in|money\s*in/i],
  ['balance', /balance/i],
  ['amount', /amount/i],
  ['type', /^(type|dr\s*\/\s*cr|cr\s*\/\s*dr|debit\s*\/\s*credit|txn\s*type|transaction\s*type)$/i],
  ['status', /^status$/i],
  ['ref', /ref|utr|chq|cheque|transaction\s*id|upi\s*ref/i],
];

export function parseCsv(text) {
  const rows = splitCsv(text).filter((r) => r.some((f) => f !== ''));
  let hi = -1, cols = null;
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const c = {};
    rows[i].forEach((h, j) => {
      for (const [k, re] of CSV_HEAD) if (re.test(h) && c[k] == null) {
        if (k === 'date' && /value/i.test(h) && c.date != null) continue;
        c[k] = j; break;
      }
    });
    if (c.date != null && (c.amount != null || (c.debit != null || c.credit != null))) { hi = i; cols = c; break; }
  }
  if (!cols) throw new StatementError('unknown-format', 'I could not find Date and Amount columns in this CSV.');
  const txns = [];
  let skipped = 0;
  for (const r of rows.slice(hi + 1)) {
    const date = parseDate(r[cols.date]);
    if (!date) { if (r.join('').trim()) skipped++; continue; }
    let amount = null, dir = null;
    const deb = cols.debit != null ? parseAmount(r[cols.debit]) : null;
    const cre = cols.credit != null ? parseAmount(r[cols.credit]) : null;
    if (deb) { amount = Math.abs(deb); dir = 'out'; }
    else if (cre) { amount = Math.abs(cre); dir = 'in'; }
    else if (cols.amount != null) {
      const raw = r[cols.amount];
      const a = parseAmount(raw);
      if (a != null && a !== 0) {
        amount = Math.abs(a);
        const t = cols.type != null ? r[cols.type] : '';
        dir = /^(d|dr|debit|paid|sent|out)/i.test(t) ? 'out' : /^(c|cr|credit|received|in)/i.test(t) ? 'in'
          : amountSide(raw) || (a < 0 ? 'out' : /^\+/.test(raw.trim()) ? 'in' : null);
      }
    }
    if (!amount || !dir) { if (amount) skipped++; continue; } // rows with no amount (opening balance, B/F) are not transactions
    const st = cols.status != null ? r[cols.status] : '';
    const time = cols.time != null ? /(\d{1,2}):(\d{2})/.exec(r[cols.time]) : /(\d{1,2}):(\d{2})/.exec(r[cols.date].slice(8));
    txns.push({
      date, time: time ? `${pad(time[1])}:${time[2]}` : undefined,
      desc: cols.desc != null ? r[cols.desc] : '',
      amount: r2(amount), dir,
      balance: cols.balance != null ? (parseAmount(r[cols.balance]) ?? undefined) : undefined,
      ref: cols.ref != null ? r[cols.ref] : undefined,
      status: /fail|declin|revers/i.test(st) ? 'failed' : 'ok',
    });
  }
  if (!txns.length) throw new StatementError('empty', 'This CSV has no transactions I could read.');
  return { format: 'csv', label: 'CSV statement', confidence: 'high', txns, skipped };
}

// ---------------------------------------------------------------- PDF entry point
export function parsePdfPages(pages) {
  const lines = toLines(pages);
  const text = lines.map((l) => l.text).join('\n');
  // Scanned statements carry no text, or only a page footer/stamp added by the scanner or printer.
  const body = lines.filter((l) => !/^page\s*\d+(\s*of\s*\d+)?$|page \d+ of \d+|(system|computer) generated|scanned (with|by)|camscanner/i.test(l.text)).map((l) => l.text).join(' ');
  if (!text.trim() || body.replace(/\s/g, '').length < 25 * pages.length) throw new StatementError('no-text', 'This PDF has no readable text (it may be a scanned image).');
  if (looksLikePhonePe(text)) {
    const { txns, skipped } = parsePhonePeText(text);
    if (txns.length) return { format: 'phonepe', label: 'PhonePe statement', confidence: 'high', txns, skipped, pages: pages.length };
  }
  const headers = findHeaders(lines);
  const hdfc = [...headers.values()].some((h) => isHdfcHeader(h.line));
  const res = parseBankLines(lines, { hdfc, headers });
  if (res && res.txns.length) {
    return {
      format: hdfc ? 'hdfc' : 'bank',
      label: hdfc ? 'HDFC Bank-style statement' : 'Bank statement',
      confidence: hdfc && res.reconcile.all ? 'high' : 'low',
      pages: pages.length, ...res,
    };
  }
  if ([...headers.values()].some((h) => classifyHeader(h.line).balance)) throw new StatementError('no-rows', 'This statement has no transactions in it.');
  throw new StatementError('unknown-format', 'I could not find a transactions table in this PDF.');
}
