package proxy

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestProxy_RoutesByHost(t *testing.T) {
	// 1. Setup a fake upstream (acting as Bookmarks API)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Assert that the proxy preserved the original Host header
		if r.Host != "bookmarks.local" {
			t.Errorf("expected upstream to receive Host 'bookmarks.local', got %q", r.Host)
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("hello from upstream"))
	}))
	defer upstream.Close()

	// 2. Setup the resolver with the fake upstream's dynamic URL
	resolver := NewMapResolver(map[string]string{
		"bookmarks.local": upstream.URL,
	})

	// 3. Setup the proxy (Logger is passed as nil for now to keep it simple)
	proxy := NewProxy(resolver, nil)

	t.Run("routes to known host", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
		req.Host = "bookmarks.local" // This is what the client sends

		rr := httptest.NewRecorder()
		proxy.ServeHTTP(rr, req)

		// Check response status
		if rr.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", rr.Code)
		}

		// Check response body
		body, _ := io.ReadAll(rr.Body)
		if string(body) != "hello from upstream" {
			t.Errorf("expected body 'hello from upstream', got %q", string(body))
		}
	})

	t.Run("returns 404 for unknown host", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Host = "unknown.local"

		rr := httptest.NewRecorder()
		proxy.ServeHTTP(rr, req)

		if rr.Code != http.StatusNotFound {
			t.Errorf("expected status 404 for unknown host, got %d", rr.Code)
		}
	})
}
