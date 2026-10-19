package proxy

import (
	"context"
	"sync"
	"time"
)

// bucket represents the state of a single token bucket.
type bucket struct {
	tokens     float64
	lastRefill time.Time
}

// InMemoryRateLimiter implements the RateLimiter interface using the Token Bucket algorithm.
// It is safe for concurrent use.
type InMemoryRateLimiter struct {
	mu      sync.Mutex
	buckets map[string]*bucket
	rate    float64 // Tokens added per second
	burst   float64 // Maximum tokens the bucket can hold
}

// NewInMemoryRateLimiter creates a new rate limiter.
// rate: how many tokens are added per second.
// burst: the maximum number of tokens (capacity of the bucket).
func NewInMemoryRateLimiter(rate float64, burst int) *InMemoryRateLimiter {
	return &InMemoryRateLimiter{
		buckets: make(map[string]*bucket),
		rate:    rate,
		burst:   float64(burst),
	}
}

// Allow checks if a request with the given key is allowed.
// It returns true if a token is available, false otherwise.
func (l *InMemoryRateLimiter) Allow(ctx context.Context, key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()

	b, exists := l.buckets[key]
	if !exists {
		// First time seeing this key, create a full bucket
		b = &bucket{
			tokens:     l.burst,
			lastRefill: now,
		}
		l.buckets[key] = b
	}

	// Calculate how much time has passed since the last refill
	elapsed := now.Sub(b.lastRefill).Seconds()

	// Add the new tokens based on the rate
	b.tokens += elapsed * l.rate

	// Cap the tokens at the maximum burst size
	if b.tokens > l.burst {
		b.tokens = l.burst
	}

	// Update the last refill time
	b.lastRefill = now

	// If we have at least 1 token, consume it and allow the request
	if b.tokens >= 1.0 {
		b.tokens -= 1.0
		return true
	}

	// No tokens available, block the request
	return false
}
