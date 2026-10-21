package main

import (
	"crypto/tls"
	"database/sql"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/Carlos20052030/reverse-proxy/internal/proxy"
	_ "github.com/jackc/pgx/v5/stdlib"
	"golang.org/x/crypto/acme/autocert"
)

func main() {
	// 1. Setup the logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	// 2. Connect to the database
	// We read the connection string from an environment variable.
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Fallback for local development (assuming the local DB from the test)
		dbURL = "postgres://postgres:postgres@localhost:5434/postgres?sslmode=disable"
	}

	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		logger.Error("failed to ping database", "error", err)
		os.Exit(1)
	}
	logger.Info("connected to database")

	// 3. Setup the Let's Encrypt Manager (autocert)
	certManager := autocert.Manager{
		Prompt: autocert.AcceptTOS,
		Cache:  autocert.DirCache("certs"),
		HostPolicy: autocert.HostWhitelist(
			"nuntix.com.br",
			"api.nuntix.com.br",
			"webhooks.nuntix.com.br",
		),
	}

	// 4. Setup the components
	// We now use the PostgresResolver instead of MapResolver
	resolver := proxy.NewPostgresResolver(db)
	limiter := proxy.NewInMemoryRateLimiter(10, 20)
	timeout := 5 * time.Second

	// 5. Instantiate the Proxy
	p := proxy.NewProxy(resolver, limiter, logger, timeout)

	// 6. Start the HTTP server on port 80
	go func() {
		logger.Info("starting HTTP redirect server", "address", ":80")
		if err := http.ListenAndServe(":80", certManager.HTTPHandler(nil)); err != nil {
			logger.Error("http server failed", "error", err)
			os.Exit(1)
		}
	}()

	// 7. Start the HTTPS server on port 443
	server := &http.Server{
		Addr:      ":443",
		Handler:   p,
		TLSConfig: &tls.Config{GetCertificate: certManager.GetCertificate},
	}

	logger.Info("starting HTTPS reverse proxy", "address", ":443")
	if err := server.ListenAndServeTLS("", ""); err != nil {
		logger.Error("https server failed", "error", err)
		os.Exit(1)
	}
}
