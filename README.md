# Nuntix - API Gateway & Full-Stack Monorepo

A production-ready, multi-tenant API Gateway built from scratch in Go, now serving its own React Frontend from a single unified Docker container.

This is **Project 4** of my backend portfolio. The goal was to master low-level HTTP, network programming, and infrastructure while delivering a complete Full-Stack SaaS foundation.

## Features

- **Host-based Routing:** Routes traffic to different upstreams based on the `Host` header.
- **Single Container Deployment:** The Go binary compiles and serves the React SPA (`frontend/dist`) directly, eliminating CORS issues and extra web servers (like Nginx).
- **TLS Termination:** Automatic HTTPS via Let's Encrypt (`autocert`), handling ACME HTTP-01 challenges natively in Go.
- **Dynamic Tenant Resolution:** Fetches upstream targets from a PostgreSQL database, allowing for multi-tenant architecture without restarting the server.
- **Secure IP Extraction:** Derives the client IP exclusively from `RemoteAddr`, ignoring spoofed `X-Forwarded-For` headers.
- **In-Memory Rate Limiting:** Thread-safe Token Bucket algorithm with opaque keys.
- **Observability:** Structured JSON logging via `log/slog` and a Prometheus-compatible `/metrics` endpoint.

## Architecture

The project is a **Monorepo**. The Go reverse proxy acts as a gateway, an API router, and a static file server for the React frontend.

- `cmd/proxy`: Application entrypoint (Go).
- `internal`: Core reverse proxy logic, middlewares, and Postgres resolver.
- `frontend`: React SPA (Vite + TypeScript) with JWT authentication, fetching data from the API.

## Tech Stack

- **Backend:** Go 1.27 (Standard Library, `autocert`, `pgx`)
- **Frontend:** React, TypeScript, Vite, React Router
- **Database:** PostgreSQL
- **Infrastructure:** Docker, Docker Compose, UFW, Let's Encrypt.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Carlos20052030/reverse-proxy.git
   cd reverse-proxy
   ```

2. Run the local development environment (requires Docker):
   ```bash
   docker compose up -d --build
   ```

3. Access the frontend at `http://localhost:8080` (in local dev mode).

## Production Deployment

The project uses a multi-stage Docker build (compiling both Node and Go) and runs in `network_mode: "host"` on a Linux VPS. It automatically provisions TLS certificates for `nuntix.com.br` and its subdomains.

## Roadmap

- [x] **Phase 1:** Core proxy, rate limiting, and observability.
- [x] **Phase 2:** Multi-tenant registry (Postgres), TLS termination, and Full-Stack Monorepo integration.
- [ ] **Phase 3:** Commercial surface (billing, quotas, admin dashboard).
```
