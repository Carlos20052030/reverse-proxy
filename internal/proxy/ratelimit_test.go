package proxy

import (
	"context"
	"testing"
	"time"
)

func TestInMemoryRateLimiter_AllowsUpToLimit(t *testing.T) {
	limiter := NewInMemoryRateLimiter(2, 2)
	ctx := context.Background()

	if !limiter.Allow(ctx, "192.168.1.1") {
		t.Error("expected first request to be allowed")
	}
	if !limiter.Allow(ctx, "192.168.1.1") {
		t.Error("expected second request to be allowed")
	}
	if limiter.Allow(ctx, "192.168.1.1") {
		t.Error("expected third request to be blocked")
	}
}

func TestInMemoryRateLimiter_RefillsOverTime(t *testing.T) {
	limiter := NewInMemoryRateLimiter(10, 1)
	ctx := context.Background()

	if !limiter.Allow(ctx, "192.168.1.1") {
		t.Error("expected first request to be allowed")
	}
	if limiter.Allow(ctx, "192.168.1.1") {
		t.Error("expected second request to be blocked immediately")
	}

	time.Sleep(150 * time.Millisecond)

	if !limiter.Allow(ctx, "192.168.1.1") {
		t.Error("expected request to be allowed after refill")
	}
}

func TestInMemoryRateLimiter_IsolatesKeys(t *testing.T) {
	limiter := NewInMemoryRateLimiter(1, 1)
	ctx := context.Background()

	if !limiter.Allow(ctx, "10.0.0.1") {
		t.Error("expected client A to be allowed")
	}
	if !limiter.Allow(ctx, "10.0.0.2") {
		t.Error("expected client B to be allowed")
	}
	if limiter.Allow(ctx, "10.0.0.1") {
		t.Error("expected client A to be blocked")
	}
}
