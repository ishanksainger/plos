# PLOS — product context (living)

**Purpose:** Capture product intent and decisions from planning chats so Cursor / future you do not lose the thread. This is **not** the full feature spec; see `PL_PRODUCT_AND_ROADMAP.md` for shipped vs roadmap items.

**Last updated:** 2026-05-11

---

## 1. Who PLOS is for

- **Everyone** — PLOS is a **daily diary of life**: money, health, habits, family, admin, work, all in one place.
- **Work / freelancer / GST** sits **inside** that picture (a slice of life), **not** a separate “only for freelancers” product.

---

## 2. NIS Google Sheets vs PLOS (timing and link)

- **Sheets** (sold on Etsy / Gumroad / thenispace) ship **early** and bring **revenue + learning** about what people pay for.
- **PLOS** takes **longer** to build and grow users — that is normal.
- **Now:** Sheets and PLOS are **separate products**. No required technical link at launch.
- **Later (optional):** Offer a **one-time import** (or CSV / template) so sheet buyers can move into PLOS without retyping. **Live two-way sync** with Google Sheets is **not** an early goal unless you explicitly choose it later.

---

## 3. Default “home” experience (first screen)

- Recommended shape: **“Today”** = **priorities on top** (due / overdue / needs attention) **+ diary / life feel below** (timeline, notes, reflection — exact UI TBD).
- Reason: People need **clarity on what slipped** in seconds; the **story** of PLOS is still **life diary**, not a cold task-only app.

---

## 4. Account type: Solo, Family, Shared (and changing later)

**Requirement:** At signup (or onboarding), the user picks an **account type**. There must also be a way **later** (e.g. Settings) to **change account type**, with clear copy if the change affects sharing, invites, or data visibility.

| Type | Plain meaning (product intent) |
|------|--------------------------------|
| **Solo** | One primary person; data and responsibilities default to **private** to them. |
| **Family** | **Household** mode: spouse, kids, shared life admin. Expect shared or split visibility of responsibilities, people, and money “buckets” over time — **implementation detail comes later**; this flag tells the product how to grow. |
| **Shared** | **Collaboration outside the household**: co-founder, VA, accountant, etc. Controlled **invites and permissions** (who sees what) — **implementation detail comes later**; this flag tells the product how to grow. |

**Rules:**

- Choice is **user-visible** and **changeable** in Settings (not locked forever).
- Changing type may show a **short warning** (e.g. turning Family → Solo might affect shared items or invites — exact rules TBD when features ship).
- **Engineering note:** `User` (or workspace) model will eventually need a field like `accountType: 'solo' | 'family' | 'shared'` plus future tables for invites / roles. **Not implemented until a dedicated roadmap step** — this file records the **decision** first.

---

## 5. Billing

- **Razorpay / subscription billing** is intentionally **last** in the current build order; fields on `Subscription` may exist before the flow does.

---

## 6. Related docs

- **`PL_PRODUCT_AND_ROADMAP.md`** — what is built, technical notes, roadmap letters A–G, Google Docs OAuth notes.

---

*Update this file when product direction changes.*
