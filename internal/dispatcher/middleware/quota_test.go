package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Carlos20052030/reverse-proxy/internal/billing/domain"
)

// mockQuotaService implements QuotaServiceInterface for testing
type mockQuotaService struct {
	allowDelivery bool
	currentCount  int
	plan          domain.Plan
	callCount     int
}

func (m *mockQuotaService) CanCreateWebhook(userID string, plan domain.Plan, currentCount int) (bool, error) {
	return true, nil
}

func (m *mockQuotaService) CanDeliverRequest(userID string, plan domain.Plan, currentCount int) (bool, error) {
	m.callCount++
	m.currentCount = currentCount
	m.plan = plan
	return m.allowDelivery, nil
}

func (m *mockQuotaService) ResetUser(userID string) {}

func TestQuotaMiddleware_AllowsDeliveryWithinLimit(t *testing.T) {
	mockQS := &mockQuotaService{allowDelivery: true}

	middleware := NewQuotaMiddleware(mockQS)

	// Create a test handler that succeeds
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("delivered"))
	})

	handler := middleware.Wrap(next)

	req := httptest.NewRequest(http.MethodPost, "/webhook/test", nil)
	req.Header.Set("X-User-ID", "user-123")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
	if rr.Body.String() != "delivered" {
		t.Errorf("expected 'delivered', got %s", rr.Body.String())
	}
	if mockQS.callCount != 1 {
		t.Errorf("expected CanDeliverRequest called once, got %d", mockQS.callCount)
	}
}

func TestQuotaMiddleware_BlocksDeliveryOverLimit(t *testing.T) {
	mockQS := &mockQuotaService{allowDelivery: false}

	middleware := NewQuotaMiddleware(mockQS)

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("delivered"))
	})

	handler := middleware.Wrap(next)

	req := httptest.NewRequest(http.MethodPost, "/webhook/test", nil)
	req.Header.Set("X-User-ID", "user-123")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusTooManyRequests {
		t.Errorf("expected 429, got %d", rr.Code)
	}
	if rr.Header().Get("Retry-After") == "" {
		t.Error("expected Retry-After header")
	}
	if mockQS.callCount != 1 {
		t.Errorf("expected CanDeliverRequest called once, got %d", mockQS.callCount)
	}
}

func TestQuotaMiddleware_RequiresUserID(t *testing.T) {
	mockQS := &mockQuotaService{allowDelivery: true}
	middleware := NewQuotaMiddleware(mockQS)

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.Wrap(next)

	req := httptest.NewRequest(http.MethodPost, "/webhook/test", nil)
	// No X-User-ID header
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for missing user ID, got %d", rr.Code)
	}
}

func TestQuotaMiddleware_CallsNextHandler(t *testing.T) {
	mockQS := &mockQuotaService{allowDelivery: true}
	middleware := NewQuotaMiddleware(mockQS)

	nextCalled := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nextCalled = true
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.Wrap(next)

	req := httptest.NewRequest(http.MethodPost, "/webhook/test", nil)
	req.Header.Set("X-User-ID", "user-123")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if !nextCalled {
		t.Error("next handler was not called")
	}
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
}