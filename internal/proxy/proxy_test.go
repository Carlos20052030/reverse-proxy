package proxy

import (
	"bytes"
	"context"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
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

func TestProxy_StructuredLogging(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	resolver := NewMapResolver(map[string]string{
		"bookmarks.local": upstream.URL,
	})

	// Create a buffer to capture the logs and a JSON logger that writes to it
	var logBuf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&logBuf, nil))

	proxy := NewProxy(resolver, &FakeRateLimiter{allow: true}, logger, 1*time.Second)

	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	req.Host = "bookmarks.local"
	req.RemoteAddr = "192.168.1.100:54321"

	rr := httptest.NewRecorder()
	proxy.ServeHTTP(rr, req)

	// Assert the logs
	logOutput := logBuf.String()

	// Simple string checks for the JSON fields
	expectedFields := []string{
		`"method":"GET"`,
		`"path":"/api/test"`,
		`"status":200`,
		`"tenant":"bookmarks.local"`,
		`"duration_ms"`,
	}

	for _, field := range expectedFields {
		if !strings.Contains(logOutput, field) {
			t.Errorf("expected log output to contain %q, got:\n%s", field, logOutput)
		}
	}
}

func TestProxy_MetricsEndpoint(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	resolver := NewMapResolver(map[string]string{
		"bookmarks.local": upstream.URL,
	})

	proxy := NewProxy(resolver, &FakeRateLimiter{allow: true}, nil, 1*time.Second)

	// 1. Make a regular request to the upstream
	req1 := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	req1.Host = "bookmarks.local"
	rr1 := httptest.NewRecorder()
	proxy.ServeHTTP(rr1, req1)

	// 2. Make a request to the metrics endpoint
	req2 := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	req2.Host = "bookmarks.local"
	rr2 := httptest.NewRecorder()
	proxy.ServeHTTP(rr2, req2)

	// 3. Check the metrics response
	if rr2.Code != http.StatusOK {
		t.Fatalf("expected status 200 for /metrics, got %d", rr2.Code)
	}

	body, _ := io.ReadAll(rr2.Body)
	logOutput := string(body)

	if !strings.Contains(logOutput, "reverse_proxy_requests_total") {
		t.Errorf("expected metrics output to contain 'reverse_proxy_requests_total', got:\n%s", logOutput)
	}
}

// TestProxy_PassesCustomHeaders verifies that custom headers like X-API-Key are forwarded to upstream
func TestProxy_PassesCustomHeaders(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiKey := r.Header.Get("X-API-Key")
		if apiKey != "test-api-key-123" {
			t.Errorf("expected X-API-Key 'test-api-key-123', got %q", apiKey)
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer upstream.Close()

	resolver := NewMapResolver(map[string]string{
		"bookmarks.local": upstream.URL,
	})

	proxy := NewProxy(resolver, &FakeRateLimiter{allow: true}, nil, 1*time.Second)

	req := httptest.NewRequest(http.MethodGet, "/api/bookmarks", nil)
	req.Host = "bookmarks.local"
	req.Header.Set("X-API-Key", "test-api-key-123")

	rr := httptest.NewRecorder()
	proxy.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rr.Code)
	}
}
