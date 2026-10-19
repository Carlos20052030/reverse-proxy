package proxy

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"net/http/httputil"
)

// RateLimiter defines the interface for rate limiting logic.
// The key is an opaque string (e.g., client IP in Phase 1).
type RateLimiter interface {
	Allow(ctx context.Context, key string) bool
}

// Proxy is our main handler that wraps the standard library's ReverseProxy.
type Proxy struct {
	resolver Resolver
	limiter  RateLimiter
	logger   *slog.Logger
}

// NewProxy creates a new Proxy with the given Resolver, RateLimiter, and Logger.
func NewProxy(resolver Resolver, limiter RateLimiter, logger *slog.Logger) *Proxy {
	return &Proxy{
		resolver: resolver,
		limiter:  limiter,
		logger:   logger,
	}
}

// ServeHTTP implements the http.Handler interface.
func (p *Proxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// 1. Resolve the target upstream based on the Host header
	target, err := p.resolver.Resolve(r.Host)
	if err != nil {
		http.Error(w, "Unknown host", http.StatusNotFound)
		return
	}

	// 2. Extract Client IP securely (ignoring X-Forwarded-For)
	// We use net.SplitHostPort to remove the port from RemoteAddr.
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		// Fallback if RemoteAddr doesn't have a port (e.g., in some tests)
		ip = r.RemoteAddr
	}

	// 3. Check Rate Limit
	if !p.limiter.Allow(r.Context(), ip) {
		http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
		return
	}

	// 4. Setup the standard library's reverse proxy
	proxy := &httputil.ReverseProxy{
		Rewrite: func(pr *httputil.ProxyRequest) {
			pr.SetURL(target)
			pr.Out.Host = pr.In.Host
			pr.SetXForwarded()
		},
		ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
			http.Error(w, "Bad Gateway", http.StatusBadGateway)
		},
	}

	// 5. Serve the request
	proxy.ServeHTTP(w, r)
}
