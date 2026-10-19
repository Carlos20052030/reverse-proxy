package proxy

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"net/http/httputil"
	"sync/atomic"
	"time"
)

// RateLimiter defines the interface for rate limiting logic.
type RateLimiter interface {
	Allow(ctx context.Context, key string) bool
}

// statusRecorder is a wrapper around http.ResponseWriter that captures the status code.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

// Proxy is our main handler that wraps the standard library's ReverseProxy.
type Proxy struct {
	resolver Resolver
	limiter  RateLimiter
	logger   *slog.Logger
	timeout  time.Duration
	requests atomic.Uint64 // Total requests counter
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
	start := time.Now()
	p.requests.Add(1) // Increment the total requests counter

	// 1. Handle the metrics endpoint
	if r.URL.Path == "/metrics" {
		p.serveMetrics(w)
		p.logRequest(r, http.StatusOK, start)
		return
	}

	// 2. Resolve the target upstream based on the Host header
	target, err := p.resolver.Resolve(r.Host)
	if err != nil {
		http.Error(w, "Unknown host", http.StatusNotFound)
		p.logRequest(r, http.StatusNotFound, start)
		return
	}

	// 3. Extract Client IP securely
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		ip = r.RemoteAddr
	}

	// 4. Check Rate Limit
	if !p.limiter.Allow(r.Context(), ip) {
		http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
		p.logRequest(r, http.StatusTooManyRequests, start)
		return
	}

	// 5. Configure the Transport with our timeout
	transport := &http.Transport{
		DialContext: (&net.Dialer{
			Timeout: p.timeout,
		}).DialContext,
		ResponseHeaderTimeout: p.timeout,
	}

	// 6. Setup the standard library's reverse proxy
	proxy := &httputil.ReverseProxy{
		Transport: transport,
		Rewrite: func(pr *httputil.ProxyRequest) {
			pr.SetURL(target)
			pr.Out.Host = pr.In.Host
			pr.SetXForwarded()
		},
		ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
			status := http.StatusBadGateway
			if errors.Is(err, context.DeadlineExceeded) {
				status = http.StatusGatewayTimeout
			} else {
				var netErr net.Error
				if errors.As(err, &netErr) && netErr.Timeout() {
					status = http.StatusGatewayTimeout
				}
			}
			http.Error(w, http.StatusText(status), status)
			p.logRequest(r, status, start)
		},
	}

	// 7. Wrap the ResponseWriter to capture the status code
	recorder := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

	// 8. Serve the request
	proxy.ServeHTTP(recorder, r)

	// 9. Log the completed request (only if it wasn't logged in the ErrorHandler)
	if recorder.status != http.StatusBadGateway && recorder.status != http.StatusGatewayTimeout {
		p.logRequest(r, recorder.status, start)
	}
}

// serveMetrics writes the Prometheus-compatible metrics.
func (p *Proxy) serveMetrics(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "text/plain; version=0.0.4")

	// Write the total requests metric
	fmt.Fprintf(w, "# HELP reverse_proxy_requests_total Total number of requests handled by the proxy.\n")
	fmt.Fprintf(w, "# TYPE reverse_proxy_requests_total counter\n")
	fmt.Fprintf(w, "reverse_proxy_requests_total %d\n", p.requests.Load())
}

// logRequest emits a structured JSON log for the request.
func (p *Proxy) logRequest(r *http.Request, status int, start time.Time) {
	if p.logger == nil {
		return
	}

	duration := time.Since(start)
	p.logger.Info("request handled",
		"method", r.Method,
		"path", r.URL.Path,
		"status", status,
		"duration_ms", duration.Milliseconds(),
		"tenant", r.Host,
	)
}
