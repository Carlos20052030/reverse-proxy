package proxy

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"
	"net/http/httputil"
	"time"
)

// RateLimiter defines the interface for rate limiting logic.
type RateLimiter interface {
	Allow(ctx context.Context, key string) bool
}

// Proxy is our main handler that wraps the standard library's ReverseProxy.
type Proxy struct {
	resolver Resolver
	limiter  RateLimiter
	logger   *slog.Logger
	timeout  time.Duration
}

// NewProxy creates a new Proxy with the given Resolver, RateLimiter, Logger, and Timeout.
func NewProxy(resolver Resolver, limiter RateLimiter, logger *slog.Logger, timeout time.Duration) *Proxy {
	return &Proxy{
		resolver: resolver,
		limiter:  limiter,
		logger:   logger,
		timeout:  timeout,
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

	// 2. Extract Client IP securely
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		ip = r.RemoteAddr
	}

	// 3. Check Rate Limit
	if !p.limiter.Allow(r.Context(), ip) {
		http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
		return
	}

	// 4. Configure the Transport with our timeout
	transport := &http.Transport{
		DialContext: (&net.Dialer{
			Timeout: p.timeout,
		}).DialContext,
		ResponseHeaderTimeout: p.timeout,
	}

	// 5. Setup the standard library's reverse proxy
	proxy := &httputil.ReverseProxy{
		Transport: transport,
		Rewrite: func(pr *httputil.ProxyRequest) {
			pr.SetURL(target)
			pr.Out.Host = pr.In.Host
			pr.SetXForwarded()
		},
		ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
			// Distinguish between timeout (504) and other errors (502)
			if errors.Is(err, context.DeadlineExceeded) {
				http.Error(w, "Gateway Timeout", http.StatusGatewayTimeout)
				return
			}

			var netErr net.Error
			if errors.As(err, &netErr) && netErr.Timeout() {
				http.Error(w, "Gateway Timeout", http.StatusGatewayTimeout)
				return
			}

			// Default to 502 Bad Gateway
			http.Error(w, "Bad Gateway", http.StatusBadGateway)
		},
	}

	// 6. Serve the request
	proxy.ServeHTTP(w, r)
}
