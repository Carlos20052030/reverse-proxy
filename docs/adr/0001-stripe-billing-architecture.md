# ADR 0001: Stripe-Based Billing Architecture

**Date**: 2026-11-01
**Status**: Accepted
**Context**: `billing`

---

## Context

Nuntix needs to become a commercial SaaS with two tiers (Free, Pro). We must:
- Gate features (webhook count, request volume, retention) by plan
- Accept self-serve upgrades via Stripe Checkout
- Enforce quotas in the hot path (webhook delivery) with minimal latency
- Keep local subscription state in sync with Stripe via webhooks

---

## Decision

### 1. Plan Model
- Two immutable Plans: `free`, `pro`
- Quotas stored in code/config (not DB) — change = deploy
- Pro priced at **R$ 49,00/mo (BRL)** and **$19,00/mo (USD)** via separate Stripe Price IDs
- Stripe Tax enabled globally (`tax_behavior=exclusive`)

### 2. Subscription Lifecycle
| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create Stripe Customer if needed, link to User, provision Pro |
| `invoice.payment_succeeded` | Extend `current_period_end`, reset quota window |
| `invoice.payment_failed` | Mark `past_due` (Stripe retries automatically) |
| `customer.subscription.deleted` | If `cancel_at_period_end=true`: keep Pro until period end, then downgrade. If `false`: immediate downgrade. |

**No trials**. No `trialing` state in v1.

### 3. Local State (Postgres)
```sql
-- users table additions
stripe_customer_id   TEXT UNIQUE NULL,
plan                 TEXT NOT NULL DEFAULT 'free',
subscription_status  TEXT NOT NULL DEFAULT 'none',
subscription_period_end TIMESTAMPTZ NULL,
```

Denormalized for **zero-latency reads** on hot path. Updated only by webhook handler.

### 4. Quota Enforcement
- **Webhook count**: checked at create time (synchronous DB read — cheap, rare)
- **Request count**: in-memory counter per user, async flush to DB (~10s)
  - Counter keyed by `user_id`
  - Window = `[subscription_period_start, subscription_period_end)`
  - On restart: rebuild from `delivery_attempts` in current window
- **Hard block**: `429` (requests) / `403` (webhook create) with upgrade CTA
- **Retention**: daily cron purges `delivery_attempts` older than plan's `retention_days`

### 5. Webhook Delivery Retry
- **Exponential backoff, 5 attempts**: 1min, 5min, 15min, 1h, 6h
- Each retry = new Delivery Attempt = counts toward quota
- After 5 failures: mark delivery as `failed`, stop retrying

### 6. Stripe Webhook Handling (extended)
- Endpoint: `POST /api/billing/stripe-webhook`
- Verification: `stripe.WebhookConstructEvent` with `STRIPE_WEBHOOK_SECRET` from env
- Idempotency: `stripe_events` table with `event_id` unique index
- Processing: synchronous, best-effort; log full payload for audit
- Retries: Stripe handles (exponential backoff); we return 200 only on success
- **Additional events**: `charge.refunded`, `charge.dispute.created` → treat as cancellation (downgrade at period end)

### 7. Usage API (Frontend)
```
GET /api/billing/usage
```
Returns current period usage vs limits, plan, period_end. Single REST endpoint, cacheable.

### 8. Past Due Behavior
- `invoice.payment_failed` → mark `past_due`, **keep full Pro access**
- Stripe retries ~3 times over ~1 week
- If all retries fail → `customer.subscription.deleted` → downgrade at period end

### 9. Downgrade Handling (Excess Webhooks)
- On downgrade to Free: first 3 webhooks stay `active`, rest → `disabled`
- Disabled webhooks return 404 on delivery; user can re-enable on upgrade
- Preserves config, zero data loss

### 10. Local Dev / Testing
- **Env var**: `STRIPE_WEBHOOK_SECRET` in `.env`
- **Local webhook testing**: `stripe listen --forward-to localhost:8080/api/billing/stripe-webhook`
- **Unit tests**: Mock Stripe client + webhook handler (no network)
- **Test fixtures**: Pre-recorded Stripe event payloads for each event type

### 5. Stripe Webhook Handling
- Endpoint: `POST /api/billing/stripe-webhook`
- Verification: `stripe.WebhookConstructEvent` with signing secret
- Idempotency: `stripe_events` table with `event_id` unique index
- Processing: synchronous, best-effort; log full payload for audit
- Retries: Stripe handles (exponential backoff); we return 200 only on success

### 6. Checkout Flow
```
Frontend: GET /api/billing/checkout?price_id=price_pro_brl
Backend:  Create Checkout Session (mode=subscription)
          Return session.url
Frontend: Redirect to session.url
Stripe:   User pays → webhook → backend provisions
```

Price ID selected by user locale/country (BRL for Brazil, USD otherwise).

### 7. Migration (Existing Users)
- All existing users → `plan='free'`, `stripe_customer_id=NULL`
- No enforcement until **first full billing cycle** after billing launch
- Communication: in-app banner + email before enforcement starts

---

## Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Query Stripe API on every request | Latency, rate limits, single point of failure |
| Redis for request counters | Extra infrastructure for MVP; in-memory + async flush sufficient |
| Calendar-month quota window | Misaligns with Stripe billing; user confusion |
| Soft limits + overage billing | Complexity; hard block is clearer UX |
| Free trial (14 days) | Adds `trialing` state, webhook complexity; can add later |
| Usage-based billing (per-request) | Predictability matters more than granularity for this product |

---

## Consequences

### Positive
- **Zero-latency quota checks** on hot path (in-memory)
- **Single source of truth** for subscription state (Stripe) with fast local mirror
- **Audit trail** via `stripe_events` table
- **Standard SaaS pattern** — Stripe Checkout + webhooks is well-understood

### Negative / Risks
- **Slight overage possible** (in-memory counter flush delay) — mitigated by nightly reconciliation
- **Webhook processing failure** → local state drifts — mitigated by idempotency + manual reconciliation script
- **Stripe dependency** — vendor lock-in (acceptable; Stripe is industry standard)

---

## Implementation Checklist

- [ ] `users` table migrations (stripe_customer_id, plan, subscription_status, subscription_period_end)
- [ ] `stripe_events` table migration
- [ ] Stripe Price IDs created in Dashboard (Pro BRL, Pro USD)
- [ ] Stripe Webhook endpoint registered (4 events)
- [ ] `QuotaService` with in-memory counter + async flush
- [ ] Webhook delivery middleware: quota check before HTTP call
- [ ] Webhook create endpoint: quota check
- [ ] Checkout session endpoint
- [ ] Stripe webhook handler (4 events)
- [ ] Daily retention cron job
- [ ] Frontend: "Upgrade" button → Checkout redirect
- [ ] Frontend: Usage dashboard (current period usage vs limits)
- [ ] Migration script for existing users
- [ ] Tests: quota enforcement, webhook idempotency, state transitions