package main

import (
	"crypto/tls"
	"database/sql"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Carlos20052030/reverse-proxy/internal/proxy"
	_ "github.com/jackc/pgx/v5/stdlib"
	"golang.org/x/crypto/acme/autocert"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://bookmarks:senha_simples_local_123@localhost:5432/webhook_dispatcher?sslmode=disable"
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

	// Let's Encrypt configuration
	certManager := autocert.Manager{
		Prompt:     autocert.AcceptTOS,
		Cache:      autocert.DirCache("certs"),
		HostPolicy: autocert.HostWhitelist("nuntix.com.br", "api.nuntix.com.br", "webhooks.nuntix.com.br"),
	}

	// Proxy setup
	resolver := proxy.NewPostgresResolver(db)
	limiter := proxy.NewInMemoryRateLimiter(10, 20)
	timeout := 5 * time.Second

	p := proxy.NewProxy(resolver, limiter, logger, timeout)

	// Main router
	mainMux := http.NewServeMux()

	// API Routes (go to the Proxy)
	mainMux.HandleFunc("/auth/", func(w http.ResponseWriter, r *http.Request) {
		p.ServeHTTP(w, r)
	})
	mainMux.HandleFunc("/bookmarks", func(w http.ResponseWriter, r *http.Request) {
		p.ServeHTTP(w, r)
	})
	mainMux.HandleFunc("/tags", func(w http.ResponseWriter, r *http.Request) {
		p.ServeHTTP(w, r)
	})
	mainMux.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		p.ServeHTTP(w, r)
	})

	// Route to serve the React Frontend
	staticDir := "./frontend/dist"
	fs := http.FileServer(http.Dir(staticDir))

	mainMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Try to serve the requested file. If it doesn't exist, serve index.html (React SPA routing)
		path := filepath.Join(staticDir, r.URL.Path)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
			return
		}
		fs.ServeHTTP(w, r)
	})

	// Main handler to route by Host
	finalHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		host := strings.Split(r.Host, ":")[0]

		// If the host is api or webhooks, forward to the Proxy
		if host == "api.nuntix.com.br" || host == "webhooks.nuntix.com.br" {
			p.ServeHTTP(w, r)
			return
		}

		// Otherwise (nuntix.com.br or localhost), serve the React frontend
		mainMux.ServeHTTP(w, r)
	})

	// Start HTTP server (ACME challenge and HTTPS redirect)
	go func() {
		logger.Info("starting HTTP redirect server", "address", ":80")
		if err := http.ListenAndServe(":80", certManager.HTTPHandler(nil)); err != nil {
			logger.Error("http server failed", "error", err)
			os.Exit(1)
		}
	}()

	// Local development mode: bypass TLS and serve on port 8080
	if os.Getenv("LOCAL_DEV") == "true" {
		logger.Info("starting LOCAL DEVELOPMENT HTTP server", "address", ":8080")
		if err := http.ListenAndServe(":8080", finalHandler); err != nil {
			logger.Error("local http server failed", "error", err)
			os.Exit(1)
		}
		return
	}

	// Start HTTPS server
	server := &http.Server{
		Addr:      ":443",
		Handler:   finalHandler,
		TLSConfig: &tls.Config{GetCertificate: certManager.GetCertificate},
	}

	logger.Info("starting HTTPS reverse proxy", "address", ":443")
	if err := server.ListenAndServeTLS("", ""); err != nil {
		logger.Error("https server failed", "error", err)
		os.Exit(1)
	}
}
