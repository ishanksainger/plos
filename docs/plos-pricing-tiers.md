# PLOS — Free vs Pro vs Family (pricing & feature split)

**Status:** spec / not yet built. **Last updated:** 2026-06-02
**Canonical price source:** `/Volumes/DevSSD/dev/claude/plos_code_plan_v1.md` (Step M) + `plos_plan_review_v1.md` (Gap #5). This doc elaborates that table into an exact, build-ready feature split. If prices ever disagree, the plan doc wins.

---

## The one-line strategy

**Launch free. Build the Pro tier now so it's not a bolt-on later. Turn paid billing ON only once retention is proven (~50–100 weekly-active users + CSV import + WhatsApp shipped).** This is "Step M" in the code plan by design — *billing without retention is suicide*. Reward the earliest users with a founding-member deal.

At zero users today, **nothing is gated**. This spec is what the limits *become* when billing ships.

---

## The three tiers (canonical pricing)

| Plan | Price | One-liner |
|---|---|---|
| **Free** | ₹0 | The full daily habit. Generous enough to get hooked. |
| **Pro** | **₹299/mo** (₹2,870/yr — 20% off) | Unlimited everything + WhatsApp reminders. For the freelancer who lives in it. |
| **Family** | **₹499/mo** (₹4,790/yr — 20% off) | Pro + up to 5 shared logins + household permissions. For dual-income homes. |

> Indian SaaS sweet spot is ₹199–499/mo (Notion ₹/Todoist comparables). Annual-first — monthly churn is brutal in India. UPI autopay via the existing Razorpay account.

---

## Exact feature split

| Capability | Free | Pro | Family |
|---|---|---|---|
| **"Today" daily view** | ✓ | ✓ | ✓ |
| **Habits + streaks** (incl. streak-at-risk) | ✓ | ✓ | ✓ |
| **Search / ⌘K / dark mode** | ✓ | ✓ | ✓ |
| **Insights dashboard** | basic | full | full |
| **People (contacts)** | up to **3** | unlimited | unlimited |
| **Responsibilities** | up to **50** | unlimited | unlimited |
| **Notifications** | in-app + email | **+ WhatsApp** | + WhatsApp |
| **CSV / tracker import** | **1** import | unlimited | unlimited |
| **Data export (JSON/CSV)** | ✓ *(stays free — see note)* | ✓ | ✓ |
| **Shared logins** | 1 (just you) | 1 | up to **5** |
| **Household permissions** | — | — | ✓ |
| **Support** | community / email | priority email | priority email |

**The two limits that actually drive upgrades:** `3 People` + `50 Responsibilities`. These are chosen to fit the wedge — a freelancer tracking clients + bills + GST deadlines blows past 50 responsibilities quickly; a household tracking family members blows past 3 people. The pressure is intentional and on-strategy.

**Keep data export FREE.** It's a trust / data-portability signal (DPDP-aligned, matches the policy pages). Gating someone's own data out feels hostile and it's not where the money is.

---

## ⚠️ One real decision for you (not mine to make)

The plan puts **WhatsApp reminders entirely behind Pro**. But the review doc also says: *"If a freelancer misses a GST deadline because PLOS didn't WhatsApp them, you've broken the core promise."* Those slightly conflict.

**Options:**
- **A — Pro-only WhatsApp** (per the plan): cleanest monetization lever; risk is free users feel the core promise is paywalled.
- **B — Free gets *critical-deadline* WhatsApp only** (e.g., bill/GST due in 24h), Pro gets *all* WhatsApp (habit nudges, daily digest, custom): keeps the promise intact for everyone, still reserves the bulk of WhatsApp value for Pro. **My lean: B.**

Pick A or B before billing is built — it changes one guard.

---

## What "turn paid ON" actually requires (Step M build checklist)

Current code reality: `Subscription` model exists but only has `tier ("free"|"pro")` — no Family, no Razorpay fields, **no enforcement anywhere**. To ship billing:

- [ ] Expand `Subscription` model: `plan (free|pro|family)`, `razorpaySubscriptionId`, `status`, `billingCycle`, `currentPeriodEnd`; add `BillingEvent` audit table.
- [ ] Create the 3 plans in the **Razorpay Subscriptions** dashboard (note: Subscriptions API ≠ the one-time Orders API the trackers use — `@nis/razorpay-sdk` needs a subscriptions helper added).
- [ ] `POST /billing/subscribe` → Razorpay hosted-checkout short URL; `GET /billing/me`; `POST /billing/cancel`.
- [ ] Webhook handler (HMAC verify) for `subscription.*` events → update `Subscription`, emit `BillingEvent`.
- [ ] **Enforcement guards** on People-create, Responsibility-create, import endpoints (read the user's plan, block at the limit).
- [ ] Frontend: `PricingPage`, `LimitReachedModal` (fires on the 51st responsibility / 4th person), sidebar upgrade CTA for free users, "Pro" badges.

Rough size: ~3–4 hrs backend + ~2 hrs frontend. Owner today is tagged `cursor` (plos-backend), but it can move to `claude`.

---

## Founding-member offer (do this AT launch, costs nothing)

Everyone who signs up **before billing goes live** (or the first 100, whichever you prefer) gets **Pro free for life** — or a locked **₹149/mo lifetime** rate. They wouldn't have paid yet anyway, so it's not lost revenue; it buys loyalty, word-of-mouth, and testimonials, and creates urgency for everyone after.

---

## Trigger to flip billing on

All true before you build Step M:
1. **~50–100 weekly-active users** (not signups — people who come back).
2. **CSV import + WhatsApp reminders shipped** (Steps I–L) — the things Pro is *for*.
3. A handful of users **asking** for an unlimited/WhatsApp/Family feature.

Until then: free, founding-member offer live, and this spec sitting ready.
