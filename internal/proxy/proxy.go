package proxy

import (
	"log/slog"
	"net/http"
	"net/http/httputil"
)

// Proxy is our main handler that wraps the standard library's ReverseProxy.
type Proxy struct {
	resolver Resolver
	logger   *slog.Logger
}

// NewProxy creates a new Proxy with the given Resolver and Logger.
func NewProxy(resolver Resolver, logger *slog.Logger) *Proxy {
	return &Proxy{
		resolver: resolver,
		logger:   logger,
	}
}

// ServeHTTP implements the http.Handler interface.
func (p *Proxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// 1. Resolve the target upstream based on the Host header
	target, err := p.resolver.Resolve(r.Host)
	if err != nil {
		// If we don't know the host, return 404 (as per our test)
		http.Error(w, "Unknown host", http.StatusNotFound)
		return
	}

	// 2. Setup the standard library's reverse proxy
	proxy := &httputil.ReverseProxy{
		Rewrite: func(pr *httputil.ProxyRequest) {
			// Set the target URL (Scheme and Host)
			pr.SetURL(target)

			// Preserve the original Host header (critical for our tests and routing)
			pr.Out.Host = pr.In.Host

			// The stdlib handles X-Forwarded-For, but we'll add others later.
			pr.SetXForwarded()
		},
		ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
			// We'll implement the 502/504 logic here later
			http.Error(w, "Bad Gateway", http.StatusBadGateway)
		},
	}

	// 3. Serve the request
	proxy.ServeHTTP(w, r)
}
