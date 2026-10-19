
# Project 4: Reverse Proxy

## Problem & Use Case

I run three Go services in production on a single Hetzner VPS (CloudMonitor, Bookmarks API, Webhook Dispatcher). Each listens on its own port, all exposed via the same machine. I want a single entry point that routes by hostname, enforces per-IP rate limits, and gives me one place to add request logging and timeouts — without nginx.

**Success Criteria:**
- Routes to all three services by `Host` header.
- Sustains normal traffic with minimal added latency.
- Blocks the Nth+1 request per IP per window with a 429.
- `go test -race ./...` green; zero third-party dependencies.

## Product Vision & Phasing

### Vision
This reverse proxy is the entry point of a commercial product: a multi-tenant SaaS where each customer gets an isolated namespace under a subdomain (e.g., `acme.<product-domain>`). The proxy makes multi-tenancy possible because the hostname is the tenant identity.

### Principle: extensible, not complete
Phase 1 code must be product-extensible, not product-complete. Extensibility means placing seams (interfaces, config injection points) exactly where Phase 2 is already known to plug in, and writing tests that protect those seams. It does NOT mean implementing Phase 2 features early, and it does NOT authorize speculative abstraction.

### Phase 1 — the reverse proxy (this project)
- Routes by `Host` header from an injectable config.
- Streams requests/responses (no buffering).
- Sets `X-Forwarded-For` / `-Proto` / `-Host` correctly.
- Strips hop-by-hop headers (RFC 7230 §6.1).
- Per-IP rate limiting, in-memory, single-process.
- Returns 502 / 504 with correct semantics.
- Structured JSON logs via `log/slog`.
- Single VPS, single process, no persistence.
- Zero third-party dependencies.

### Phase 2 — Multi-tenant & Distribution
- Tenant provisioning (API/CLI to register subdomains).
- Tenant registry (Postgres, reusing Bookmarks stack).
- Per-tenant rate limiting `(tenant, client-ip)`.
- Distributed rate limiting (Redis).
- TLS termination (ACME).
- Config reload without restart.

### Phase 3 — Commercial surface
- Quotas and commercial rate-limit tiers.
- Usage metering for billing.
- Admin dashboard.
- Multi-node proxy deployment.

## Core Concepts

### 1. Upstream
The backend HTTP server receiving a forwarded request. The proxy is configured with named upstreams (hostname -> target URL). Configuration is injected so tests can bind `httptest.Server` on random ports.

### 2. Inbound vs Outbound request
Two distinct `*http.Request` values. The outbound request must set `Method`, `URL.Path`, `URL.Scheme`, `URL.Host`, stream `Body`, clone `Header` (minus hop-by-hop), and preserve `Host`. Mutating inbound for outbound leaks state.

### 3. Hop-by-hop headers
Per RFC 7230 §6.1, strip: `Connection`, `Keep-Alive`, `Proxy-Authenticate`, `Proxy-Authorization`, `TE`, `Trailer`, `Transfer-Encoding`, `Upgrade`. Also strip headers named in `Connection`. Strip from requests before forwarding, and from responses before writing.

### 4. Client IP extraction
Derived exclusively from `RemoteAddr`. Ignore inbound `X-Forwarded-For` to prevent spoofing. (Open Question for Phase 2: Trusted CIDRs + rightmost-untrusted resolution).

### 5. Forwarded headers
Append resolved IP to `X-Forwarded-For`. Set `X-Forwarded-Proto` and `X-Forwarded-Host`. Do not trust inbound `X-Forwarded-Proto/Host` from untrusted peers.

### 6. 502 vs 504
- **502 Bad Gateway:** Upstream reached but malformed response, OR connection refused/DNS failure.
- **504 Gateway Timeout:** Connection established but upstream did not respond within timeout.
  Surface via `http.Error`. Timeout is injectable.

### 7. Tenant
In Phase 1, implicitly defined by the `Host` header. No provisioning or persistence. The rate limiter key is an opaque string (Phase 1: `ip`, Phase 2: `tenant_id + ":" + ip`).

## Architecture Principles

### 1. Resolver
```go
type Resolver interface {
    Resolve(host string) (*url.URL, error)
}
```
Phase 1: in-memory map from config. Phase 2: Postgres.

### 2. RateLimiter
```go
type RateLimiter interface {
    Allow(ctx context.Context, key string) bool
}
```
Phase 1: in-memory token bucket. Phase 2: Redis.

### 3. Logger
`log/slog` with JSON handler. Injected, never global. Includes `request_id`, `method`, `path`, `status`, `duration_ms`, `tenant`.

### 4. Config Source
Injected, never read from env inside core logic.
```go
type Config struct {
    ListenAddr string
    Upstreams  map[string]string
    Timeout    time.Duration
}
```

### Dependency Injection Rule
`main` wires concrete implementations. `NewProxy(cfg Config, resolver Resolver, limiter RateLimiter, logger *slog.Logger) *Proxy`.

## Feature Scope (MoSCoW)

### Must Have (Phase 1)
- `[P1]` Host-based Routing.
- `[P1]` Request/Response Streaming.
- `[P1]` Header Hygiene (Hop-by-hop).
- `[P1]` Forwarded Headers.
- `[P1]` Secure Client IP Extraction.
- `[P1]` Error Semantics (502 vs 504).
- `[P1]` In-Memory Rate Limiting (opaque key).
- `[P1]` Structured Logging (`log/slog`).
- `[P1]` Basic Metrics (`/metrics`).

### Should Have
- `[P1]` JSON Config Parsing.
- `[P2]` TLS Termination.
- `[P2]` Distributed Rate Limiting.
- `[P2]` Tenant Registry.
- `[P2]` Hot Reload.

### Could Have
- `[P3]` Usage Metering.
- `[P3]` Admin Dashboard.
- `[P3]` Response Caching.

### Won't Have (Explicit Non-Goals)
- `[P1]` Load Balancing (single upstream).
- `[P1]` Trusting `X-Forwarded-For` for client IP.
- `[P1]` WebSocket Proxying.
```

---

### 2. Preparando o terreno para o código

Agora que o escopo está fechado, vamos preparar as pastas para o nosso primeiro teste (TDD). No terminal, dentro de `~/projetos/reverse-proxy`, rode:

```bash
mkdir -p internal/proxy cmd/proxy
touch internal/proxy/resolver_test.go
touch internal/proxy/resolver.go
```