package main

import (
	"crypto/tls"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/Carlos20052030/reverse-proxy/internal/proxy"
	"golang.org/x/crypto/acme/autocert"
)

// Config represents the application configuration.
type Config struct {
	Upstreams map[string]string `json:"upstreams"`
}

func main() {
	// 1. Load the configuration file
	file, err := os.Open("config.json")
	if err != nil {
		slog.Error("failed to open config file", "error", err)
		os.Exit(1)
	}
	defer file.Close()

	var cfg Config
	if err := json.NewDecoder(file).Decode(&cfg); err != nil {
		slog.Error("failed to parse config file", "error", err)
		os.Exit(1)
	}

	// 2. Setup the logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	// 3. Setup the Let's Encrypt Manager (autocert)
	certManager := autocert.Manager{
		Prompt: autocert.AcceptTOS,
		Cache:  autocert.DirCache("certs"), // Caches certificates locally
		HostPolicy: autocert.HostWhitelist(
			"nuntix.com.br",
			"api.nuntix.com.br",
			"webhooks.nuntix.com.br",
		),
	}

	// 4. Setup the components
	resolver := proxy.NewMapResolver(cfg.Upstreams)
	limiter := proxy.NewInMemoryRateLimiter(10, 20)
	timeout := 5 * time.Second

	// 5. Instantiate the Proxy
	p := proxy.NewProxy(resolver, limiter, logger, timeout)

	// 6. Start the HTTP server on port 80 (for ACME challenges and HTTPS redirects)
	go func() {
		logger.Info("starting HTTP redirect server", "address", ":80")
		// The HTTPHandler handles ACME HTTP-01 challenges and redirects everything else to HTTPS
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
