// PAISA: "Paisa Kahan Gaya?" — runs fully in the browser. No uploads, no analytics.
import { readPdf, StatementError, loadPdfjs } from './extract.js';
import { parsePdfPages, parseCsv } from './parsers.js';
import { buildDictionary, analyze } from './analyze.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const FILM = params.get('film') === '1';
// URLs are relative to this module, not the page, so the page works at /paisa (no trailing slash) as well as at /index.html.
const HERE = (p) => new URL(`../${p}`, import.meta.url).href;
const SAMPLE = { url: HERE('samples/sample-bank-statement.pdf'), name: 'sample-bank-statement.pdf' };
const reduced = !FILM && matchMedia('(prefers-reduced-motion: reduce)').matches;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = (n) => Math.round(n).toLocaleString('en-IN');
const inr2 = (n) => (Math.abs(n) < 100 && n % 1 ? n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : inr(n));
const money = (n, cls = '') => `<span class="rs">₹</span><span class="num ${cls}" data-v="${n}">${inr(n)}</span>`;
const pct = (x) => `${Math.round(x * 100)}%`;
const D = (iso) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)));
const dayLabel = (iso, o = { weekday: 'short', day: 'numeric', month: 'short' }) => D(iso).toLocaleDateString('en-IN', { ...o, timeZone: 'UTC' });
const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const sizeLabel = (b) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

let dict = null;
const dictReady = fetch(HERE('data/merchants.json')).then((r) => r.json()).then((j) => (dict = buildDictionary(j)));

// ------------------------------------------------------------------ parsing entry (also used by tests)
// "%PDF-" may come after a few junk bytes (some bank downloads); pdf.js accepts up to 1 KB of them
const isPdfBytes = (b) => { const n = Math.min(b.length - 4, 1024); for (let i = 0; i < n; i++) if (b[i] === 0x25 && b[i + 1] === 0x50 && b[i + 2] === 0x44 && b[i + 3] === 0x46 && b[i + 4] === 0x2d) return true; return false; };
async function parseBytes(bytes, name, { password, onProgress } = {}) {
  if (!bytes || !bytes.length) throw new StatementError('empty', 'This file is empty.');
  if (isPdfBytes(bytes)) {
    const { pages } = await readPdf(bytes, { password, onProgress });
    const res = parsePdfPages(pages);
    res.pages = pages.length;
    return res;
  }
  if (/\.(xlsx?|xls)$/i.test(name || '')) throw new StatementError('excel', 'Excel files are not read directly yet. Open it and save as CSV, then choose the CSV.');
  const text = new TextDecoder('utf-8').decode(bytes);
  if (/[\u0000-\u0008]/.test(text.slice(0, 2000))) throw new StatementError('unknown-format', 'This does not look like a PDF or CSV statement.');
  return parseCsv(text);
}
async function run(bytes, name, opts) {
  await dictReady;
  const parsed = await parseBytes(bytes, name, opts);
  const report = analyze(parsed.txns, dict, { holder: parsed.holder });
  return { parsed, report };
}
window.__paisa = { parseBytes, run, ready: dictReady };

// ------------------------------------------------------------------ status panel
const status = $('#status');
function showProgress(name, size, kind) {
  status.hidden = false;
  status.innerHTML = `
    <div class="filechip"><div class="ic">${kind}</div><div><div class="nm">${esc(name)}</div><div class="sz" id="fsz">${sizeLabel(size)}</div></div></div>
    <div class="prog"><div class="track"><div class="fill" id="pfill"></div></div>
      <div class="msg"><span id="pmsg">Opening on your phone…</span><span id="ppc" class="num">0%</span></div></div>
    <ul class="checks" id="checks"></ul>`;
}
function setProgress(f, msg) {
  const fill = $('#pfill'); if (!fill) return;
  fill.style.transform = `scaleX(${f})`;
  $('#ppc').textContent = `${Math.round(f * 100)}%`;
  if (msg) $('#pmsg').textContent = msg;
}
function addCheck(text) {
  const li = document.createElement('li');
  li.innerHTML = `${ICON_CHECK}<span>${esc(text)}</span>`;
  $('#checks')?.appendChild(li);
  if (!reduced && window.gsap) gsap.from(li, { autoAlpha: 0, y: 6, duration: 0.4, ease: 'expo.out' });
}
function showError(title, body) {
  status.hidden = false;
  status.innerHTML = `<div class="errbox"><h3>${esc(title)}</h3><p>${esc(body)}</p>
    <button type="button" class="btn ghost" id="errAgain">Choose another file</button></div>`;
  $('#errAgain').onclick = () => $('#file').click();
}
function askPassword(file, bytes, wrong) {
  status.hidden = false;
  status.innerHTML = `<form class="pw" id="pwForm" autocomplete="off">
    <label for="pwIn">This PDF is locked</label>
    <p>PhonePe: usually your 10-digit PhonePe mobile number. Banks: check the email or SMS that came with the statement.</p>
    <div class="row"><input id="pwIn" type="password" inputmode="text" autocomplete="off" spellcheck="false" aria-describedby="pwErr" required>
    <button class="btn primary" type="submit">Unlock</button></div>
    ${wrong ? '<p class="err" id="pwErr">That password did not open it. Try again.</p>' : '<p class="small" id="pwErr">The password is used once, on this page. It is never saved or sent.</p>'}
  </form>`;
  const input = $('#pwIn');
  input.focus({ preventScroll: true });
  $('#pwForm').onsubmit = (e) => {
    e.preventDefault();
    const pw = input.value;
    input.value = '';
    handle(file, bytes, pw);
  };
}

const ERR = {
  empty: ['This file is empty', 'Download the statement again and choose the new file.'],
  'no-rows': ['No transactions in this statement', 'Pick a longer period (like the last 3 months), download it again and choose the new file.'],
  'bad-pdf': ['This PDF could not be opened', 'It may be damaged or only partly downloaded. Download it again and retry.'],
  'no-text': ['This PDF is a scanned picture', 'There is no text inside to read. Download the statement from the app or net banking instead of scanning it.'],
  'unknown-format': ['I could not read this statement', 'PhonePe and HDFC Bank PDFs and CSV files work best. Try your bank’s CSV download.'],
  excel: ['Save it as CSV first', 'Excel files are not read directly yet. Open it and save as CSV, then choose the CSV.'],
  offline: ['The PDF reader did not load', 'Check your internet connection and try again. Your file is still only on your phone.'],
  'old-browser': ['This phone is too old to read PDFs here', 'Update to iOS 17.4 or newer (or update Chrome on Android). Or download your statement as CSV: CSV works on every phone.'],
};

let busy = false;
async function handle(file, bytes, password) {
  if (busy) return;
  busy = true;
  try {
    const isPdf = isPdfBytes(bytes);
    showProgress(file.name, bytes.length, isPdf ? 'PDF' : 'CSV');
    setProgress(0.04, isPdf ? 'Loading the PDF reader…' : 'Reading the CSV…');
    const { parsed, report } = await run(bytes, file.name, {
      password,
      onProgress: (n, total) => setProgress(0.08 + 0.84 * (n / total), `Reading page ${n} of ${total}`),
    });
    if (!parsed.txns.length) throw new StatementError('unknown-format');
    setProgress(1, 'Done');
    addCheck(`${parsed.txns.length} transactions found`);
    if (parsed.reconcile?.all) addCheck(`All ${parsed.reconcile.rows} rows match the bank balance`);
    addCheck('Nothing uploaded');
    await wait(reduced ? 100 : 700);
    showDashboard(report, parsed, file);
  } catch (e) {
    if (e instanceof StatementError && (e.kind === 'need-password' || e.kind === 'wrong-password')) askPassword(file, bytes, e.kind === 'wrong-password');
    else {
      const [t, b] = ERR[e.kind] || ['Something went wrong', 'Try again, or try the CSV download from your bank.'];
      showError(t, e.kind === 'unknown-format' && e.message && e.message !== e.kind ? `${e.message} ${b}` : b);
      if (!(e instanceof StatementError)) console.error(e);
    }
  } finally { busy = false; }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

$('#file').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  e.target.value = ''; // so choosing the same file again (after an error) still works
  let bytes;
  try { bytes = new Uint8Array(await f.arrayBuffer()); } catch {
    showError('This file could not be opened', 'If it is in Google Drive or iCloud, download it to your phone first, then choose it again.');
    return;
  }
  handle(f, bytes);
});
$('#sample').addEventListener('click', async () => {
  try {
    const buf = new Uint8Array(await (await fetch(SAMPLE.url)).arrayBuffer());
    handle({ name: SAMPLE.name }, buf);
  } catch { showError('The sample did not load', 'Check your internet connection and try again.'); }
});
// warm the PDF reader while the person finds their file
const warm = () => { loadPdfjs().catch(() => {}); };
$('#pick').addEventListener('pointerdown', warm, { once: true });
$('#sample').addEventListener('pointerdown', warm, { once: true });

// tabs
const tabs = $$('[role="tab"]');
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(i));
  t.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const j = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length; selectTab(j); tabs[j].focus(); }
  });
});
function selectTab(i) {
  tabs.forEach((t, j) => {
    t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1;
    $('#' + t.getAttribute('aria-controls')).hidden = i !== j;
  });
}

// ------------------------------------------------------------------ dashboard
let current = null;
function bar(f, cls = '') { return `<div class="bar-track"><div class="bar-fill ${cls}" data-fill="${Math.max(0.012, Math.min(1, f)).toFixed(4)}" style="transform:scaleX(${Math.max(0.012, Math.min(1, f)).toFixed(4)})"></div></div>`; }

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const rangeLabel = (R) => {
  const y = R.from.slice(0, 4) !== R.to.slice(0, 4) ? { year: 'numeric' } : {};
  return `${dayLabel(R.from, { day: 'numeric', month: 'short', ...y })} – ${dayLabel(R.to, { day: 'numeric', month: 'short', year: 'numeric' })}`;
};
function spanText(R) {
  const y = R.from.slice(0, 4) !== R.to.slice(0, 4) ? { year: 'numeric' } : {};
  const f = dayLabel(R.from, { day: 'numeric', month: 'short', ...y }), t = dayLabel(R.to, { day: 'numeric', month: 'short', ...y });
  return R.from === R.to ? `on ${f}` : `between ${f} and ${t}`;
}
function tilesHtml(R, P) {
  const T = [];
  const leftTxt = R.left >= 0 ? `${money(R.left)} left` : `${money(-R.left)} more went out than came in`;
  const maxIO = Math.max(R.moneyIn, R.spend, 1);
  const actTotal = R.actions.reduce((s, a) => s + a.save, 0);
  // 1. in vs out
  T.push(`<article class="tile" id="t-sum">
    <p class="big">${money(R.spend)}</p>
    <h3 style="margin-top:8px">went out ${spanText(R)}</h3>
    <p class="sub">${!R.salary && P.format === 'phonepe' ? `UPI payments only: your salary is not in this statement. ${money(R.moneyIn)} came in by UPI.` : `${money(R.moneyIn)} came in. ${leftTxt}.`}</p>
    <div class="inout">
      <div class="row"><span class="lab">IN</span>${bar(R.moneyIn / maxIO, 'in')}<span class="val">₹${inr(R.moneyIn)}</span></div>
      <div class="row"><span class="lab">OUT</span>${bar(R.spend / maxIO, 'out')}<span class="val">₹${inr(R.spend)}</span></div>
    </div>
    <ul class="facts">
      ${R.salary ? `<li><span class="v">₹${inr(R.salary)}</span><span class="k">${R.salaryGuessed ? 'Biggest credit (looks like salary)' : 'Salary'}</span></li>` : ''}
      ${R.receivedFromPeople ? `<li><span class="v">₹${inr(R.receivedFromPeople)}</span><span class="k">Friends paid you back</span></li>` : ''}
      ${R.refunds ? `<li><span class="v">₹${inr(R.refunds)}</span><span class="k">Refunds came back (not counted as income)</span></li>` : ''}
      ${R.ownTransfers ? `<li><span class="v">₹${inr(R.ownTransfers)}</span><span class="k">Moved to your own account (not spending)</span></li>` : ''}
      ${R.failedIgnored ? `<li><span class="v">${R.failedIgnored / 2 >= 1 ? Math.floor(R.failedIgnored / 2) : R.failedIgnored} failed</span><span class="k">Payment${R.failedIgnored > 2 ? 's' : ''} that bounced back, ignored</span></li>` : ''}
    </ul>
    ${R.actions.length ? `<a class="jump" href="#t-act">${R.actions.length === 1 ? '1 easy cut could' : `${R.actions.length} easy cuts could`} save ₹${inr(actTotal)} a year ↓</a>` : ''}
  </article>`);
  // 2. categories
  const cats = R.categories.slice(0, 10);
  const rest = R.categories.slice(10);
  if (rest.length) cats.push({ name: `Everything else (${rest.length})`, total: rest.reduce((s, c) => s + c.total, 0), share: rest.reduce((s, c) => s + c.share, 0) });
  const topFlex = R.categories.find((c) => !['Rent', 'EMI & loans', 'Investments', 'Other'].includes(c.name));
  T.push(`<article class="tile" id="t-cat">
    <h3>Where it went</h3>
    <p class="sub">${topFlex ? `After fixed costs, <b style="color:var(--ink);font-weight:600">${esc(topFlex.name.toLowerCase())}</b> took the most.` : ''}</p>
    <ul class="cats">${cats.map((c) => `<li class="${c === topFlex ? 'hot' : ''}"><span class="nm">${esc(c.name)}</span><span><span class="amt">₹${inr(c.total)}</span><span class="pc">${pct(c.share)}</span></span>${bar(c.total / cats[0].total)}</li>`).join('')}</ul>
  </article>`);
  // 3. food delivery vs groceries
  if (R.foodDelivery || R.groceries) {
    const f = R.foodDelivery, g = R.groceries;
    const head = f > g * 1.15 ? `Delivery cost ${g ? (f / g).toFixed(1) + '×' : 'more than'} your groceries` : g > f * 1.15 ? 'Groceries beat delivery. Nice.' : 'Delivery and groceries ran neck and neck';
    const brands = (l) => l.map((b) => `<span class="bn">${esc(b.name)} ${b.count}</span>`).join('&nbsp;· ') || 'No orders'; const fb = brands(R.foodBrands), gb = brands(R.groceryBrands);
    T.push(`<article class="tile" id="t-food">
      <h3>${head}</h3>
      <div class="vs">
        <div class="side ${f >= g ? 'hot' : ''}"><span class="cap">Food delivery</span><span class="mid">${money(f)}</span><span class="who">${plural(R.foodOrders, 'order')}<br>${fb}</span></div>
        <div class="side ${g > f ? 'hot' : ''}"><span class="cap">Groceries</span><span class="mid">${money(g)}</span><span class="who">${plural(R.groceryOrders, 'order')}<br>${gb}</span></div>
      </div>
      <div class="ratio" aria-hidden="true"><span class="a" style="flex:${f || 0.001}"></span><span class="b" style="flex:${g || 0.001}"></span></div>
    </article>`);
  }
  // 4. subscriptions
  if (R.subscriptions.length) {
    const video = R.subscriptions.filter((s) => s.video).length;
    T.push(`<article class="tile" id="t-subs">
      <h3>${money(R.subscriptionMonthly)} a month on subscriptions</h3>
      <p class="sub">That is ₹${inr(R.subscriptionYearly)} a year. Still using all of them?</p>
      <ul class="list">${R.subscriptions.map((s) => `<li><span class="nm">${esc(s.name)}${s.video && video >= 2 ? '<span class="tag">VIDEO</span>' : ''}${s.recurring ? '<small>Repeats every month</small>' : ''}</span><span class="amt">₹${inr(s.monthly)}<small>₹${inr(s.yearly)}/yr</small></span></li>`).join('')}</ul>
      <div class="total"><span class="cap">Every year</span><span class="v">₹${inr(R.subscriptionYearly)} <small>/ ₹${inr(R.subscriptionMonthly)} a month</small></span></div>
    </article>`);
  }
  // 5. small leaks
  if (R.smallLeaks.count) {
    const amts = R.smallLeaks.amounts.slice(0, 156);
    T.push(`<article class="tile" id="t-leak">
      <h3><span class="num" data-v="${R.smallLeaks.count}">${R.smallLeaks.count}</span> tiny payments added up to ${money(R.smallLeaks.total)}</h3>
      <p class="sub">Each under ₹150: chai, autos, little shops. About ₹${inr(R.smallLeaks.perDay)} a day.</p>
      <div class="dots" aria-hidden="true">${amts.map((a) => `<i data-s="${a < 40 ? 1 : a < 90 ? 2 : 3}"></i>`).join('')}</div>
      <p class="note" style="margin-top:10px">One dot per payment. Bigger dot, bigger payment.</p>
    </article>`);
  }
  // 6. top merchants
  if (R.topMerchants.length) {
    const m0 = R.topMerchants[0].total;
    T.push(`<article class="tile" id="t-merch">
      <h3>Where you spent most</h3>
      <ul class="list">${R.topMerchants.map((m, i) => `<li><span class="nm"><span class="rank">${i + 1}</span>${esc(m.name)}<small style="margin-left:22px">${m.count} payment${m.count > 1 ? 's' : ''} · ${esc(m.category)}</small></span><span class="amt">₹${inr(m.total)}</span>${bar(m.total / m0)}</li>`).join('')}</ul>
    </article>`);
  }
  // 7. people
  if (R.topPeople.length) {
    T.push(`<article class="tile" id="t-people">
      <h3>People you paid most</h3>
      <p class="sub">Friends and family. Rent and tiny payments are not counted here.</p>
      <ul class="list">${R.topPeople.map((p) => `<li><span class="nm">${esc(p.name)}<small>${p.count} payment${p.count > 1 ? 's' : ''}</small></span><span class="amt">₹${inr(p.total)}</span></li>`).join('')}</ul>
    </article>`);
  }
  // 8. biggest day
  if (R.biggestDay) {
    const days = [];
    for (let d = D(R.from); d <= D(R.to); d = new Date(d.getTime() + 864e5)) days.push(d.toISOString().slice(0, 10));
    const map = Object.fromEntries(R.days.map((x) => [x.date, x.total]));
    const max = R.biggestDay.total;
    const cols = days.length <= 62 ? days : null;
    T.push(`<article class="tile" id="t-day">
      <h3>${dayLabel(R.biggestDay.date)} was your biggest day</h3>
      <p class="mid" style="margin:10px 0 0">${money(R.biggestDay.total)}</p>
      <p class="sub">${R.biggestDay.items.slice(0, 3).map((x) => `${esc(x.name)} ₹${inr(x.amount)}`).join(' · ')}${R.biggestDay.items.length > 3 ? ` + ${R.biggestDay.items.length - 3} more` : ''}</p>
      <p class="note" style="margin-top:6px">Daily spending, not counting rent, EMI and investments.</p>
      ${cols ? `<div class="days" id="days">${cols.map((d) => { const v = map[d] || 0; return `<b class="${d === R.biggestDay.date ? 'top' : v ? '' : 'zero'}" style="height:${Math.max(2, (v / max) * 100).toFixed(1)}%" data-d="${d}" data-v="${v}" aria-label="${dayLabel(d)}: ₹${inr(v)}"></b>`; }).join('')}<span class="tip" id="tip"></span></div>
      <div class="axis"><span>${dayLabel(days[0], { day: 'numeric', month: 'short' })}</span><span>${dayLabel(days[days.length - 1], { day: 'numeric', month: 'short' })}</span></div>` : ''}
    </article>`);
  }
  // 9. actions
  if (R.actions.length) {
    T.push(`<article class="tile finale" id="t-act">
      <h3>${R.actions.length === 1 ? 'One cut' : `${R.actions.length} cuts`}. ${money(actTotal)} back a year.</h3>
      <ul class="acts">${R.actions.map((a) => `<li><span class="t">${esc(a.title)}</span><span class="d">${esc(a.detail)}</span><span class="s"><span class="mid">${money(a.save)}</span><span class="per">saved / year</span></span></li>`).join('')}</ul>
    </article>`);
  }
  return T.join('');
}

function metaHtml(R, P, file) {
  const chips = [];
  chips.push(`<span class="chip file" title="${esc(file.name)}">${esc(file.name)}</span>`);
  chips.push(`<span class="chip">${rangeLabel(R)}</span>`);
  chips.push(`<span class="chip">${P.txns.length} transactions</span>`);
  if (P.reconcile?.all) chips.push(`<span class="chip">${ICON_CHECK}all rows match the balance</span>`);
  if (P.confidence === 'low') chips.push(`<span class="chip warn">Unknown layout: may be less accurate</span>`);
  if (P.skipped) chips.push(`<span class="chip warn">${P.skipped} row${P.skipped > 1 ? 's' : ''} I could not read</span>`);
  if (R.rentGuessed) chips.push(`<span class="chip warn">Rent guessed from a big early-month payment</span>`);
  return chips.join('');
}

const TX_MAX = 600;
$('#allTx').addEventListener('toggle', () => { if ($('#allTx').open && current && !$('#txTable').innerHTML) $('#txTable').innerHTML = txTable(current.R); });
function txTable(R) {
  const label = { failed: 'Failed / reversed, ignored', own: 'Own account, not spending', refund: 'Refund', 'people-in': 'Received from people', income: 'Income' };
  const all = R.txns.slice().sort((a, b) => b.date.localeCompare(a.date) || b.i - a.i); // newest first
  const rows = all.slice(0, TX_MAX);
  const more = all.length - rows.length;
  return `<tbody>${more ? `<tr><td colspan="3" class="more">Newest ${TX_MAX} shown. ${more.toLocaleString('en-IN')} older ones are counted in the tiles above.</td></tr>` : ''}${rows.map((t) => `<tr><td>${dayLabel(t.date, { day: '2-digit', month: 'short' })}</td><td>${esc(t.merchant)}<span class="c">${esc(t.kind === 'spend' ? t.category : label[t.kind] || t.kind)}</span></td><td class="${t.kind === 'failed' ? 'x' : t.dir === 'in' ? 'in' : ''}">${t.dir === 'in' ? '+' : '−'}₹${inr2(t.amount)}</td></tr>`).join('')}</tbody>`;
}

function renderDashboard(R, P, file) {
  current = { R, P, file };
  $('#dmeta').innerHTML = metaHtml(R, P, file);
  $('#tiles').innerHTML = tilesHtml(R, P);
  $('#allSum').textContent = `All ${R.txns.length} transactions, with categories`;
  $('#txTable').innerHTML = '';
  $('#allTx').open = false;
  $$('.dots i').forEach((el) => { const s = +el.dataset.s; el.style.opacity = [0, 0.45, 0.7, 1][s]; el.style.transform = `scale(${[0, 0.62, 0.8, 1][s]})`; });
  wireDayTips();
}

function wireDayTips() {
  const box = $('#days'); if (!box) return;
  const tip = $('#tip');
  const show = (b) => {
    tip.textContent = `${dayLabel(b.dataset.d, { day: 'numeric', month: 'short' })} · ₹${inr(+b.dataset.v)}`;
    const r = b.getBoundingClientRect(), pr = box.getBoundingClientRect();
    const x = Math.min(Math.max(r.left - pr.left + r.width / 2, 50), pr.width - 50);
    tip.style.left = `${x}px`; tip.classList.add('on');
  };
  box.addEventListener('pointerover', (e) => { if (e.target.tagName === 'B') show(e.target); });
  box.addEventListener('pointerdown', (e) => { if (e.target.tagName === 'B') show(e.target); });
  box.addEventListener('pointerleave', () => tip.classList.remove('on'));
}

// one tile's entrance: rise + unblur, then its data fills in
function tileTimeline(tile) {
  const tl = gsap.timeline({ paused: true });
  const to = { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out' };
  if (!FILM) to.clearProps = 'filter';
  tl.fromTo(tile, { autoAlpha: 0, y: 32, filter: 'blur(8px)' }, to, 0);
  const fills = $$('[data-fill]', tile);
  if (fills.length) tl.fromTo(fills, { scaleX: 0 }, { scaleX: (i, el) => +el.dataset.fill, duration: 1.0, ease: 'expo.out', stagger: 0.06 }, 0.18);
  const ratio = $$('.ratio span', tile);
  if (ratio.length) tl.fromTo(ratio, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'expo.out', stagger: 0.12 }, 0.25);
  const dots = $$('.dots i', tile);
  if (dots.length) tl.fromTo(dots, { autoAlpha: 0, scale: 0.2 }, { autoAlpha: (i, el) => [0, 0.45, 0.7, 1][+el.dataset.s], scale: (i, el) => [0, 0.62, 0.8, 1][+el.dataset.s], duration: 0.5, ease: 'back.out(1.4)', stagger: 0.016 }, 0.2);
  const cols = $$('.days b', tile);
  if (cols.length) tl.fromTo(cols, { scaleY: 0 }, { scaleY: 1, duration: 0.7, ease: 'expo.out', stagger: 0.025 }, 0.2);
  const rows = $$('.list li, .acts li, .cats li, .vs .side, .facts li', tile);
  if (rows.length) tl.fromTo(rows, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.07 }, 0.12);
  for (const el of $$('[data-v]', tile)) {
    if (el.tagName === 'B') continue;
    const target = +el.dataset.v;
    const proxy = { v: 0 };
    el._proxy = proxy;
    // film: short and settled (0.8 s power3.out), so a held reel frame never shows a half-counted number
    tl.fromTo(proxy, { v: 0 }, { v: target, duration: FILM ? 0.8 : 1.3, ease: FILM ? 'power3.out' : 'expo.out', onUpdate: () => { el.textContent = inr(proxy.v); } }, 0.1);
  }
  return tl;
}
const syncNumbers = () => $$('[data-v]').forEach((el) => { if (el._proxy) el.textContent = inr(el._proxy.v); });

function showDashboard(R, P, file) {
  renderDashboard(R, P, file);
  const intro = $('#intro'), dash = $('#dash');
  const swap = () => {
    intro.hidden = true; dash.hidden = false;
    window.scrollTo(0, 0);
    $('#dtitle').focus?.();
    if (reduced || !window.gsap) return;
    gsap.fromTo('#dhead', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' });
    const tiles = $$('#tiles .tile');
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); e.target._tl.play(); }
    }, { rootMargin: '0px 0px -12% 0px' });
    tiles.forEach((t, i) => {
      t._tl = tileTimeline(t);
      const r = t.getBoundingClientRect();
      if (r.top < innerHeight * 0.95) gsap.delayedCall(0.15 + i * 0.12, () => t._tl.play());
      else io.observe(t);
    });
  };
  if (reduced || !window.gsap) swap();
  else gsap.to(intro, { autoAlpha: 0, y: -16, duration: 0.35, ease: 'power2.in', onComplete: () => { gsap.set(intro, { clearProps: 'all' }); swap(); } });
}

$('#againBtn').addEventListener('click', () => {
  current = null;
  $('#tiles').innerHTML = ''; $('#txTable').innerHTML = ''; $('#dmeta').innerHTML = '';
  $('#dash').hidden = true; $('#intro').hidden = false;
  status.hidden = true; status.innerHTML = '';
  $('#file').value = '';
  window.scrollTo(0, 0);
  if (!reduced && window.gsap) gsap.from('#intro .wrap-in > *', { autoAlpha: 0, y: 16, duration: 0.6, ease: 'expo.out', stagger: 0.05 });
});

// ------------------------------------------------------------------ share card (made locally on a canvas)
const sheet = $('#sheet');
let iconImg = null;
const iconReady = new Promise((res) => { const im = new Image(); im.onload = () => { iconImg = im; res(); }; im.onerror = res; im.src = HERE('assets/img/nis-icon.png'); });
$('#shareBtn').addEventListener('click', async () => {
  if (!current) return;
  $('#showAmt').checked = false;
  await drawCard();
  if (sheet.showModal) sheet.showModal(); else sheet.setAttribute('open', ''); // iOS < 15.4 has no <dialog>
});
const closeSheet = () => (sheet.close ? sheet.close() : sheet.removeAttribute('open'));
$('#sheetClose').addEventListener('click', closeSheet);
sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
$('#showAmt').addEventListener('change', drawCard);

async function drawCard() {
  const { R } = current;
  const show = $('#showAmt').checked;
  await Promise.all([document.fonts.load('400 92px "Instrument Serif"'), document.fonts.load('italic 400 92px "Instrument Serif"'), document.fonts.load('600 34px Sora'), document.fonts.load('500 24px "JetBrains Mono"'), iconReady]);
  const c = $('#card'), x = c.getContext('2d');
  const W = c.width, H = c.height;
  x.fillStyle = '#0C0A14'; x.fillRect(0, 0, W, H);
  const glow = (cx, cy, r, col) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(12,10,20,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  glow(120, 80, 620, 'rgba(109,40,217,0.42)'); glow(1000, 1200, 640, 'rgba(180,83,47,0.32)');
  const P = 72;
  if (iconImg) x.drawImage(iconImg, P, 64, 64, 64);
  x.fillStyle = '#B9B3CC'; x.font = '500 24px "JetBrains Mono"'; x.textAlign = 'right';
  x.fillText('THENISPACE.COM/PAISA', W - P, 106); x.textAlign = 'left';
  x.fillStyle = '#F4F0FF'; x.font = '400 104px "Instrument Serif"';
  x.fillText('Where my paisa', P, 262);
  x.font = 'italic 400 104px "Instrument Serif"'; x.fillStyle = '#F0A386';
  x.fillText('went.', P, 360);
  const per = dayLabel(R.from, { month: 'long', year: 'numeric' });
  x.font = '400 30px Sora'; x.fillStyle = '#B9B3CC';
  x.fillText(R.from.slice(0, 7) === R.to.slice(0, 7) && R.spanDays >= 25 ? per : rangeLabel(R), P + 300, 360);
  // category bars
  const cats = R.categories.slice(0, 6);
  let y = 470; const bw = W - P * 2;
  for (const cat of cats) {
    x.font = '400 34px Sora'; x.fillStyle = '#F4F0FF'; x.fillText(cat.name, P, y);
    x.textAlign = 'right'; x.font = '600 34px Sora';
    x.fillText(show ? `₹${inr(cat.total)}  ·  ${pct(cat.share)}` : pct(cat.share), W - P, y); x.textAlign = 'left';
    rr(x, P, y + 18, bw, 12, 6, 'rgba(255,255,255,0.08)');
    rr(x, P, y + 18, Math.max(12, bw * (cat.total / cats[0].total)), 12, 6, cat === cats.find((k) => !['Rent', 'EMI & loans', 'Investments', 'Other'].includes(k.name)) ? '#D0704F' : '#8B5CF6');
    y += 96;
  }
  // takeaway box
  const by = 1060; rr(x, P, by, bw, 170, 28, 'rgba(255,255,255,0.05)');
  const actT = R.actions.reduce((s, a) => s + a.save, 0);
  const yearly = (R.spend / R.months) * 12;
  x.fillStyle = '#F0A386'; x.font = 'italic 400 64px "Instrument Serif"';
  const top = R.categories[0];
  if (R.actions.length) {
    x.fillText(show ? `₹${inr(actT)} a year` : `${Math.max(1, Math.round((actT / Math.max(1, yearly)) * 100))}% of my spending`, P + 34, by + 82);
    x.fillStyle = '#B9B3CC'; x.font = '400 28px Sora';
    x.fillText(`could come back with ${R.actions.length} small cut${R.actions.length === 1 ? '' : 's'}.`, P + 34, by + 132);
  } else if (top) {
    x.fillText(`${pct(top.share)} on ${top.name.toLowerCase()}`.slice(0, 34), P + 34, by + 82);
    x.fillStyle = '#B9B3CC'; x.font = '400 28px Sora';
    x.fillText('was my biggest spend.', P + 34, by + 132);
  }
  x.fillStyle = '#75718A'; x.font = '500 22px "JetBrains Mono"';
  x.fillText('READ ON MY PHONE. NOTHING UPLOADED.', P, H - 60);
  prepareCardFile();
}
function rr(x, X, Y, w, h, r, fill) {
  x.beginPath();
  if (x.roundRect) x.roundRect(X, Y, w, h, r);
  else { r = Math.min(r, w / 2, h / 2); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  x.fillStyle = fill; x.fill();
}

const cardBlob = () => new Promise((res) => $('#card').toBlob(res, 'image/png'));
let cardFile = null; // made right after drawing, so Share can call navigator.share without waiting
async function prepareCardFile() { cardFile = null; const b = await cardBlob(); if (b) cardFile = new File([b], 'my-paisa-card.png', { type: 'image/png' }); }
$('#saveCard').addEventListener('click', async () => {
  const b = cardFile || await cardBlob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = 'my-paisa-card.png';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
});
$('#shareCard').addEventListener('click', async () => {
  const f = cardFile || new File([await cardBlob()], 'my-paisa-card.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [f] })) {
    try { await navigator.share({ files: [f], title: 'Where my paisa went' }); }
    catch (e) { if (e && e.name !== 'AbortError') $('#saveCard').click(); } // blocked, not just closed: save instead
  } else $('#saveCard').click();
});

// ------------------------------------------------------------------ film mode (for the reel capture)
// index.html?film=1 -> window.__film = { duration, seek(t) }. One paused GSAP timeline, no timers, no randomness.
async function startFilm() {
  document.body.classList.add('film');
  if (!window.gsap) await new Promise((r) => addEventListener('load', r, { once: true }));
  history.scrollRestoration = 'manual';
  const buf = new Uint8Array(await (await fetch(SAMPLE.url)).arrayBuffer());
  const { parsed, report } = await run(buf, SAMPLE.name);
  renderDashboard(report, parsed, { name: SAMPLE.name });
  $('#dash').hidden = false;
  showProgress(SAMPLE.name, buf.length, 'PDF');
  $('#fsz').textContent = `${sizeLabel(buf.length)} · ${parsed.pages} pages`;
  const checks = [`${parsed.txns.length} transactions found`];
  if (parsed.reconcile?.all) checks.push(`All ${parsed.reconcile.rows} rows match the bank balance`);
  checks.push('Nothing uploaded');
  $('#checks').innerHTML = checks.map((c) => `<li>${ICON_CHECK}<span>${esc(c)}</span></li>`).join('');
  await document.fonts.ready;
  window.scrollTo(0, 0);

  const vh = innerHeight;
  const tl = gsap.timeline({ paused: true });
  // --- intro (0 - 8.3 s): open, tap, read pages, checks
  tl.fromTo('#title .ln', { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 1.0, ease: 'expo.out', stagger: 0.16 }, 0.1);
  tl.fromTo(['#lede', '#privacy', '#actions', '#helper'], { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.12 }, 0.5);
  tl.fromTo('#pick', { scale: 1 }, { scale: 0.97, duration: 0.12, ease: 'power2.out', yoyo: true, repeat: 1 }, 1.95);
  tl.fromTo('#pick .tap', { autoAlpha: 0.55, scale: 0.4 }, { autoAlpha: 0, scale: 3.2, duration: 0.7, ease: 'expo.out' }, 1.95);
  tl.fromTo('#status', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, 2.3);
  tl.to('#helper', { autoAlpha: 0, duration: 0.4, immediateRender: false }, 2.3);
  const pages = parsed.pages || 1;
  const prog = { f: 0 };
  tl.fromTo(prog, { f: 0 }, { f: 1, duration: 3.4, ease: 'power1.inOut' }, 2.6);
  tl.fromTo('#pfill', { scaleX: 0 }, { scaleX: 1, duration: 3.4, ease: 'power1.inOut' }, 2.6);
  const progText = () => {
    const f = prog.f;
    $('#ppc').textContent = `${Math.round(f * 100)}%`;
    $('#pmsg').textContent = f <= 0 ? 'Opening on your phone…' : f >= 1 ? 'Done' : `Reading page ${Math.min(pages, Math.floor(f * pages) + 1)} of ${pages}`;
  };
  tl.fromTo('#checks li', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out', stagger: 0.4 }, 6.15);
  tl.to('#intro', { autoAlpha: 0, y: -36, filter: 'blur(10px)', duration: 0.7, ease: 'power2.inOut' }, 7.6);
  // --- dashboard build (8 - 14 s), then a smooth scroll through every tile (14 - 26 s)
  tl.fromTo('#dhead', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 7.95);
  const tiles = $$('#tiles .tile');
  const tops = tiles.map((t) => t.getBoundingClientRect().top + scrollY);
  const foot = $('#footActions');
  const endY = Math.max(0, Math.min(document.documentElement.scrollHeight - vh, foot.getBoundingClientRect().top + scrollY + foot.offsetHeight + 28 - vh));
  const S0 = 14, S1 = 26;
  const ease = gsap.parseEase('sine.inOut');
  const scrollAt = (t) => (t <= S0 ? 0 : t >= S1 ? endY : endY * ease((t - S0) / (S1 - S0)));
  let k = 0;
  const tileTimes = [];
  tiles.forEach((tile, i) => {
    const tTL = tileTimeline(tile);
    let at;
    if (tops[i] < vh * 0.9) { at = 8.35 + k * 1.15; k++; }
    else {
      at = S1;
      for (let t = S0; t <= S1; t += 0.02) { if (tops[i] - scrollAt(t) < vh * 0.84) { at = t; break; } }
    }
    tl.add(tTL.play(), at); // add the child timeline (unpaused inside the master)
    tileTimes.push({ id: tile.id, top: Math.round(tops[i]), h: Math.round(tile.offsetHeight), at: +at.toFixed(3), end: +(at + tTL.duration()).toFixed(3) });
  });
  const scroll = { y: 0 };
  tl.fromTo(scroll, { y: 0 }, { y: endY, duration: S1 - S0, ease: 'sine.inOut' }, S0);
  tl.fromTo('#footActions', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' }, Math.max(S0, S1 - 2.2));
  tl.to({}, { duration: 1.2 }, S1);

  const apply = () => { window.scrollTo(0, Math.round(scroll.y)); progText(); syncNumbers(); };
  window.__film = {
    duration: tl.duration(),
    introEnd: 14,
    scrollStart: S0,
    scrollEnd: S1,
    tiles: tileTimes, // per tile: page top, height, build start and end (film s), for the reel's hold planner
    seek(t) { tl.pause(); tl.seek(Math.max(0, Math.min(t, tl.duration())), false); apply(); return t; },
  };
  // Warm up before saying "ready": decode images and play the whole timeline once, forwards, so every
  // tween has recorded its start values and every layer is painted. Then frames depend only on t.
  await Promise.all([...document.images].map((im) => (im.decode ? im.decode().catch(() => {}) : null)));
  const frame = () => new Promise((r) => { requestAnimationFrame(() => r()); setTimeout(r, 60); }); // rAF stalls in hidden tabs
  for (let t = 0; t <= tl.duration(); t += 0.5) { window.__film.seek(t); await frame(); }
  window.__film.seek(0);
  await frame(); await frame();
  window.__filmReady = true;
}

if (FILM) startFilm().catch((e) => { console.error(e); window.__filmError = String(e && e.message || e); });
