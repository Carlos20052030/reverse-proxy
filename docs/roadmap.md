# Roadmap — Nuntix Reverse Proxy

Based on [scope.md](scope.md) and current codebase status.

---

## ✅ Completed Phases

### Phase 1: Core Proxy
| Feature | Status | Implementation |
|---------|--------|----------------|
| Host-based Routing (Postgres) | ✅ Done | `PostgresResolver` queries `tenants` table |
| Request/Response Streaming | ✅ Done | `httputil.ReverseProxy` streams by default |
| Header Hygiene (Hop-by-hop) | ✅ Done | Go stdlib strips RFC 7230 §6.1 headers |
| Forwarded Headers | ✅ Done | `pr.SetXForwarded()` in Rewrite |
| Secure Client IP Extraction | ✅ Done | From `RemoteAddr` only, ignores `X-Forwarded-For` |
| Error Semantics (502 vs 504) | ✅ Done | `ErrorHandler` distinguishes timeout vs connection error |
| In-Memory Rate Limiting | ✅ Done | Token Bucket (`InMemoryRateLimiter`) |
| Structured Logging | ✅ Done | `log/slog` JSON handler |
| Basic Metrics (`/metrics`) | ✅ Done | Prometheus-compatible counter |

### Phase 2: Security & Infrastructure
| Feature | Status | Implementation |
|---------|--------|----------------|
| TLS Termination (Let's Encrypt) | ✅ Done | `autocert.Manager` with HostWhitelist |
| HTTP→HTTPS Redirect + ACME | ✅ Done | Port 80 handler |
| Single-Container Deployment | ✅ Done | Go binary serves React `frontend/dist` |

### Phase 2.5: Full-Stack Monorepo (V1.1)
| Feature | Status | Implementation |
|---------|--------|----------------|
| React Frontend (Vite + TS + Tailwind v4) | ✅ Done | `frontend/` served by Go |
| Login Page (JWT) | ✅ Done | `/auth/` routes to Bookmarks API |
| Register Page | ✅ Done | `/auth/register` |
| Bookmarks Dashboard UI | ✅ Done | CRUD via `/bookmarks` routes |
| API Keys Dashboard UI | ✅ Done | `/api-keys` routes to Bookmarks API |

### Phase 3: API Key Authentication (NEW — Just Completed)
| Feature | Status | Implementation |
|---------|--------|----------------|
| API Key Middleware (Bookmarks API) | ✅ Done | `internal/middleware/api_key.go` |
| X-API-Key Header Validation | ✅ Done | HMAC validation, user lookup |
| Proxy Pass-through for X-API-Key | ✅ Done | Verified by `TestProxy_PassesCustomHeaders` |
| `/api/me` Endpoint | ✅ Done | Returns authenticated user_id |

---

## 🚧 Next Steps (Priority Order)

### 1. Webhook Dashboard (React Frontend)
**Goal:** Allow users to manage webhooks from the dashboard.

| Task | Description |
|------|-------------|
| Webhook List Page | Display registered webhooks (endpoint, events, status) |
| Create Webhook Modal | Form: target URL, event types, secret |
| Delete Webhook | Confirmation + API call to Webhook Dispatcher |
| Webhook Logs/History | Show delivery attempts, status codes, retries |
| Test Webhook Button | Trigger a test payload to verify endpoint |

**Backend dependency:** Webhook Dispatcher API (already running on port 8082)

---

### 2. Dashboard Metrics & Observability
**Goal:** Visualize proxy and service health in the dashboard.

| Task | Description |
|------|-------------|
| Request Rate Chart | Requests/sec over time (from `/metrics`) |
| Latency Percentiles | p50, p95, p99 from upstream responses |
| Error Rate | 5xx / total requests |
| Rate Limit Hits | 429 responses per tenant/IP |
| TLS Cert Expiry | Days until Let's Encrypt renewal |
| Upstream Health | Green/red indicators for Bookmarks API, Webhook Dispatcher |

**Implementation approach:**
- Extend `/metrics` with more granular data (per-tenant, per-route)
- Add `/metrics` scraping in React (polling or SSE)
- Use Recharts or similar for visualizations

---

### 3. Distributed Rate Limiting (Redis-backed)
**Goal:** Share rate limit state across multiple proxy instances.

| Task | Description |
|------|-------------|
| RedisRateLimiter | Implement `RateLimiter` interface backed by Redis |
| Lua Script | Atomic token bucket operations in Redis |
| Config Flag | Switch between in-memory and Redis via env var |
| Fallback | Graceful degradation if Redis unavailable |

---

### 4. Hot Reload / Dynamic Tenant Updates
**Goal:** Update routing without proxy restart.

| Task | Description |
|------|-------------|
| Tenant Watcher | Listen for Postgres `NOTIFY` on `tenants` changes |
| In-Memory Cache | Refresh resolver cache on change |
| Zero-Downtime | No request drops during reload |

---

### 5. Multi-Tenant Provisioning API
**Goal:** Allow users to register their own subdomains.

| Task | Description |
|------|-------------|
| POST /admin/tenants | Create new tenant (host → target_url) |
| DNS Validation | Verify user owns domain before provisioning |
| Wildcard Certs | Extend autocert for dynamic subdomains |

---

## 📅 Suggested Timeline

| Sprint | Focus |
|--------|-------|
| **Sprint 1** | Webhook Dashboard (UI + API integration) |
| **Sprint 2** | Dashboard Metrics (charts, polling, `/metrics` expansion) |
| **Sprint 3** | Distributed Rate Limiting (Redis) |
| **Sprint 4** | Hot Reload + Provisioning API |

---

## Architecture Principles to Maintain

1. **Resolver Interface** — Keep routing logic pluggable
2. **RateLimiter Interface** — Swap implementations without changing proxy
3. **Dependency Injection** — `main` wires concretes; `Proxy` depends on interfaces
4. **Structured Logging** — Every request logged as JSON
5. **Security First** — Never trust client headers for identity
6. **Single Binary** — Go serves frontend + API gateway

---

## Related Documents
- [Architecture](architecture.md) — Detailed request flow and components
- [Scope](scope.md) — Project boundaries and MoSCoW prioritization
- [Deployment](deployment.md) — Docker Compose, environment, VPS setup