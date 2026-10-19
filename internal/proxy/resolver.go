package proxy

import (
	"fmt"
	"net/url"
)

// Resolver defines the interface for routing hosts to upstream URLs.
type Resolver interface {
	Resolve(host string) (*url.URL, error)
}

// MapResolver implements the Resolver interface using an in-memory map.
type MapResolver struct {
	upstreams map[string]string
}

// NewMapResolver creates a new MapResolver with the given upstreams.
func NewMapResolver(upstreams map[string]string) *MapResolver {
	return &MapResolver{
		upstreams: upstreams,
	}
}

// Resolve returns the upstream URL for a given host.
func (r *MapResolver) Resolve(host string) (*url.URL, error) {
	target, exists := r.upstreams[host]
	if !exists {
		return nil, fmt.Errorf("upstream not found for host: %s", host)
	}

	u, err := url.Parse(target)
	if err != nil {
		return nil, fmt.Errorf("invalid upstream URL for host %s: %w", host, err)
	}

	return u, nil
}
