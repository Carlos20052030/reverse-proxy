package dispatcher

import (
	"net/http"
	"testing"

	"github.com/Carlos20052030/reverse-proxy/internal/billing/domain"
)

// Mock for endpoint store
type mockEndpointStore struct {
	endpoints map[string]*Endpoint
}

func (m *mockEndpointStore) GetEndpoint(id string) (*Endpoint, error) {
	if ep, ok := m.endpoints[id]; ok {
		return ep, nil
	}
	return nil, ErrEndpointNotFound
}

func (m *mockEndpointStore) UpdateEndpoint(ep *Endpoint) error {
	m.endpoints[ep.ID] = ep
	return nil
}

func TestDeliveryWorker_SkipsDisabledWebhook(t *testing.T) {
	store := &mockEndpointStore{
		endpoints: map[string]*Endpoint{
			"webhook-1": {ID: "webhook-1", UserID: "user-1", URL: "https://example.com/hook", Active: false, DisabledReason: "over_quota"},
			"webhook-2": {ID: "webhook-2", UserID: "user-1", URL: "https://example.com/hook2", Active: true},
		},
	}

	worker := NewDeliveryWorker(store, nil) // nil quota service for this test

	// Try to deliver to disabled webhook
	resp := worker.Deliver("webhook-1", []byte(`{"test": "data"}`))

	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("expected 404 for disabled webhook, got %d", resp.StatusCode)
	}
	if resp.Error != "webhook disabled: over_quota" {
		t.Errorf("expected 'webhook disabled: over_quota', got %v", resp.Error)
	}
}

func TestDeliveryWorker_DeliversToActiveWebhook(t *testing.T) {
	store := &mockEndpointStore{
		endpoints: map[string]*Endpoint{
			"webhook-1": {ID: "webhook-1", UserID: "user-1", URL: "https://example.com/hook", Active: true},
		},
	}

	worker := NewDeliveryWorker(store, nil)

	// Mock HTTP client would be needed for actual delivery
	// For this test, we just verify the worker checks active status
	resp := worker.Deliver("webhook-1", []byte(`{"test": "data"}`))

	if resp.StatusCode == http.StatusNotFound {
		t.Error("active webhook should not return 404")
	}
}

func TestDeliveryWorker_NotFoundForUnknownWebhook(t *testing.T) {
	store := &mockEndpointStore{endpoints: map[string]*Endpoint{}}
	worker := NewDeliveryWorker(store, nil)

	resp := worker.Deliver("unknown", []byte(`{"test": "data"}`))

	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("expected 404 for unknown webhook, got %d", resp.StatusCode)
	}
}

func TestEndpoint_DisableForQuota(t *testing.T) {
	ep := &Endpoint{
		ID:            "webhook-4",
		UserID:        "user-free",
		URL:           "https://example.com/hook4",
		Active:        true,
		DisabledReason: "",
	}

	// User on Free plan trying to create 4th webhook
	err := ep.DisableForQuota(domain.PlanFree, 3)
	if err == nil {
		t.Error("expected error when disabling 4th webhook on Free plan")
	}
	if ep.Active {
		t.Error("endpoint should be disabled")
	}
	if ep.DisabledReason != "over_quota" {
		t.Errorf("expected DisabledReason 'over_quota', got %q", ep.DisabledReason)
	}
}

func TestEndpoint_Enable(t *testing.T) {
	ep := &Endpoint{
		ID:            "webhook-1",
		UserID:        "user-1",
		URL:           "https://example.com/hook",
		Active:        false,
		DisabledReason: "over_quota",
	}

	ep.Enable()
	if !ep.Active {
		t.Error("endpoint should be active after Enable()")
	}
	if ep.DisabledReason != "" {
		t.Error("DisabledReason should be cleared after Enable()")
	}
}