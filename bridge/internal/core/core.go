// Package core contains the main struct of the bridge service.
package core

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kaonmir/bridge/internal/config"
	"github.com/kaonmir/bridge/internal/logger"
	"github.com/kaonmir/bridge/internal/manager/initializer"
	"github.com/kaonmir/bridge/internal/smtp"
	"github.com/supabase-community/supabase-go"
)

// Core is an instance of bridge server supporting multiple protocols.
type Core struct {
	ctx       context.Context
	ctxCancel func()
	logger    *logger.Logger
	config    *config.Config

	smtpServer  *smtp.Server
	supabase    *supabase.Client
	initializer *initializer.Initializer
}

// Event represents an event to be sent to the server
type Event struct {
	Type      string                 `json:"type"`
	Timestamp time.Time              `json:"timestamp"`
	Data      map[string]interface{} `json:"data"`
}

// NewCore allocates a core.
func New(args []string) (*Core, bool) {
	ctx, ctxCancel := context.WithCancel(context.Background())

	// Load configuration
	cfg := config.Load()

	// Create logger
	log := logger.New()

	smtpServer := smtp.New(log, cfg.SMTPPort)

	// Use the new Supabase client initialization function
	supabase, err := NewSupabaseClient(cfg)
	if err != nil {
		log.Log(logger.Error, "Failed to create Supabase client: %v", err)
		return nil, false
	}

	initializer := initializer.NewInitializer(log, cfg, supabase)

	pa := &Core{
		ctx:       ctx,
		ctxCancel: ctxCancel,
		logger:    log,
		config:    cfg,

		smtpServer:  smtpServer,
		supabase:    supabase,
		initializer: initializer,
	}

	if !pa.start() {
		pa.close()
		return nil, false
	}

	return pa, true
}

func (pa *Core) start() bool {

	// Start SMTP server
	if err := pa.smtpServer.Start(); err != nil {
		pa.logger.Log(logger.Error, "Failed to start SMTP server: %v", err)
		return false
	}

	pa.logger.Log(logger.Info, "Bridge service started successfully")
	pa.logger.Log(logger.Info, "- Server URL: %s", pa.config.ServerURL)

	return true
}

func (pa *Core) close() {
	pa.logger.Log(logger.Info, "Stopping bridge services")

	pa.ctxCancel()

	// Stop SMTP server
	if pa.smtpServer != nil {
		if err := pa.smtpServer.Stop(); err != nil {
			pa.logger.Log(logger.Error, "Failed to stop SMTP server: %v", err)
		} else {
			pa.logger.Log(logger.Info, "SMTP server stopped")
		}
	}

	pa.logger.Log(logger.Info, "All bridge services stopped")
}

// Wait waits for the core to exit.
func (pa *Core) Wait() {
	pa.logger.Log(logger.Info, "Chekt Bridge is running")

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	defer signal.Stop(sig)

	<-sig

	pa.close()
}
