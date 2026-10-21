package proxy

import (
	"database/sql"
	"net/url"
	"os"
	"testing"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func TestPostgresResolver_Resolve(t *testing.T) {
	// 1. Connect to the local Postgres (using a test DB)
	// You can use the same Postgres from the Bookmarks API or spin up a new one.
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5434/postgres?sslmode=disable"
	}

	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		t.Fatalf("failed to connect to db: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		t.Skip("skipping test; database not available")
	}

	// 2. Setup schema (in a real project, this would be a migration)
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS tenants (
			host TEXT PRIMARY KEY,
			target_url TEXT NOT NULL
		)
	`)
	if err != nil {
		t.Fatalf("failed to create table: %v", err)
	}

	// 3. Insert test data
	_, err = db.Exec(`INSERT INTO tenants (host, target_url) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		"acme.nuntix.com.br", "http://127.0.0.1:8081")
	if err != nil {
		t.Fatalf("failed to insert tenant: %v", err)
	}
	defer db.Exec(`DELETE FROM tenants WHERE host = 'acme.nuntix.com.br'`)

	// 4. Initialize the Resolver
	resolver := NewPostgresResolver(db)

	// 5. Test known host
	t.Run("resolves a known host from postgres", func(t *testing.T) {
		target, err := resolver.Resolve("acme.nuntix.com.br")
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		expected, _ := url.Parse("http://127.0.0.1:8081")
		if target.String() != expected.String() {
			t.Errorf("expected %s, got %s", expected.String(), target.String())
		}
	})

	// 6. Test unknown host
	t.Run("returns error for unknown host", func(t *testing.T) {
		_, err := resolver.Resolve("unknown.nuntix.com.br")
		if err == nil {
			t.Error("expected error for unknown host, got nil")
		}
	})
}
