package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/Carlos20052030/reverse-proxy/internal/proxy"
)

// Config represents the application configuration.
type Config struct {
	ListenAddr string            `json:"listen_addr"`
	Upstreams  map[string]string `json:"upstreams"`
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

	// 2. Setup the logger (JSON handler writing to stdout)
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	// 3. Setup the components (Dependency Injection)
	// Resolver: reads from our config map
	resolver := proxy.NewMapResolver(cfg.Upstreams)

	// RateLimiter: allows 10 requests per second, with a burst of 20
	limiter := proxy.NewInMemoryRateLimiter(10, 20)

	// Timeout: 5 seconds
	timeout := 5 * time.Second

	// 4. Instantiate the Proxy
	p := proxy.NewProxy(resolver, limiter, logger, timeout)

	// 5. Start the HTTP server
	logger.Info("starting reverse proxy", "address", cfg.ListenAddr)
	if err := http.ListenAndServe(cfg.ListenAddr, p); err != nil {
		logger.Error("server failed", "error", err)
		os.Exit(1)
	}
}
