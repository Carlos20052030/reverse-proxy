package proxy

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

// FakeRateLimiter is a manual fake used to test rate limiting logic without time dependencies.
type FakeRateLimiter struct {
	allow bool
}

func (f *FakeRateLimiter) Allow(ctx context.Context, key string) bool {
	return f.allow
}

func TestProxy_RoutesByHost(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Host != "bookmarks.local" {
			t.Errorf("expected upstream to receive Host 'bookmarks.local', got %q", r.Host)
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("hello from upstream"))
	}))
	defer upstream.Close()

	resolver := NewMapResolver(map[string]string{
		"bookmarks.local": upstream.URL,
	})

	// Updated to include the FakeRateLimiter and nil logger
	proxy := NewProxy(resolver, &FakeRateLimiter{allow: true}, nil)

	t.Run("routes to known host", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
		req.Host = "bookmarks.local"

		rr := httptest.NewRecorder()
		proxy.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Errorf("expected status 200, got %d", rr.Code)
		}

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

func TestProxy_Headers(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Forwarded-Host") != "bookmarks.local" {
			t.Errorf("expected X-Forwarded-Host 'bookmarks.local', got %q", r.Header.Get("X-Forwarded-Host"))
		}
		if r.Header.Get("X-Forwarded-For") == "" {
			t.Error("expected X-Forwarded-For to be set")
		}

		if r.Header.Get("Connection") != "" {
			t.Errorf("expected Connection header to be stripped, got %q", r.Header.Get("Connection"))
		}
		if r.Header.Get("X-Custom-Hop") != "" {
			t.Errorf("expected X-Custom-Hop header to be stripped, got %q", r.Header.Get("X-Custom-Hop"))
		}

		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	resolver := NewMapResolver(map[string]string{
		"bookmarks.local": upstream.URL,
	})

	// Updated to include the FakeRateLimiter and nil logger
	proxy := NewProxy(resolver, &FakeRateLimiter{allow: true}, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	req.Host = "bookmarks.local"

	req.Header.Set("Connection", "keep-alive, X-Custom-Hop")
	req.Header.Set("X-Custom-Hop", "should-be-removed")

	rr := httptest.NewRecorder()
	proxy.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rr.Code)
	}
}

func TestProxy_RateLimiting(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	resolver := NewMapResolver(map[string]string{
		"bookmarks.local": upstream.URL,
	})

	// Pass a limiter that always blocks
	proxy := NewProxy(resolver, &FakeRateLimiter{allow: false}, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	req.Host = "bookmarks.local"

	rr := httptest.NewRecorder()
	proxy.ServeHTTP(rr, req)

	// The proxy must return 429 Too Many Requests when the limiter blocks
	if rr.Code != http.StatusTooManyRequests {
		t.Errorf("expected status 429, got %d", rr.Code)
	}
}
