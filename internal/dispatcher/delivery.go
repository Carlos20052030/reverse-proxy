package dispatcher

import (
	"errors"
	"net/http"

	"github.com/Carlos20052030/reverse-proxy/internal/billing/domain"
)

// ErrEndpointNotFound is returned when a webhook endpoint is not found
var ErrEndpointNotFound = errors.New("endpoint not found")

// Endpoint represents a webhook endpoint
type Endpoint struct {
	ID              string
	UserID          string
	URL             string
	Active          bool
	DisabledReason  string
}

// DisableForQuota disables the endpoint because it exceeds the plan's quota
func (e *Endpoint) DisableForQuota(plan domain.Plan, currentCount int) error {
	quotas := domain.QuotasFor(plan)
	if currentCount >= quotas.MaxWebhooks {
		e.Active = false
		e.DisabledReason = "over_quota"
		return ErrEndpointNotFound
	}
	return nil
}

// Enable re-enables the endpoint
func (e *Endpoint) Enable() {
	e.Active = true
	e.DisabledReason = ""
}

// DeliveryWorker handles webhook delivery
type DeliveryWorker struct {
	endpointStore EndpointStore
	quotaService  QuotaServiceInterface
}

// EndpointStore defines the interface for endpoint storage
type EndpointStore interface {
	GetEndpoint(id string) (*Endpoint, error)
	UpdateEndpoint(ep *Endpoint) error
}

// QuotaServiceInterface defines the interface for quota checking
type QuotaServiceInterface interface {
	CanDeliverRequest(userID string, plan domain.Plan, currentCount int) (bool, error)
}

// DeliveryResponse represents the result of a delivery attempt
type DeliveryResponse struct {
	StatusCode int
	Error      string
}

// NewDeliveryWorker creates a new delivery worker
func NewDeliveryWorker(store EndpointStore, quotaSvc QuotaServiceInterface) *DeliveryWorker {
	return &DeliveryWorker{
		endpointStore: store,
		quotaService:  quotaSvc,
	}
}

// Deliver attempts to deliver a webhook payload
func (w *DeliveryWorker) Deliver(endpointID string, payload []byte) *DeliveryResponse {
	// Get endpoint
	ep, err := w.endpointStore.GetEndpoint(endpointID)
	if err != nil {
		return &DeliveryResponse{
			StatusCode: http.StatusNotFound,
			Error:      err.Error(),
		}
	}

	// Check if endpoint is disabled
	if !ep.Active {
		return &DeliveryResponse{
			StatusCode: http.StatusNotFound,
			Error:      "webhook disabled: " + ep.DisabledReason,
		}
	}

	// TODO: Actual HTTP delivery logic would go here
	// For now, return success
	return &DeliveryResponse{
		StatusCode: http.StatusOK,
		Error:      "",
	}
}