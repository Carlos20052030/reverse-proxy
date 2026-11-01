# Nuntix Billing Glossary

> **Context**: `billing` (SaaS subscription & quota enforcement)
> **Status**: Active — updated 2026-11-01

---

## Core Entities

### Plan
A named tier defining **quotas** and **features**. Exactly two plans exist:
- **Free** — 3 webhooks, 10,000 requests/period, 7-day retention
- **Pro** — 50 webhooks, 1,000,000 requests/period, 90-day retention, R$ 49/mo (BRL) / $19/mo (USD)

> **Invariant**: Plan quotas are **immutable** once created. New plans = new rows.

### Subscription
The **active commercial relationship** between a User and a Plan.
- `status`: `active` | `past_due` | `canceled` | `incomplete` | `trialing`
- `current_period_start` / `current_period_end` — anchored to Stripe billing cycle
- `cancel_at_period_end` — boolean; if true, access continues until `current_period_end` then downgrades to Free

> **Rule**: One Subscription per User (1:1). Multi-subscription not supported in v1.

### User
Application account. Holds:
- `stripe_customer_id` (nullable, set on first Checkout)
- `plan` (denormalized copy of Subscription.plan for fast reads)
- `subscription_status` (denormalized)
- `subscription_current_period_end` (denormalized)

> **Migration**: Pre-billing users have `NULL` stripe_customer_id, `plan = 'free'`, no enforcement until first full cycle.

### Webhook (Configured Endpoint)
**One user-configured HTTP endpoint** (URL + secret + headers). Counts toward the **webhook quota**.
- Free: max 3
- Pro: max 50

> **Not** the incoming HTTP request — that is a **Delivery Attempt**.

### Webhook State
- `active` — delivers normally
- `disabled` — exists but deliveries return 404; user can re-enable on upgrade
- On **downgrade to Free**: first 3 webhooks stay `active`, rest → `disabled` (preserves config, zero data loss)

### Delivery Attempt
**One HTTP request** sent to a user's Webhook endpoint (including retries).
- **Every attempt counts** toward the request quota (2xx, 4xx, 5xx, timeouts, retries).
- Quota window = **rolling 30 days** anchored to `subscription.current_period_start`.

### Delivery Retry Policy
**Exponential backoff, 5 attempts**: 1min, 5min, 15min, 1h, 6h.
- Each retry = new Delivery Attempt = counts toward quota.
- After 5 failures: mark delivery as `failed`, stop retrying.

### Quota
A **limit** tied to a Plan:
| Quota Type       | Free | Pro   | Enforcement |
|------------------|------|-------|-------------|
| `max_webhooks`   | 3    | 50    | Hard block on create (403) |
| `max_requests_per_period` | 10,000 | 1,000,000 | Hard block on delivery (429) |
| `retention_days` | 7    | 90    | Auto-purge deliveries older than N days |

> **Enforcement**: Synchronous check (in-memory cache + async DB flush). Slight overage possible; reconciled nightly.

### Usage API (Frontend)
`GET /api/billing/usage` →
```json
{
  "plan": "free|pro",
  "period_end": "2026-12-01T00:00:00Z",
  "requests": { "used": 8234, "limit": 10000 },
  "webhooks": { "used": 2, "limit": 3 }
}
```
- Single REST endpoint, cacheable (ETag/Last-Modified)
- No WebSocket — polling is sufficient for dashboard

### Billing Period
**Rolling 30-day window** = `[current_period_start, current_period_end)` from Stripe Subscription.
- Resets at each successful `invoice.payment_succeeded`.
- Not calendar month.

---

## Stripe Integration

### Stripe Customer
Stripe's customer record. Linked 1:1 to User via `users.stripe_customer_id`.
- Created lazily on first Checkout session.

### Price ID
Stripe Price object. Two per Plan (Pro only):
- `price_pro_brl` — R$ 49,00/mo, currency=brl, `tax_behavior=exclusive`
- `price_pro_usd` — $19,00/mo, currency=usd, `tax_behavior=exclusive`
- Free has no Price (no Checkout).

### Checkout Session
Stripe Checkout Session (`mode=subscription`) created by backend, returned to frontend.
- `success_url` / `cancel_url` point back to app.
- `subscription_data.trial_period_days` = **null** (no trial).

### Stripe Webhook Events (handled)
| Event | Purpose |
|-------|---------|
| `checkout.session.completed` | Provision subscription, set `stripe_customer_id`, grant Pro |
| `invoice.payment_succeeded` | Renew period, reset quota window, keep Pro |
| `invoice.payment_failed` | Mark `past_due`, **keep full Pro access** (Stripe retries ~3x over ~1 week) |
| `customer.subscription.deleted` | Downgrade to Free at `current_period_end` (or immediately if `cancel_at_period_end=false`) |
| `charge.refunded` / `charge.dispute.created` | Treat as cancellation → downgrade at `current_period_end` (consistent with `cancel_at_period_end`) |

### Idempotency Key
`stripe_event.id` (e.g., `evt_123...`). Stored in `stripe_events` table with unique constraint. Duplicate deliveries → no-op.

### Stripe Event (Audit)
Immutable log row: `event_id`, `type`, `payload_json`, `processed_at`, `success`. Retained indefinitely.

### Stripe Tax
Enabled globally. Prices use `tax_behavior=exclusive`. Tax calculated at Checkout/invoice time per customer address.

### Stripe Webhook Secret
Stored in `STRIPE_WEBHOOK_SECRET` env var (`.env` pattern).
- Verified via `stripe.WebhookConstructEvent` on every webhook request.
- Local dev: `stripe listen --forward-to localhost:8080/api/billing/stripe-webhook`

### Testing Strategy
- **Unit tests**: Mock Stripe client + webhook handler (no network)
- **Integration tests**: `stripe listen` CLI forwarding to local backend
- **Test fixtures**: Pre-recorded Stripe event payloads for each event type

---

## Enforcement & Metering

### Request Counter
In-memory counter per User: `requests_in_current_period`.
- Incremented on **every Delivery Attempt** (before HTTP call).
- Flushed to DB asynchronously (batch, ~10s interval).
- On startup: rebuild from `delivery_attempts` in current window.

### Quota Check
```go
func (s *QuotaService) CanDeliver(userID string) error {
    if user.Plan == "pro" { return nil }
    if user.RequestCount >= 10_000 { return ErrQuotaExceeded }
    return nil
}
```
Returns `429 Too Many Requests` with `Retry-After` header (seconds until period end).

### Webhook Creation Check
```go
func (s *QuotaService) CanCreateWebhook(userID string) error {
    if user.Plan == "pro" { return nil }
    if user.WebhookCount >= 3 { return ErrWebhookQuotaExceeded }
    return nil
}
```
Returns `403 Forbidden` with upgrade CTA.

---

## State Transitions (Subscription)

```
[incomplete] --(checkout.session.completed)--> [active]
[active] --(invoice.payment_failed)--> [past_due] --(payment_succeeded)--> [active]
[active] --(customer.subscription.deleted, cancel_at_period_end=true)--> [canceled] --(period_end)--> [free]
[active] --(customer.subscription.deleted, cancel_at_period_end=false)--> [free] (immediate)
[past_due] --(invoice.payment_failed xN)--> [canceled] --(period_end)--> [free]
```

> **Free** is not a Stripe status — it's the absence of an active Subscription.

---

## Retention & Cleanup

### Delivery Retention
Background job (daily):
```sql
DELETE FROM delivery_attempts
WHERE created_at < NOW() - INTERVAL '<retention_days> DAYS'
  AND user_id IN (SELECT id FROM users WHERE plan = 'free');
-- Pro: 90 days, Free: 7 days
```

### Stripe Events Retention
**Never deleted** — audit trail.