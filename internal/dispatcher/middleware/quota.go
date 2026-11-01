package middleware

import (
	"log/slog"
	"net/http"

	"github.com/Carlos20052030/reverse-proxy/internal/billing/domain"
)

// QuotaServiceInterface defines the interface for quota checking
type QuotaServiceInterface interface {
	CanDeliverRequest(userID string, plan domain.Plan, currentCount int) (bool, error)
}

// QuotaMiddleware enforces request quota limits on webhook deliveries
type QuotaMiddleware struct {
	quotaSvc QuotaServiceInterface
	logger   *slog.Logger
}

func NewQuotaMiddleware(quotaSvc QuotaServiceInterface) *QuotaMiddleware {
	return &QuotaMiddleware{
		quotaSvc: quotaSvc,
		logger:   slog.Default().With("component", "quota-middleware"),
	}
}

// Wrap wraps an HTTP handler with quota enforcement
func (m *QuotaMiddleware) Wrap(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get user ID from context/header (set by auth middleware)
		userID := r.Header.Get("X-User-ID")
		if userID == "" {
			m.logger.Warn("quota check: missing user ID")
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Get user's plan from context (set by auth middleware)
		planStr := r.Header.Get("X-User-Plan")
		plan := domain.ParsePlanOrDefault(planStr)

		// Check quota
		allowed, err := m.quotaSvc.CanDeliverRequest(userID, plan, 0)
		if err != nil {
			m.logger.Error("quota check failed", "error", err, "user_id", userID)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		if !allowed {
			m.logger.Warn("quota exceeded, blocking delivery", "user_id", userID, "plan", plan)
			w.Header().Set("Retry-After", "3600") // 1 hour default
			http.Error(w, "Quota exceeded", http.StatusTooManyRequests)
			return
		}

		// Quota check passed, call next handler
		next.ServeHTTP(w, r)
	})
}

// Helper to parse plan or default to Free
func ParsePlanOrDefault(planStr string) domain.Plan {
	plan, _ := domain.ParsePlan(planStr)
	return plan
}