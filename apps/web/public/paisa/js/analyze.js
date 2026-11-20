// Turns parsed transactions into the PAISA report. Pure functions, no DOM, no network.

const r2 = (n) => Math.round(n * 100) / 100;
export const SMALL_LEAK_MAX = 150;
const NOT_LEAK = new Set(['Subscriptions', 'Bills & recharge', 'Fees & charges', 'Investments', 'EMI & loans', 'Rent']);
const NOT_MERCHANT = new Set(['Rent', 'EMI & loans', 'Investments', 'Transfers to people', 'Small payments', 'Cash (ATM)', 'Fees & charges']);
const FIXED = new Set(['Rent', 'EMI & loans', 'Investments']);
const REPEAT_CATS = new Set(['Other', 'Entertainment']);
const BILL_SUBS = new Set(['Mobile plan (recurring recharge)', 'DTH', 'Broadband']);
const VIDEO_SUBS = new Set(['Netflix', 'Amazon Prime', 'JioHotstar', 'SonyLIV', 'ZEE5', 'YouTube Premium', 'Apple (iCloud / Apple Music / TV)']);
const SHORT_AMBIGUOUS = new Set(['mr', 'mrs', 'ms', 'dr', 'vi', 'fd', 'rd', 'pg', 'mf', 'sal', 'rev', 'div', 'sip', 'jio', 'cab', 'lab', 'pub', 'fee', 'fine', 'gift', 'cash', 'owner', 'return', 'charge', 'charges', 'fees']);

// Extra keywords found while testing the sample layouts (kept apart from the research file).
const EXTRA = {
  'Food delivery': ['bundl technologies', 'bundl'],
  Subscriptions: ['jiohotstar', 'netflix com'],
  'Fees & charges': ['sms alert charges', 'chgs'],
  Refunds: ['refund received'],
  'Cash (ATM)': ['atw'],
};

const BRANDS = [
  ['swiggy instamart', 'Swiggy Instamart'], ['instamart', 'Swiggy Instamart'], ['bundl technologies', 'Swiggy'], ['bundl', 'Swiggy'], ['swiggy', 'Swiggy'],
  ['zomato', 'Zomato'], ['blinkit', 'Blinkit'], ['grofers', 'Blinkit'], ['zepto', 'Zepto'], ['bigbasket', 'BigBasket'], ['jiomart', 'JioMart'], ['dmart', 'DMart'],
  ['uber', 'Uber'], ['olacabs', 'Ola'], ['ola cabs', 'Ola'], ['rapido', 'Rapido'], ['namma yatri', 'Namma Yatri'], ['irctc', 'IRCTC'], ['makemytrip', 'MakeMyTrip'], ['redbus', 'redBus'],
  ['amazon prime', 'Amazon Prime'], ['prime video', 'Amazon Prime'], ['amazon pay', 'Amazon'], ['amazon', 'Amazon'], ['amzn', 'Amazon'],
  ['flipkart', 'Flipkart'], ['myntra', 'Myntra'], ['ajio', 'AJIO'], ['meesho', 'Meesho'], ['nykaa', 'Nykaa'],
  ['netflix', 'Netflix'], ['spotify', 'Spotify'], ['jiohotstar', 'JioHotstar'], ['jio hotstar', 'JioHotstar'], ['hotstar', 'JioHotstar'], ['youtube premium', 'YouTube Premium'], ['google youtube', 'YouTube Premium'],
  ['sonyliv', 'SonyLIV'], ['zee5', 'ZEE5'], ['cultfit', 'Cult.fit'], ['cult fit', 'Cult.fit'], ['curefit', 'Cult.fit'],
  ['airtel', 'Airtel'], ['bescom', 'BESCOM'], ['act fibernet', 'ACT Fibernet'], ['indianoil', 'Indian Oil'], ['indian oil', 'Indian Oil'], ['iocl', 'Indian Oil'], ['hpcl', 'HP Petrol'], ['bpcl', 'Bharat Petroleum'],
  ['bajaj finance', 'Bajaj Finance'], ['zerodha', 'Zerodha'], ['groww', 'Groww'], ['apollo pharmacy', 'Apollo Pharmacy'], ['bookmyshow', 'BookMyShow'],
  ['third wave', 'Third Wave Coffee'], ['chaayos', 'Chaayos'], ['chai point', 'Chai Point'], ['starbucks', 'Starbucks'], ['dominos', "Domino's"], ['domino', "Domino's"], ['truffles', 'Truffles'],
];
const BRANDS_SQ = BRANDS.map(([k, label]) => [k, label, k.replace(/ /g, '')]);
const BRAND_KEY = new Map();
for (const [k, label] of BRANDS) if (!BRAND_KEY.has(label)) BRAND_KEY.set(label, k);
const BUSINESS_WORDS = /\b(store|stores|shop|mart|enterprises?|traders?|pvt|ltd|limited|private|india|services|centre|center|cafe|foods?|hotel|restaurant|bakery|medicals?|pharmacy|agency|agencies|company|co|technologies|solutions|systems|xerox|stall|point|petrol|motors|garage|salon|kirana|general|supermarket|corporation|bank|pay|online|retail|mall|hospital|clinic|labs?|llp|designs?|studios?|consult\w*|associates|industries|exports|infotech|digital|media|ventures|trust|society|school|college|academy|tutorials|finance|insurance|broking|securities|fund)\b/i;

export const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const title = (s) => String(s).toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\s+/g, ' ').trim();

export function buildDictionary(json) {
  const priority = json._meta.priority;
  const map = new Map();
  const ambiguous = new Set((json.ambiguous_keywords || []).map(norm));
  const addKw = (cat, kw) => {
    const k = norm(kw);
    if (!k) return;
    const existing = map.get(k);
    if (!existing || priority.indexOf(cat) < priority.indexOf(existing)) map.set(k, cat);
  };
  for (const cat of priority) for (const kw of json.categories[cat] || []) addKw(cat, kw);
  for (const [cat, kws] of Object.entries(EXTRA)) for (const kw of kws) addKw(cat, kw);
  const subs = (json.subscription_merchants?.items || []).map((it) => ({ label: it.label, match: it.match.map(norm).filter(Boolean) }));
  // squashed long keywords, made once (the fallback for glued words runs on many rows)
  const longKw = [...map].map(([kw, cat]) => [kw.replace(/ /g, ''), kw, cat]).filter(([k, kw]) => k.length >= 7 && !ambiguous.has(kw));
  return { map, ambiguous, priority, subs, longKw, personRe: new RegExp(json.vpa_person_regex || '^[0-9]{10}@'), merchantHints: (json.vpa_merchant_hints || []).map((h) => new RegExp(h.replace(/\./g, '\\.'), 'i')) };
}

/** Best category for a text: longest keyword wins, then priority. Ambiguous words only as a last resort. */
export function matchCategory(dict, text, wholeName) {
  const tokens = norm(text).split(' ').filter(Boolean);
  let best = null;
  const consider = (kw, cat, weak) => {
    const score = (weak ? 0 : 1000) + kw.length * 10 - dict.priority.indexOf(cat) / 100;
    if (!best || score > best.score) best = { kw, cat, score, weak };
  };
  for (let n = 4; n >= 1; n--) {
    for (let i = 0; i + n <= tokens.length; i++) {
      const kw = tokens.slice(i, i + n).join(' ');
      const cat = dict.map.get(kw);
      if (!cat) continue;
      if (dict.ambiguous.has(kw) || SHORT_AMBIGUOUS.has(kw)) {
        if (SHORT_AMBIGUOUS.has(kw) && kw !== norm(wholeName)) continue;
        consider(kw, cat, true);
      } else consider(kw, cat, false);
    }
  }
  if (!best || best.weak) {
    // squashed text (fixed-width wraps can glue words: "TEASTALL") - only long keywords
    const compact = tokens.join('');
    for (const [k, kw, cat] of dict.longKw) if (compact.includes(k)) consider(kw, cat, false);
  }
  return best;
}

export function matchSubscription(dict, text) {
  const t = ' ' + norm(text) + ' ';
  for (const s of dict.subs) for (const m of s.match) if (t.includes(' ' + m + ' ')) return s.label;
  const compact = t.replace(/ /g, '');
  for (const s of dict.subs) for (const m of s.match) if (m.length >= 7 && compact.includes(m.replace(/ /g, ''))) return s.label;
  return null;
}

const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/** Pull counterparty name, UPI id and note out of a narration or app description. */
export function parseNarration(desc) {
  const d = cleanName(desc).replace(/\s*\/\s*/g, '/');
  let m;
  const out = { name: d, vpa: null, note: '', channel: 'other', reversal: false, refund: false };
  if ((m = /^(Paid to|Payment to|Transfer to|Sent to)\s+(.+)$/i.exec(d))) return { ...out, name: m[2], channel: 'app' };
  if ((m = /^Received from\s+(.+)$/i.exec(d))) return { ...out, name: m[1], channel: 'app' };
  if ((m = /^Refund received(?:\s+from)?\s*(.*)$/i.exec(d))) return { ...out, name: m[1] || 'Refund', channel: 'app', refund: true };
  if ((m = /^(Bill paid|Mobile recharged|Paid)\s*[-:]?\s*(.*)$/i.exec(d)) && m[2]) return { ...out, name: m[2], channel: 'app' };
  if ((m = /^(REV|RVSL|REVERSAL)[-\s/:]*(?:UPI)?[-/]?(.*)$/i.exec(d))) {
    const rest = m[2];
    const inner = parseNarration('UPI' + ((rest.match(/\//g) || []).length > (rest.match(/-/g) || []).length ? '/' : '-') + rest);
    return { ...inner, reversal: true };
  }
  if ((m = /^UPI[-/](.+)$/i.exec(d))) {
    const body = m[1];
    const sep = (body.match(/\//g) || []).length > (body.match(/-/g) || []).length ? '/' : '-';
    const parts = body.split(sep).map((p) => p.trim());
    const vpaAny = (/[\w.\-]+@[a-z]+/i.exec(body) || [null])[0];
    if (sep === '/' && /^(DR|CR|P2A|P2M)$/i.test(parts[0])) { // SBI / Axis slash style: UPI/DR/RRN/NAME/...
      const rest = parts.slice(1).filter((p) => !/^\d{9,}$/.test(p));
      return { ...out, name: rest[0] || d, note: rest.slice(1).filter((p) => !/@/.test(p) && !IFSC.test(p)).join(' '), channel: 'upi', vpa: vpaAny && vpaAny.toLowerCase() };
    }
    const vi = parts.findIndex((p) => /@[a-z]/i.test(p));
    if (vi > 0) {
      const name = parts.slice(0, vi).join(' ');
      const rest = parts.slice(vi + 1).filter((p) => !IFSC.test(p) && !/^\d{9,}$/.test(p));
      return { ...out, name, vpa: parts[vi].toLowerCase(), note: rest.join(' '), channel: 'upi' };
    }
    return { ...out, name: parts[0], note: parts.slice(1).join(' '), channel: 'upi' };
  }
  if ((m = /^POS\s+\S*\d{4}\S*\s+(.+?)(\s+POS\s+DEBIT)?$/i.exec(d))) return { ...out, name: m[1].replace(/\s+(MUMBAI|BANGALORE|BENGALURU|DELHI|GURGAON|PUNE|CHENNAI|HYDERABAD|KORAMANGALA|NOIDA)$/i, ''), channel: 'card' };
  if ((m = /^(?:ACH|NACH|ECS)\s*[DC]?\s*-\s*(.+?)(?:-([A-Z0-9 ]+))?$/i.exec(d))) return { ...out, name: m[1], note: m[2] || '', channel: 'auto' };
  if ((m = /^NEFT\s*(?:CR|DR)?\s*-\s*([A-Z]{4}0\w{6})-(.+?)-(.+)$/i.exec(d))) return { ...out, name: m[2], note: m[3], channel: 'neft' };
  if ((m = /^RTGS\s*(?:CR|DR)?\s*-\s*([A-Z]{4}0\w{6})-(.+?)-(.+)$/i.exec(d))) return { ...out, name: m[2], note: m[3], channel: 'neft' };
  if ((m = /^(IMPS|RTGS)[-\s](?:\d+-)?(.+?)-(.*)$/i.exec(d))) return { ...out, name: m[2], note: m[3], channel: 'imps' };
  if (/^(ATW|ATM|NWD|EAW)\b/i.test(d)) return { ...out, name: 'ATM cash', channel: 'atm' };
  return out;
}

function canonical(name, match) {
  const t = ' ' + norm(name) + ' ';
  const sq = t.replace(/ /g, '');
  for (const [k, label, ks] of BRANDS_SQ) if (t.includes(' ' + k + ' ') || sq.includes(ks)) return label;
  if (match && /^(Food delivery|Groceries|Travel & cabs|Subscriptions)$/.test(match.cat)) {
    for (const [k, label] of BRANDS) if (k === match.kw) return label;
  }
  let n = cleanName(name).replace(/[.,]/g, ' ')
    .replace(/\b([A-Za-z]{3,}?)(pvt|private|ltd|limited)\b/gi, '$1 ') // words glued at a wrap: "MOTORSPVT"
    .replace(/\b(pvt|private|ltd|limited|llp|inc|india|systems|designs|marketplace|technologies|retail|services|solutions)\b/gi, ' ');
  n = n.replace(/\s+/g, ' ').trim();
  return n ? title(n) : 'Unknown';
}

const isPersonName = (name) => {
  const n = cleanName(name);
  if (!n || BUSINESS_WORDS.test(n)) return false;
  const words = n.split(' ');
  return words.length >= 2 && words.length <= 4 && words.every((w) => /^[A-Za-z.]+$/.test(w));
};

/**
 * @param {Array} txns parsed transactions
 * @param {object} dict from buildDictionary
 * @param {{holder?: string}} meta
 */
export function analyze(txns, dict, meta = {}) {
  const holder = meta.holder ? norm(meta.holder) : null;
  const holderRe = holder && holder.length >= 5 ? new RegExp(`\\b${holder}\\b`, 'g') : null;
  const T = txns.map((t, i) => ({ ...t, i }));
  const memo = new Map(); // same payee + note -> same category (big statements repeat payees a lot)
  // ---- classify every row
  for (const t of T) {
    const p = parseNarration(t.desc);
    t.party = p;
    const text = `${p.name} ${p.note} ${p.vpa ? p.vpa.split('@')[0] : ''}`;
    // NEFT/IMPS/RTGS: match on the payee + note only, so the words "NEFT"/"IMPS" and the
    // account holder's own name (always in the narration) do not decide the category.
    let fullText = p.channel === 'other' ? `${t.desc}` : text;
    if (holderRe) fullText = norm(fullText).replace(holderRe, ' ');
    const mk = fullText + '|' + p.name;
    let match = memo.has(mk) ? memo.get(mk) : (memo.set(mk, matchCategory(dict, fullText, p.name)), memo.get(mk));
    const personVpa = p.vpa ? dict.personRe.test(p.vpa) : false;
    const merchantVpa = p.vpa ? dict.merchantHints.some((re) => re.test(p.vpa)) : false;
    const looksPerson = (personVpa && !BUSINESS_WORDS.test(p.name)) || (!merchantVpa && isPersonName(p.name));
    // Own account: the counterparty IS the holder (bank narrations always carry the holder's name
    // somewhere, e.g. NEFT credits from a client, so the whole narration is not enough).
    const pn = norm(p.name);
    const own = (holder && pn && (pn.includes(holder) || (pn.split(' ').length >= 2 && holder.includes(pn))))
      || /\b(own account|own a\/?c|self transfer|to self)\b/i.test(t.desc) || / self$/i.test(norm(t.desc));
    t.merchant = canonical(p.name, match);
    // A known brand that only a squashed or odd spelling found ("SWIGGYFOOD"): take the brand's category.
    if (!match && BRAND_KEY.has(t.merchant)) match = matchCategory(dict, BRAND_KEY.get(t.merchant), BRAND_KEY.get(t.merchant)) || match;

    if (t.status === 'failed') { t.kind = 'failed'; continue; }
    if (t.dir === 'in') {
      if (p.reversal || /\b(reversal|reversed|failed txn|failed)\b/i.test(t.desc)) { t.kind = 'reversal'; continue; }
      if (p.refund || match?.cat === 'Refunds' || /\b(refund(ed)?|cash ?back|chargeback)\b/i.test(t.desc)) { t.kind = 'refund'; t.category = 'Refunds'; continue; }
      if (match?.cat === 'Salary/Income' && !match.weak) { t.kind = 'income'; t.category = 'Salary/Income'; t.salary = /sal(ary)?|payroll|wages|stipend/i.test(t.desc); continue; }
      if (own) { t.kind = 'own'; continue; }
      if (looksPerson || (match?.cat === 'Transfers to people' && !BUSINESS_WORDS.test(p.name))) { t.kind = 'people-in'; t.category = 'Received from people'; t.merchant = title(cleanName(p.name)); continue; }
      t.kind = 'income'; t.category = 'Other income';
      continue;
    }
    // money out
    if (own && match?.cat !== 'Rent') { t.kind = 'own'; continue; }
    t.kind = 'spend';
    let cat = match && !(match.weak && match.cat === 'Transfers to people' && !looksPerson) ? match.cat : null;
    if (cat === 'Salary/Income' || cat === 'Refunds') cat = null;
    const sub = matchSubscription(dict, `${p.name} ${p.note}`);
    if (sub && !BILL_SUBS.has(sub)) { t.subLabel = sub; cat = 'Subscriptions'; }
    if (!cat || cat === 'Transfers to people') {
      if (t.amount < 200 && (looksPerson || !cat || cat === 'Transfers to people')) cat = 'Small payments';
      else if (looksPerson || cat === 'Transfers to people') { cat = 'Transfers to people'; t.merchant = title(cleanName(p.name)); }
      else cat = cat || 'Other';
    }
    t.category = cat;
  }
  // ---- failed payments: pair each reversal with the debit it cancels
  for (const r of T.filter((t) => t.kind === 'reversal')) {
    const cand = (t) => t.kind === 'spend' && !t.paired && t.dir === 'out' && Math.abs(t.amount - r.amount) < 0.01 && Math.abs(new Date(t.date) - new Date(r.date)) <= 3 * 864e5;
    const d = T.find((t) => cand(t) && t.merchant === r.merchant) || T.find(cand);
    if (d) { d.kind = 'failed'; d.paired = true; r.kind = 'failed'; }
    else { r.kind = 'refund'; r.category = 'Refunds'; }
  }
  // ---- likely rent: one big payment to a person early in the month, when no rent was named
  if (!T.some((t) => t.category === 'Rent')) {
    const cands = T.filter((t) => t.kind === 'spend' && t.category === 'Transfers to people' && t.amount >= 8000 && +t.date.slice(8) <= 10);
    const byMonth = {};
    for (const c of cands) { const k = c.date.slice(0, 7); if (!byMonth[k] || c.amount > byMonth[k].amount) byMonth[k] = c; }
    for (const c of Object.values(byMonth)) { c.category = 'Rent'; c.guessed = true; }
  }
  // ---- salary fallback: biggest credit if nothing said "salary"
  if (!T.some((t) => t.salary)) {
    const big = T.filter((t) => t.kind === 'income' && t.amount >= 10000).sort((a, b) => b.amount - a.amount)[0];
    if (big) { big.salary = true; big.guessedSalary = true; }
  }

  // ---- totals
  const dates = T.map((t) => t.date).sort();
  const from = dates[0], to = dates[dates.length - 1];
  const spanDays = from ? (new Date(to) - new Date(from)) / 864e5 + 1 : 30;
  const months = Math.max(1, Math.round(spanDays / 30.4));
  const monthsF = Math.max(1, spanDays / 30.44); // for per-month rates (a 45-day statement is 1.5 months, not 1)
  const sum = (arr) => r2(arr.reduce((s, t) => s + t.amount, 0));
  const spendT = T.filter((t) => t.kind === 'spend');
  const R = {
    from, to, months, monthsF, spanDays,
    rows: T.length,
    rawIn: sum(T.filter((t) => t.dir === 'in')),
    rawOut: sum(T.filter((t) => t.dir === 'out')),
    salary: sum(T.filter((t) => t.salary)),
    otherIncome: sum(T.filter((t) => t.kind === 'income' && !t.salary)),
    receivedFromPeople: sum(T.filter((t) => t.kind === 'people-in')),
    refunds: sum(T.filter((t) => t.kind === 'refund')),
    ownTransfers: sum(T.filter((t) => t.kind === 'own')),
    failedIgnored: T.filter((t) => t.kind === 'failed').length,
    spend: sum(spendT),
    salaryGuessed: T.some((t) => t.guessedSalary),
    rentGuessed: T.some((t) => t.guessed),
  };
  R.moneyIn = r2(R.salary + R.otherIncome + R.receivedFromPeople);
  R.left = r2(R.moneyIn - R.spend);

  const group = (arr, key) => {
    const g = new Map();
    for (const t of arr) {
      const k = key(t);
      const e = g.get(k) || { name: k, total: 0, count: 0, items: [] };
      e.total = r2(e.total + t.amount); e.count++; e.items.push(t);
      g.set(k, e);
    }
    return [...g.values()].sort((a, b) => b.total - a.total);
  };
  R.categories = group(spendT, (t) => t.category).map((c) => ({ name: c.name, total: c.total, count: c.count, share: R.spend ? c.total / R.spend : 0 }));
  R.categoryMap = Object.fromEntries(R.categories.map((c) => [c.name, c.total]));
  R.foodDelivery = R.categoryMap['Food delivery'] || 0;
  R.groceries = R.categoryMap['Groceries'] || 0;
  R.foodOrders = spendT.filter((t) => t.category === 'Food delivery').length;
  R.groceryOrders = spendT.filter((t) => t.category === 'Groceries').length;
  R.foodBrands = group(spendT.filter((t) => t.category === 'Food delivery'), (t) => t.merchant).map((g) => ({ name: g.name, total: g.total, count: g.count }));
  R.groceryBrands = group(spendT.filter((t) => t.category === 'Groceries'), (t) => t.merchant).map((g) => ({ name: g.name, total: g.total, count: g.count }));
  R.topMerchants = group(spendT.filter((t) => !NOT_MERCHANT.has(t.category)), (t) => t.merchant).slice(0, 5).map((g) => ({ name: g.name, total: g.total, count: g.count, category: g.items[0].category }));
  R.topPeople = group(spendT.filter((t) => t.category === 'Transfers to people'), (t) => t.merchant).slice(0, 3).map((g) => ({ name: g.name, total: g.total, count: g.count }));

  // small leaks
  const leaks = spendT.filter((t) => t.amount < SMALL_LEAK_MAX && !NOT_LEAK.has(t.category));
  R.smallLeaks = { count: leaks.length, total: sum(leaks), perDay: r2(sum(leaks) / spanDays), amounts: leaks.map((t) => t.amount) };

  // subscriptions: known names + repeating same-amount monthly charges
  const subs = new Map();
  for (const t of spendT.filter((t) => t.category === 'Subscriptions' || t.subLabel)) {
    const e = subs.get(t.merchant) || { name: t.merchant, label: t.subLabel, total: 0, count: 0, amounts: [], dates: [], months: new Set() };
    e.total = r2(e.total + t.amount); e.count++; e.amounts.push(t.amount); e.dates.push(t.date); e.months.add(t.date.slice(0, 7));
    subs.set(t.merchant, e);
  }
  // Same-amount monthly charges from an unknown merchant look like a subscription. People (rent to a
  // landlord, a maid, a friend), bills, shops and food apps are not subscriptions, so only 'Other' and
  // 'Entertainment' payments are looked at.
  for (const g of group(spendT.filter((t) => !subs.has(t.merchant) && REPEAT_CATS.has(t.category) && t.amount >= 50), (t) => t.merchant)) {
    if (g.count < 2) continue;
    const items = g.items.slice().sort((a, b) => a.date.localeCompare(b.date));
    const a0 = items[0].amount;
    const sameAmt = items.every((t) => Math.abs(t.amount - a0) / a0 <= 0.05);
    const gaps = items.slice(1).map((t, i) => (new Date(t.date) - new Date(items[i].date)) / 864e5);
    if (sameAmt && gaps.every((d) => d >= 25 && d <= 35)) {
      subs.set(g.name, { name: g.name, label: null, total: g.total, count: g.count, amounts: items.map((t) => t.amount), dates: items.map((t) => t.date), recurring: true });
    }
  }
  R.subscriptions = [...subs.values()].map((s) => {
    // known subscriptions: what one month costs = total over the months it was actually charged in
    const monthly = s.recurring ? r2(s.total / s.count) : r2(s.total / Math.max(1, s.months ? s.months.size : months));
    return { name: s.name, label: s.label, monthly, yearly: r2(monthly * 12), count: s.count, video: VIDEO_SUBS.has(s.label) || VIDEO_SUBS.has(s.name), recurring: !!s.recurring };
  }).sort((a, b) => b.monthly - a.monthly);
  R.subscriptionMonthly = r2(R.subscriptions.reduce((s, x) => s + x.monthly, 0));
  R.subscriptionYearly = r2(R.subscriptionMonthly * 12);

  // days
  const byDay = new Map();
  for (const t of spendT) if (!FIXED.has(t.category)) byDay.set(t.date, r2((byDay.get(t.date) || 0) + t.amount));
  R.days = [...byDay.entries()].map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date));
  const bd = R.days.slice().sort((a, b) => b.total - a.total)[0];
  R.biggestDay = bd ? { date: bd.date, total: bd.total, items: spendT.filter((t) => t.date === bd.date && !FIXED.has(t.category)).sort((a, b) => b.amount - a.amount).map((t) => ({ name: t.merchant, amount: t.amount, category: t.category })) } : null;

  R.actions = buildActions(R);
  R.txns = T;
  return R;
}

const round100 = (n) => Math.round(n / 100) * 100;

function buildActions(R) {
  const A = [];
  const m = R.monthsF;
  if (R.foodDelivery / m >= 1500 && R.foodOrders >= 4) {
    const names = R.foodBrands.slice(0, 2).map((b) => b.name).join(' + ');
    A.push({ id: 'food', title: `Order from ${names} half as often`,
      detail: `${R.foodOrders} orders, about ₹${Math.round(R.foodDelivery / R.foodOrders).toLocaleString('en-IN')} each. Cook or carry lunch on the other half.`,
      save: round100((R.foodDelivery / m) * 0.5 * 12) });
  }
  const video = R.subscriptions.filter((s) => s.video);
  if (video.length >= 2) {
    const keep = video.slice().sort((a, b) => b.monthly - a.monthly)[0];
    const drop = video.filter((s) => s !== keep);
    A.push({ id: 'subs', title: `Keep 1 of your ${video.length} video apps`,
      detail: `You pay for ${video.map((s) => s.name).join(', ')}. Keep the one you watch most.`,
      save: round100(drop.reduce((s, x) => s + x.monthly, 0) * 12) });
  } else if (R.subscriptions.length) {
    const s = R.subscriptions[0];
    A.push({ id: 'subs', title: `Still using ${s.name}?`, detail: `It costs ₹${Math.round(s.monthly).toLocaleString('en-IN')} a month. Cancel it if you forgot it was running.`, save: round100(s.yearly) });
  }
  if (R.smallLeaks.count >= 15) {
    A.push({ id: 'leaks', title: 'Skip 1 in 3 tiny UPI payments',
      detail: `${R.smallLeaks.count} payments under ₹${SMALL_LEAK_MAX} added up to ₹${Math.round(R.smallLeaks.total).toLocaleString('en-IN')}.`,
      save: round100((R.smallLeaks.total / m / 3) * 12) });
  }
  const cabs = R.categoryMap['Travel & cabs'] || 0;
  if (A.length < 3 && cabs / m >= 2500) A.push({ id: 'cabs', title: 'Swap 1 in 4 cab rides for metro or bus', detail: `Cabs cost ₹${Math.round(cabs / m).toLocaleString('en-IN')} a month.`, save: round100((cabs / m) * 0.25 * 12) });
  const shop = R.categoryMap['Shopping'] || 0;
  if (A.length < 3 && shop / m >= 3000) A.push({ id: 'shop', title: 'Wait 48 hours before online orders', detail: `Shopping apps took ₹${Math.round(shop / m).toLocaleString('en-IN')} a month.`, save: round100((shop / m) * 0.25 * 12) });
  return A.filter((a) => a.save >= 500).sort((a, b) => b.save - a.save).slice(0, 3);
}
