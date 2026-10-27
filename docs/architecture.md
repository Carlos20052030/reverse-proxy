# Architecture — Nuntix Reverse Proxy

This document describes the internal architecture of the Nuntix Reverse Proxy based on the actual codebase.

---

## High-Level Request Flow

```
Client Request (HTTPS)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ finalHandler (cmd/proxy/main.go)                            │
│  • Extracts Host header                                     │
│  • Routes to Proxy if host is api.nuntix.com.br or          │
│    webhooks.nuntix.com.br                                   │
│  • Otherwise serves React SPA from frontend/dist            │
└─────────────────────────────────────────────────────────────┘
         │
         ▼ (if API host)
┌─────────────────────────────────────────────────────────────┐
│ Proxy.ServeHTTP (internal/proxy/proxy.go)                   │
│  1. Increments request counter (atomic)                     │
│  2. Resolves upstream via Resolver interface                │
│  3. Extracts Client IP from RemoteAddr (secure)             │
│  4. Checks RateLimiter (Token Bucket per IP)                │
│  5. Configures httputil.ReverseProxy with timeout           │
│  6. Rewrites request:                                       │
│     - Sets target URL                                       │
│     - Preserves Host header                                 │
│     - Sets X-Forwarded-* headers                            │
│  7. Forwards to upstream                                    │
│  8. Logs structured JSON via log/slog                       │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Upstream Service (Bookmarks API, Webhook Dispatcher, etc.)  │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Resolver Interface (`internal/proxy/resolver.go`)

```go
type Resolver interface {
    Resolve(host string) (*url.URL, error)
}
```

**Purpose:** Abstracts the routing logic. The proxy doesn't know *how* hosts map to upstreams — it only asks the resolver.

#### MapResolver (Testing/Development)
- In-memory `map[string]string` of host → target URL
- Used in unit tests

#### PostgresResolver (`internal/proxy/resolver_pg.go`)
- **Production implementation**
- Queries the `tenants` table: `SELECT target_url FROM tenants WHERE host = $1`
- Returns parsed `*url.URL` or error
- **Database schema assumption:**
  ```sql
  CREATE TABLE tenants (
      host TEXT PRIMARY KEY,
      target_url TEXT NOT NULL
  );
  ```

---

### 2. Rate Limiter (`internal/proxy/ratelimit.go`)

```go
type RateLimiter interface {
    Allow(ctx context.Context, key string) bool
}
```

#### InMemoryRateLimiter — Token Bucket Algorithm
- **Concurrency-safe** via `sync.Mutex`
- **Per-key bucket** (key = client IP from `RemoteAddr`)
- **Parameters (from main.go):**
  - `rate = 10` tokens/second
  - `burst = 20` max tokens
- **Behavior:**
  - New keys start with full bucket (`burst` tokens)
  - Tokens refill continuously based on elapsed time
  - Request consumes 1 token if available, else returns `false` (429)
- **Security:** IP extracted from `RemoteAddr` only — ignores `X-Forwarded-For` to prevent spoofing

---

### 3. Proxy (`internal/proxy/proxy.go`)

The `Proxy` struct composes the resolver, limiter, logger, and timeout:

```go
type Proxy struct {
    resolver Resolver
    limiter  RateLimiter
    logger   *slog.Logger
    timeout  time.Duration
    requests atomic.Uint64
}
```

#### Request Processing (`ServeHTTP`)

| Step | Action | Details |
|------|--------|---------|
| 1 | Metrics endpoint | `/metrics` returns Prometheus-format counters |
| 2 | Resolve upstream | `resolver.Resolve(r.Host)` — returns `*url.URL` or 404 |
| 3 | Client IP | `net.SplitHostPort(r.RemoteAddr)` — secure, no header trust |
| 4 | Rate limit | `limiter.Allow(ctx, ip)` — returns 429 if exhausted |
| 5 | Transport | Custom `http.Transport` with dial/response timeout |
| 6 | ReverseProxy setup | `httputil.ReverseProxy` with `Rewrite` function |
| 7 | Serve | `proxy.ServeHTTP(recorder, r)` |
| 8 | Logging | Structured JSON via `log/slog` |

---

### 4. Header Forwarding & X-API-Key

The Go standard library's `httputil.ReverseProxy` **automatically forwards all non-hop-by-hop headers** from the inbound request to the outbound request.

#### Hop-by-hop headers (stripped per RFC 7230 §6.1)
```
Connection, Keep-Alive, Proxy-Authenticate, Proxy-Authorization,
TE, Trailer, Transfer-Encoding, Upgrade
```

#### X-API-Key handling
- **Not a hop-by-hop header** → passes through automatically
- **No special configuration needed** in the proxy
- Verified by `TestProxy_PassesCustomHeaders` in `proxy_test.go`

```go
// In proxy.go - Rewrite function:
Rewrite: func(pr *httputil.ProxyRequest) {
    pr.SetURL(target)
    pr.Out.Host = pr.In.Host      // Preserve original Host
    pr.SetXForwarded()            // Adds X-Forwarded-For, -Proto, -Host
}
```

The `SetXForwarded()` call adds:
- `X-Forwarded-For` (client IP)
- `X-Forwarded-Proto` (https)
- `X-Forwarded-Host` (original host)

**Custom headers like `X-API-Key` are copied by default** because they are not in the hop-by-hop list.

---

### 5. TLS & HTTP Server (`cmd/proxy/main.go`)

#### Let's Encrypt (autocert)
```go
certManager := autocert.Manager{
    Prompt:     autocert.AcceptTOS,
    Cache:      autocert.DirCache("certs"),
    HostPolicy: autocert.HostWhitelist("nuntix.com.br", "api.nuntix.com.br", "webhooks.nuntix.com.br"),
}
```

#### HTTP Server (Port 80)
- Handles ACME challenges
- Redirects all other traffic to HTTPS

#### HTTPS Server (Port 443)
- Uses `certManager.GetCertificate` for TLS config
- Handler = `finalHandler` (routes by Host)

#### Local Development Mode
```go
if os.Getenv("LOCAL_DEV") == "true" {
    http.ListenAndServe(":8080", finalHandler)
}
```

---

### 6. Frontend Serving (Single Container)

- React app built to `frontend/dist` (Vite + TypeScript + Tailwind CSS v4)
- Go binary serves static files via `http.FileServer`
- SPA fallback: missing paths → `index.html` (React Router)
- **Benefit:** No CORS issues in production — frontend and API share origin

---

## Data Flow Summary

| Layer | Responsibility |
|-------|----------------|
| **Transport** | TLS termination (autocert), HTTP→HTTPS redirect |
| **Routing** | `finalHandler` switches by `Host` header |
| **Proxy Core** | `Proxy.ServeHTTP` — resolve, rate-limit, forward, log |
| **Resolver** | `PostgresResolver` — dynamic host→upstream from DB |
| **Rate Limiter** | `InMemoryRateLimiter` — token bucket per client IP |
| **Forwarding** | `httputil.ReverseProxy` — streams req/resp, adds X-Forwarded-*, passes custom headers |
| **Observability** | `/metrics` endpoint, structured JSON logs |

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Hetzner VPS (Single Node)                │
│                                                              │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────┐  │
│  │   Internet  │───▶│  Reverse Proxy   │───▶│  PostgreSQL │  │
│  │  (443/80)   │    │  (Go Binary)     │    │  (tenants)  │  │
│  └─────────────┘    │  ┌────────────┐  │    └────────────┘  │
│                     │  │ React SPA  │  │                    │
│  ┌─────────────┐    │  │ (frontend/ │  │    ┌────────────┐  │
│  │ Bookmarks   │◀───│  │  dist)     │  │    │ Bookmarks  │  │
│  │   API       │    │  └────────────┘  │    │   API      │  │
│  │  :8081      │    │                  │    │  :8081     │  │
│  └─────────────┘    │  Rate Limiter    │    └────────────┘  │
│                     │  (Token Bucket)  │                    │
│  ┌─────────────┐    │  Logger (slog)   │    ┌────────────┐  │
│  │ Webhook     │◀───│                  │    │ Webhook    │  │
│  │ Dispatcher  │    └──────────────────┘    │ Dispatcher │  │
│  │  :8082      │                            │  :8082     │  │
│  └─────────────┘                            └────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

All services run in Docker containers orchestrated by Docker Compose. The reverse proxy is the single entry point.