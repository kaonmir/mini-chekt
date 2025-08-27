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
	"github.com/kaonmir/bridge/internal/manager/alarm"
	"github.com/kaonmir/bridge/internal/manager/recorder"
	"github.com/kaonmir/bridge/internal/manager/subscription"
	"github.com/kaonmir/bridge/internal/manager/toolbox"
	"github.com/kaonmir/bridge/internal/smtp"
	"github.com/kaonmir/bridge/internal/supabase"
)

// Core is an instance of bridge server supporting multiple protocols.
type Core struct {
	ctx       context.Context
	ctxCancel func()
	logger    *logger.Logger
	config    *config.Config

	smtpServer      *smtp.Server
	supabase        *supabase.Supabase
	toolbox         *toolbox.Toolbox
	alarmManager    *alarm.Manager
	subscription    *subscription.Subscription
	recorderManager *recorder.Manager
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
	supabase, err := supabase.NewSupabaseClient(cfg)
	if err != nil {
		log.Log(logger.Error, "Failed to create Supabase client: %v", err)
		return nil, false
	}

	toolbox := toolbox.NewToolbox(log, cfg, supabase)

	// Create alarm manager with SMTP channel
	alarmManager := alarm.New(log, smtpServer.GetMailChannel(), cfg, supabase, toolbox)

	recorderManager := recorder.NewManager(toolbox.Cameras, log)

	// Create subscription manager with bridge ID
	subscriptionManager := subscription.NewSubscription(supabase, log, toolbox.BridgeId, recorderManager)

	pa := &Core{
		ctx:       ctx,
		ctxCancel: ctxCancel,
		logger:    log,
		config:    cfg,

		smtpServer:      smtpServer,
		supabase:        supabase,
		toolbox:         toolbox,
		alarmManager:    alarmManager,
		subscription:    subscriptionManager,
		recorderManager: recorderManager,
	}

	if !pa.start() {
		pa.close()
		return nil, false
	}

	return pa, true
}

func (pa *Core) start() bool {

	// Start alarm manager first
	pa.alarmManager.Start()

	// Start recorder manager
	pa.recorderManager.StartAll()

	// Setup Supabase realtime subscriptions
	if err := pa.subscription.Start(); err != nil {
		pa.logger.Log(logger.Error, "Failed to setup subscriptions: %v", err)
		return false
	}

	// Start SMTP server in a goroutine
	go func() {
		if err := pa.smtpServer.Start(); err != nil {
			pa.logger.Log(logger.Error, "Failed to start SMTP server: %v", err)
		}
	}()

	pa.logger.Log(logger.Info, "Bridge service started successfully")
	pa.logger.Log(logger.Info, "- Server URL: %s", pa.config.ServerURL)

	return true
}

func (pa *Core) close() {
	pa.logger.Log(logger.Info, "Stopping bridge services")

	pa.ctxCancel()

	// Stop alarm manager
	if pa.alarmManager != nil {
		pa.alarmManager.Stop()
		pa.logger.Log(logger.Info, "Alarm manager stopped")
	}

	// Stop subscription manager
	if pa.subscription != nil {
		pa.subscription.Stop()
		pa.logger.Log(logger.Info, "Subscription manager stopped")
	}

	// Stop recorder manager
	if pa.recorderManager != nil {
		pa.recorderManager.StopAll()
		pa.logger.Log(logger.Info, "Recorder manager stopped")
	}

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
