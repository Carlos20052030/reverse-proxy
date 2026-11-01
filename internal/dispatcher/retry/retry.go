package retry

import (
	"time"
)

// RetryPolicy defines the exponential backoff retry policy
type RetryPolicy struct {
	intervals []time.Duration
}

// NewRetryPolicy creates a new retry policy with exponential backoff
// 5 attempts: 1min, 5min, 15min, 1h, 6h
func NewRetryPolicy() *RetryPolicy {
	return &RetryPolicy{
		intervals: []time.Duration{
			1 * time.Minute,   // 1st retry
			5 * time.Minute,   // 2nd retry
			15 * time.Minute,  // 3rd retry
			1 * time.Hour,     // 4th retry
			6 * time.Hour,     // 5th retry
		},
	}
}

// NextInterval returns the interval for the given attempt index (0-based)
func (p *RetryPolicy) NextInterval(attempt int) time.Duration {
	if attempt < 0 || attempt >= len(p.intervals) {
		return 0
	}
	return p.intervals[attempt]
}

// ShouldRetry returns true if a retry should be attempted for the given attempt index
func (p *RetryPolicy) ShouldRetry(attempt int) bool {
	return attempt >= 0 && attempt < len(p.intervals)
}

// IsDead returns true if the delivery has exceeded max retry attempts
func (p *RetryPolicy) IsDead(attempt int) bool {
	return attempt >= len(p.intervals)
}

// NextRetryTime returns the absolute time when the given retry attempt should occur
// This is cumulative: attempt 0 = 1st retry at +1min, attempt 1 = 2nd retry at +6min, etc.
func (p *RetryPolicy) NextRetryTime(baseTime time.Time, attempt int) time.Time {
	if attempt < 0 || attempt >= len(p.intervals) {
		return time.Time{}
	}
	var total time.Duration
	for i := 0; i <= attempt; i++ {
		total += p.intervals[i]
	}
	return baseTime.Add(total)
}

// DeliveryAttempt represents a webhook delivery attempt
type DeliveryAttempt struct {
	Attempt      int
	LastError    string
	MaxAttempts  int
}

// Status returns the current status of the delivery attempt
func (da *DeliveryAttempt) Status() string {
	if da.Attempt == 0 {
		return "pending"
	}
	if da.Attempt >= da.MaxAttempts {
		return "dead"
	}
	return "retrying"
}