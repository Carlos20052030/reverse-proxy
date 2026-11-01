package retry

import (
	"testing"
	"time"
)

func TestRetryPolicy_Intervals(t *testing.T) {
	policy := NewRetryPolicy()

	expectedIntervals := []time.Duration{
		1 * time.Minute,   // 1st retry
		5 * time.Minute,   // 2nd retry
		15 * time.Minute,  // 3rd retry
		1 * time.Hour,     // 4th retry
		6 * time.Hour,     // 5th retry
	}

	for i, expected := range expectedIntervals {
		interval := policy.NextInterval(i)
		if interval != expected {
			t.Errorf("attempt %d: expected interval %v, got %v", i+1, expected, interval)
		}
	}
}

func TestRetryPolicy_MaxAttempts(t *testing.T) {
	policy := NewRetryPolicy()

	// Should allow retries for attempts 0-4 (1st through 5th)
	for i := 0; i < 5; i++ {
		if !policy.ShouldRetry(i) {
			t.Errorf("attempt %d: should retry, but ShouldRetry returned false", i+1)
		}
	}

	// Should NOT retry after 5th attempt (attempt index 5 = 6th try)
	if policy.ShouldRetry(5) {
		t.Error("attempt 6: should not retry, but ShouldRetry returned true")
	}
}

func TestRetryPolicy_IsDeadAfterMaxAttempts(t *testing.T) {
	policy := NewRetryPolicy()

	// After 5 failures (attempt index 4), next check should be dead
	if policy.IsDead(4) {
		t.Error("after 5 attempts: should not be dead yet")
	}

	// After 5th failure (attempt index 5), should be dead
	if !policy.IsDead(5) {
		t.Error("after 6 attempts: should be dead")
	}
}

func TestRetryPolicy_NextRetryTime(t *testing.T) {
	policy := NewRetryPolicy()
	baseTime := time.Date(2026, 1, 1, 12, 0, 0, 0, time.UTC)

	expectedTimes := []time.Time{
		baseTime.Add(1 * time.Minute),   // 1st retry
		baseTime.Add(6 * time.Minute),   // 2nd retry (1+5)
		baseTime.Add(21 * time.Minute),  // 3rd retry (1+5+15)
		baseTime.Add(1 * time.Hour + 21 * time.Minute), // 4th retry
		baseTime.Add(7 * time.Hour + 21 * time.Minute), // 5th retry
	}

	for i, expected := range expectedTimes {
		nextTime := policy.NextRetryTime(baseTime, i)
		if !nextTime.Equal(expected) {
			t.Errorf("attempt %d: expected next retry at %v, got %v", i+1, expected, nextTime)
		}
	}
}

func TestDeliveryAttempt_Status(t *testing.T) {
	tests := []struct {
		name          string
		attempt       int
		lastError     string
		maxAttempts   int
		expectedStatus string
	}{
		{"pending first attempt", 0, "", 5, "pending"},
		{"retrying after 1st failure", 1, "timeout", 5, "retrying"},
		{"retrying after 3rd failure", 3, "500 error", 5, "retrying"},
		{"dead after max attempts", 5, "connection refused", 5, "dead"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			da := &DeliveryAttempt{
				Attempt:    tt.attempt,
				LastError:  tt.lastError,
				MaxAttempts: tt.maxAttempts,
			}
			status := da.Status()
			if status != tt.expectedStatus {
				t.Errorf("expected status %q, got %q", tt.expectedStatus, status)
			}
		})
	}
}