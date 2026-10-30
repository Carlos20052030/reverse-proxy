package main

import (
	"crypto/tls"
	"database/sql"
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"golang.org/x/crypto/acme/autocert"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	// Database connection (kept for potential future use / health checks)
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
		Cache:      autocert.DirCache("/app/certs"),
		HostPolicy: autocert.HostWhitelist("nuntix.com.br", "api.nuntix.com.br", "webhooks.nuntix.com.br"),
	}

	// Backend URLs (static per requirements)
	bookmarksAPI, _ := url.Parse("http://127.0.0.1:8081")
	webhookDispatcher, _ := url.Parse("http://127.0.0.1:8082")

	// Transport with timeout
	transport := &http.Transport{
		ResponseHeaderTimeout: 5 * time.Second,
	}

	// Reverse proxy for bookmarks-api (api.nuntix.com.br + nuntix.com.br/api/*)
	bookmarksProxy := &httputil.ReverseProxy{
		Transport: transport,
		Rewrite: func(r *httputil.ProxyRequest) {
			r.SetURL(bookmarksAPI)
			r.Out.Host = r.In.Host
			r.SetXForwarded()

			// Strip /api prefix for nuntix.com.br host
			if strings.HasPrefix(r.Out.URL.Path, "/api/") {
				r.Out.URL.Path = strings.TrimPrefix(r.Out.URL.Path, "/api")
			}
			if r.Out.URL.Path == "/api" {
				r.Out.URL.Path = "/"
			}
		},
		ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
			logger.Error("bookmarks proxy error", "error", err, "path", r.URL.Path)
			http.Error(w, "Bad Gateway", http.StatusBadGateway)
		},
	}

	// Reverse proxy for webhook-dispatcher (webhooks.nuntix.com.br)
	webhookProxy := &httputil.ReverseProxy{
		Transport: transport,
		Rewrite: func(r *httputil.ProxyRequest) {
			r.SetURL(webhookDispatcher)
			r.Out.Host = r.In.Host
			r.SetXForwarded()
			// No path rewriting needed for webhooks.nuntix.com.br
		},
		ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
			logger.Error("webhook proxy error", "error", err, "path", r.URL.Path)
			http.Error(w, "Bad Gateway", http.StatusBadGateway)
		},
	}

	// Static file server for React frontend
	staticDir := "./frontend/dist"
	fs := http.FileServer(http.Dir(staticDir))

	// Main handler - routes by Host header
	mainHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		host := strings.Split(r.Host, ":")[0]
		path := r.URL.Path

		logger.Info("request", "host", host, "path", path, "method", r.Method)

		// REGRA 1: Host-based routing
		switch host {
		case "api.nuntix.com.br":
			// ALL requests to bookmarks-api
			bookmarksProxy.ServeHTTP(w, r)
			return

		case "webhooks.nuntix.com.br":
			// ALL requests to webhook-dispatcher
			webhookProxy.ServeHTTP(w, r)
			return

		case "nuntix.com.br":
			// REGRA 2: Path-based routing for main host
			if strings.HasPrefix(path, "/api/webhooks") {
				// /api/webhooks* → webhook-dispatcher (strip /api prefix so backend receives /webhooks*)
				r.URL.Path = strings.TrimPrefix(path, "/api")
				webhookProxy.ServeHTTP(w, r)
				return
			}
			if strings.HasPrefix(path, "/api/") {
				// /api/* → bookmarks-api (strip /api prefix)
				bookmarksProxy.ServeHTTP(w, r)
				return
			}
			// ALL other paths → React SPA
			serveReactApp(w, r, staticDir, fs)
			return

		default:
			// Unknown host - serve React app (or 404)
			serveReactApp(w, r, staticDir, fs)
			return
		}
	})

	// Health check endpoint (optional, for monitoring)
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Metrics endpoint (served directly, not proxied)
	http.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain; version=0.0.4")
		w.Write([]byte("# Reverse proxy metrics\n"))
	})

	// Start HTTP server (ACME challenge and HTTPS redirect)
	go func() {
		logger.Info("starting HTTP redirect server", "address", ":80")
		if err := http.ListenAndServe(":80", certManager.HTTPHandler(nil)); err != nil {
			logger.Error("http server failed", "error", err)
			os.Exit(1)
		}
	}()

	// Local development mode: bypass TLS
	if os.Getenv("LOCAL_DEV") == "true" {
		logger.Info("starting LOCAL DEVELOPMENT HTTP server", "address", ":8080")
		if err := http.ListenAndServe(":8080", mainHandler); err != nil {
			logger.Error("local http server failed", "error", err)
			os.Exit(1)
		}
		return
	}

	// Start HTTPS server
	server := &http.Server{
		Addr:      ":443",
		Handler:   mainHandler,
		TLSConfig: &tls.Config{GetCertificate: certManager.GetCertificate},
	}

	logger.Info("starting HTTPS reverse proxy", "address", ":443")
	if err := server.ListenAndServeTLS("", ""); err != nil {
		logger.Error("https server failed", "error", err)
		os.Exit(1)
	}
}

// serveReactApp serves the React SPA (index.html for non-existent files)
func serveReactApp(w http.ResponseWriter, r *http.Request, staticDir string, fs http.Handler) {
	// Use os.DirFS for safe path handling (prevents path traversal)
	fsys := os.DirFS(staticDir)

	// Clean the request path to prevent traversal, then check if file exists
	cleanPath := filepath.Clean(r.URL.Path)
	// Remove leading slash for fsys.Open
	cleanPath = strings.TrimPrefix(cleanPath, "/")

	// Check if file exists using the safe filesystem abstraction
	if _, err := fsys.Open(cleanPath); err != nil {
		// File doesn't exist, serve index.html for SPA routing
		http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
		return
	}
	// File exists, serve it via the FileServer
	fs.ServeHTTP(w, r)
}