# Scope — Nuntix (API Gateway & Full-Stack Monorepo)

This document defines what the Nuntix V1 does and, more importantly, what it does not do.
Scope is the contract that prevents the project from growing forever.

> Repository: https://github.com/Carlos20052030/reverse-proxy

## Problem

I run three Go services in production on a single Hetzner VPS (CloudMonitor, Bookmarks API, Webhook Dispatcher). Each listens on its own port, all exposed via the same machine. I want a single entry point that routes by hostname, enforces per-IP rate limits, and gives me one place to add request logging and timeouts — without nginx. Furthermore, I want a unified interface to manage this infrastructure.

## Objective

Build an API Gateway that acts as the single entry point (port 80/443), handles TLS termination, rate limiting, and dynamic routing. V1.1 evolved this into a Full-Stack Monorepo: the Go binary also serves a React Frontend (SPA), providing a dashboard for users to manage bookmarks and API keys.

## In Scope (V1.1)

### Core Proxy (Phase 1)
- Routes by `Host` header from a Postgres database (Dynamic Resolver).
- Streams requests/responses (no buffering).
- Sets `X-Forwarded-For` / `-Proto` / `-Host` correctly.
- Strips hop-by-hop headers (RFC 7230 §6.1).
- Per-IP rate limiting, in-memory, single-process (Token Bucket).
- Returns 502 / 504 with correct semantics.
- Structured JSON logs via `log/slog`.
- Basic Metrics endpoint (`/metrics`).

### Security & Infrastructure (Phase 2)
- **TLS Termination:** Automatic HTTPS via Let's Encrypt (`autocert`).
- **HTTP to HTTPS Redirect:** Port 80 handles ACME challenges and redirects to 443.
- **Secure IP Extraction:** Derives client IP exclusively from `RemoteAddr`, ignoring `X-Forwarded-For` to prevent spoofing.

### Full-Stack Monorepo (Phase 2.5)
- **React Frontend:** Built with Vite, TypeScript, and Tailwind CSS v4.
- **Single Container Deployment:** The Go binary serves the compiled React assets (`frontend/dist`), eliminating CORS in production.
- **Authentication UI:** Login and Register pages communicating with the Bookmarks API via JWT.
- **API Keys UI:** Dashboard to generate and revoke API keys (Machine-to-Machine auth).
- **Bookmarks UI:** Dashboard to Create, Read, and Delete bookmarks.

## Out of Scope (V1.1)

- Multi-tenant provisioning (creating dynamic subdomains per client).
- Distributed rate limiting (Redis-backed).
- Load balancing across multiple upstream instances.
- WebSocket proxying.
- Trusting `X-Forwarded-For` for identity (Security restriction).
- Commercial billing or quotas.

## Core Concepts

### 1. Upstream
The backend HTTP server receiving a forwarded request. Resolved dynamically from the `tenants` table in Postgres.

### 2. Inbound vs Outbound request
Two distinct `*http.Request` values. The outbound request must set `Method`, `URL.Path`, `URL.Scheme`, `URL.Host`, stream `Body`, clone `Header` (minus hop-by-hop), and preserve `Host`.

### 3. Hop-by-hop headers
Per RFC 7230 §6.1, strip: `Connection`, `Keep-Alive`, `Proxy-Authenticate`, `Proxy-Authorization`, `TE`, `Trailer`, `Transfer-Encoding`, `Upgrade`.

### 4. Client IP extraction
Derived exclusively from `RemoteAddr`. Ignores inbound `X-Forwarded-For`.

### 5. Forwarded headers
Append resolved IP to `X-Forwarded-For`. Set `X-Forwarded-Proto` and `X-Forwarded-Host`.

### 6. 502 vs 504
- **502 Bad Gateway:** Upstream reached but malformed response, OR connection refused.
- **504 Gateway Timeout:** Connection established but upstream did not respond within timeout.

### 7. Tenant
In V1.1, a tenant is the `Host` header mapping to a row in the `tenants` table.

## Architecture Principles

### 1. Resolver
```go
type Resolver interface {
    Resolve(host string) (*url.URL, error)
}
```
Implementation: `PostgresResolver` (queries the `tenants` table).

### 2. RateLimiter
```go
type RateLimiter interface {
    Allow(ctx context.Context, key string) bool
}
```
Implementation: In-memory Token Bucket with opaque keys.

### 3. Logger
`log/slog` with JSON handler. Injected, never global.

### 4. Config Source
Environment variables (`.env`) injected via Docker Compose. Reads `DATABASE_URL`.

### Dependency Injection Rule
`main` wires concrete implementations. `NewProxy(resolver Resolver, limiter RateLimiter, logger *slog.Logger, timeout time.Duration) *Proxy`.

## Feature Scope (MoSCoW)

### Must Have (Phase 1 & 2) — COMPLETED
- `[x]` Host-based Routing (via Postgres).
- `[x]` Request/Response Streaming.
- `[x]` Header Hygiene (Hop-by-hop).
- `[x]` Forwarded Headers.
- `[x]` Secure Client IP Extraction.
- `[x]` Error Semantics (502 vs 504).
- `[x]` In-Memory Rate Limiting.
- `[x]` Structured Logging (`log/slog`).
- `[x]` Basic Metrics (`/metrics`).
- `[x]` TLS Termination (autocert).
- `[x]` Full-Stack Monorepo (Go serves React).
- `[x]` UI for Login, Register, Bookmarks, and API Keys.

### Should Have (Future Phases)
- `[ ]` Distributed Rate Limiting (Redis).
- `[ ]` Multi-tenant provisioning API.
- `[ ]` Hot Reload (update tenants without restart).

### Won't Have (Explicit Non-Goals)
- Load Balancing (single upstream).
- Trusting `X-Forwarded-For` for client IP.
- WebSocket Proxying.
```
