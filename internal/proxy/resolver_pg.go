package proxy

import (
	"database/sql"
	"fmt"
	"net/url"
)

// PostgresResolver implements the Resolver interface using a Postgres database.
type PostgresResolver struct {
	db *sql.DB
}

// NewPostgresResolver creates a new PostgresResolver with the given database connection.
func NewPostgresResolver(db *sql.DB) *PostgresResolver {
	return &PostgresResolver{
		db: db,
	}
}

// Resolve queries the database to find the upstream URL for a given host.
func (r *PostgresResolver) Resolve(host string) (*url.URL, error) {
	var target string

	// We assume the table is called 'tenants' with columns 'host' and 'target_url'
	err := r.db.QueryRow("SELECT target_url FROM tenants WHERE host = $1", host).Scan(&target)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("upstream not found for host: %s", host)
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	u, err := url.Parse(target)
	if err != nil {
		return nil, fmt.Errorf("invalid upstream URL for host %s: %w", host, err)
	}

	return u, nil
}
