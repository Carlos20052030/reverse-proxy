# Nuntix - API Gateway & Full-Stack Monorepo

A production-ready, multi-tenant API Gateway built from scratch in Go, now serving its own React Frontend from a single unified Docker container.

This is **Project 4** of my backend portfolio. The goal was to master low-level HTTP, network programming, and infrastructure while delivering a complete Full-Stack SaaS foundation.

## Features

### Backend (API Gateway)
- **Host-based Routing:** Routes traffic to different upstreams dynamically based on the `Host` header.
- **Dynamic Tenant Resolution:** Fetches upstream targets from a PostgreSQL database, allowing for multi-tenant architecture without restarting the server.
- **TLS Termination:** Automatic HTTPS via Let's Encrypt (`autocert`), handling ACME HTTP-01 challenges natively in Go.
- **Secure IP Extraction:** Derives the client IP exclusively from `RemoteAddr`, ignoring spoofed `X-Forwarded-For` headers.
- **In-Memory Rate Limiting:** Thread-safe Token Bucket algorithm with opaque keys.
- **Observability:** Structured JSON logging via `log/slog` and a Prometheus-compatible `/metrics` endpoint.

### Frontend (React Dashboard)
- **Single Container Deployment:** The Go binary compiles and serves the React SPA (`frontend/dist`) directly, eliminating CORS issues and extra web servers (like Nginx).
- **Authentication:** Login and Register pages with JWT session management.
- **Bookmarks Manager:** A dashboard to Create, Read, and Delete bookmarks via the Bookmarks API.
- **API Keys Manager:** A secure interface to generate and revoke Machine-to-Machine API keys, showing the raw key exactly once.

## Architecture

The project is a **Monorepo**. The Go reverse proxy acts as a gateway, an API router, and a static file server for the React frontend.

- `cmd/proxy`: Application entrypoint (Go).
- `internal`: Core reverse proxy logic, middlewares, and Postgres resolver.
- `frontend`: React SPA (Vite + TypeScript + Tailwind CSS).
- `docs`: Project scope, architecture, deployment guide, and postmortem.

## Tech Stack

- **Backend:** Go 1.27 (Standard Library, `autocert`, `pgx`)
- **Frontend:** React, TypeScript, Vite, React Router, Tailwind CSS v4
- **Database:** PostgreSQL
- **Infrastructure:** Docker, Docker Compose, UFW, Let's Encrypt.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Carlos20052030/reverse-proxy.git
   cd reverse-proxy
   ```

2. Run the local development environment (requires Docker). Ensure you have a `.env` file with your `DATABASE_URL` pointing to a local Postgres instance.
   ```bash
   docker compose up -d --build
   ```

3. Access the dashboard at `http://localhost:8080` (make sure `LOCAL_DEV=true` is set in your `.env` to bypass TLS locally).

## Production Deployment

The project uses a multi-stage Docker build (compiling both Node and Go) and runs in `network_mode: "host"` on a Linux VPS. It automatically provisions TLS certificates for `nuntix.com.br` and its subdomains. For detailed instructions, see [docs/deployment.md](docs/deployment.md).

## Documentation

- [Scope & Product Vision](docs/scope.md)
- [Architecture & Design Decisions](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)
- [Roadmap](docs/roadmap.md)
- [Postmortem](docs/postmortem.md)

## Roadmap

- [x] **Phase 1:** Core proxy, rate limiting, and observability.
- [x] **Phase 2:** Multi-tenant registry (Postgres), TLS termination, and Full-Stack Monorepo integration.
- [x] **Phase 2.5:** React UI (Login, Dashboard, API Keys) and Tailwind CSS.
- [ ] **Phase 3:** Commercial surface (billing, quotas, admin dashboard).
```
