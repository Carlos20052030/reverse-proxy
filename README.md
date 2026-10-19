# Reverse Proxy

A production-ready, multi-tenant focused reverse proxy built from scratch in Go.

This is **Project 4** of my backend portfolio. The goal is to master low-level HTTP, network programming, and rate limiting without relying on external frameworks. Built with a strict TDD approach and zero third-party dependencies.

## Features (Phase 1)

- **Host-based Routing:** Routes traffic to different upstreams based on the `Host` header.
- **Secure IP Extraction:** Derives the client IP exclusively from `RemoteAddr`, ignoring spoofed `X-Forwarded-For` headers.
- **In-Memory Rate Limiting:** Uses a Thread-safe Token Bucket algorithm (opaque keys, ready for multi-tenancy).
- **Header Hygiene:** Strips hop-by-hop headers (RFC 7230) and sets `X-Forwarded-*` headers correctly.
- **Error Semantics:** Correctly distinguishes between `502 Bad Gateway` (upstream down) and `504 Gateway Timeout` (upstream slow).
- **Observability:** Structured JSON logging via `log/slog` and a Prometheus-compatible `/metrics` endpoint.

## Architecture

The proxy is designed to be *extensible, not complete*. The core components are decoupled via interfaces (`Resolver`, `RateLimiter`, `Logger`) to allow easy integration with Postgres and Redis in Phase 2.

- `internal/proxy`: Core reverse proxy logic and middlewares.
- `cmd/proxy`: Application entrypoint and dependency injection.

## Tech Stack

- **Language:** Go 1.27 (Standard Library only)
- **Testing:** `net/http/httptest` + manual fakes (no mocking libraries).
- **Logging:** `log/slog` (JSON)
- **Metrics:** Custom `sync/atomic` counters exposed in Prometheus format.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Carlos20052030/reverse-proxy.git
   cd reverse-proxy
   ```

2. Run the tests:
   ```bash
   go test -race ./...
   ```

3. Configure your upstreams in `config.json`:
   ```json
   {
     "listen_addr": ":8083",
     "upstreams": {
       "bookmarks.local": "http://127.0.0.1:8081",
       "webhook.local": "http://127.0.0.1:8082"
     }
   }
   ```

4. Start the proxy:
   ```bash
   go run cmd/proxy/main.go
   ```

5. Test it:
   ```bash
   curl -H "Host: bookmarks.local" http://localhost:8083/health
   ```

## Roadmap

- [x] **Phase 1:** Core proxy, rate limiting, and observability.
- [ ] **Phase 2:** Multi-tenant registry (Postgres), distributed rate limiting (Redis), and TLS termination.
- [ ] **Phase 3:** Commercial surface (billing, quotas, admin dashboard).
```

### 2. Adicionar a Licença (MIT)
Para o GitHub reconhecer que o projeto é open-source e mostrar aquele selinho, você precisa de um arquivo `LICENSE`.

No terminal, rode:
```bash
# Cria o arquivo de licença usando o ano atual e seu nome
echo "MIT License

Copyright (c) 2026 Carlos Daniel Silva Morais

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the \"Software\"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE." > LICENSE
```