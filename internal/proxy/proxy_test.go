package proxy

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// FakeRateLimiter is a manual fake used to test rate limiting logic without time dependencies.
type FakeRateLimiter struct {
	allow bool
}

// SpyRateLimiter is a fake that records the keys passed to it.
type SpyRateLimiter struct {
	lastKey string
	allow   bool
}

func (s *SpyRateLimiter) Allow(ctx context.Context, key string) bool {
	s.lastKey = key
	return s.allow
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

	proxy := NewProxy(resolver, &FakeRateLimiter{allow: true}, nil, 1*time.Second)

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

	proxy := NewProxy(resolver, &FakeRateLimiter{allow: true}, nil, 1*time.Second)

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

	// allow: false = força o bloqueio para testar o 429
	proxy := NewProxy(resolver, &FakeRateLimiter{allow: false}, nil, 1*time.Second)

	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	req.Host = "bookmarks.local"

	rr := httptest.NewRecorder()
	proxy.ServeHTTP(rr, req)

	if rr.Code != http.StatusTooManyRequests {
		t.Errorf("expected status 429, got %d", rr.Code)
	}
}

func TestProxy_SecureClientIPExtraction(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	resolver := NewMapResolver(map[string]string{
		"bookmarks.local": upstream.URL,
	})

	spyLimiter := &SpyRateLimiter{allow: true}
	// Passa o spyLimiter para podermos inspecionar o lastKey
	proxy := NewProxy(resolver, spyLimiter, nil, 1*time.Second)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Host = "bookmarks.local"

	req.RemoteAddr = "192.168.1.100:54321"
	req.Header.Set("X-Forwarded-For", "10.0.0.1")

	rr := httptest.NewRecorder()
	proxy.ServeHTTP(rr, req)

	expectedKey := "192.168.1.100"
	if spyLimiter.lastKey != expectedKey {
		t.Errorf("expected rate limit key to be %q, got %q", expectedKey, spyLimiter.lastKey)
	}
}

func TestProxy_Returns502OnConnectionRefused(t *testing.T) {
	resolver := NewMapResolver(map[string]string{
		"bookmarks.local": "http://127.0.0.1:1", // Port 1 is almost always refused
	})
	proxy := NewProxy(resolver, &FakeRateLimiter{allow: true}, nil, 1*time.Second)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Host = "bookmarks.local"

	rr := httptest.NewRecorder()
	proxy.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadGateway {
		t.Errorf("expected status 502, got %d", rr.Code)
	}
}

func TestProxy_Returns504OnUpstreamTimeout(t *testing.T) {
	// Upstream that sleeps longer than the proxy timeout
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(100 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	resolver := NewMapResolver(map[string]string{
		"bookmarks.local": upstream.URL,
	})

	// Proxy with a very short timeout (50ms)
	proxy := NewProxy(resolver, &FakeRateLimiter{allow: true}, nil, 50*time.Millisecond)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Host = "bookmarks.local"

	rr := httptest.NewRecorder()
	proxy.ServeHTTP(rr, req)

	if rr.Code != http.StatusGatewayTimeout {
		t.Errorf("expected status 504, got %d", rr.Code)
	}
}
