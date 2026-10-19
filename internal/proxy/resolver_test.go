package proxy

import (
	"net/url"
	"testing"
)

func TestMapResolver_Resolve(t *testing.T) {
	// 1. Setup: We define our fake upstreams.
	upstreams := map[string]string{
		"bookmarks.local": "http://127.0.0.1:8081",
		"webhook.local":   "http://127.0.0.1:8082",
	}
	resolver := NewMapResolver(upstreams)

	t.Run("resolves a known host", func(t *testing.T) {
		target, err := resolver.Resolve("bookmarks.local")
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		expectedURL, _ := url.Parse("http://127.0.0.1:8081")
		if target.String() != expectedURL.String() {
			t.Errorf("expected target %q, got %q", expectedURL.String(), target.String())
		}
	})

	t.Run("returns error for unknown host", func(t *testing.T) {
		_, err := resolver.Resolve("unknown.local")
		if err == nil {
			t.Fatal("expected error for unknown host, got nil")
		}
	})
}
