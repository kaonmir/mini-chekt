package parser

import (
	"context"

	"github.com/kaonmir/bridge/internal/alarm/smtp"
	"github.com/kaonmir/bridge/internal/config"
	"github.com/kaonmir/bridge/internal/logger"
	smtpServer "github.com/kaonmir/bridge/internal/smtp"
	"github.com/kaonmir/bridge/internal/supabase/database"
	"github.com/supabase-community/supabase-go"
)

const BROADCAST_CHANNEL = "alarms"

// Manager handles alarm events from multiple protocols (SMTP, HTTP)
type Manager struct {
	logger     *logger.Logger
	ctx        context.Context
	cancelFunc context.CancelFunc
	config     *config.Config

	supabase *supabase.Client
	parsers  map[string][]Parser // [protocol][parser]

	smtpChan chan smtpServer.Mail
}

// New creates a new AlarmManager
func New(logger *logger.Logger, smtpChan chan smtpServer.Mail, cfg *config.Config, supabase *supabase.Client) *Manager {
	ctx, cancel := context.WithCancel(context.Background())

	parsers := map[string][]Parser{
		"smtp": {
			smtp.NewDahuaParser(logger),
		},
	}

	return &Manager{
		logger:     logger,
		smtpChan:   smtpChan,
		ctx:        ctx,
		cancelFunc: cancel,
		config:     cfg,
		parsers:    parsers,
		supabase:   supabase,
	}
}

// Start starts the alarm manager
func (m *Manager) Start() {
	m.logger.Log(logger.Info, "Starting AlarmManager")

	go m.processEvents()
}

// Stop stops the alarm manager
func (m *Manager) Stop() {
	m.logger.Log(logger.Info, "Stopping AlarmManager")
	m.cancelFunc()
}

// processEvents processes incoming events from multiple protocols
func (m *Manager) processEvents() {
	for {
		var data any
		protocol := ""

		select {
		case email := <-m.smtpChan:
			data = &email
			protocol = "smtp"
		case <-m.ctx.Done():
			m.logger.Log(logger.Info, "AlarmManager context cancelled, stopping event processing")
			return
		}

		for _, parser := range m.parsers[protocol] {
			isAlarm, err := parser.IsAlarm(data)
			if err != nil {
				m.logger.Log(logger.Error, "Failed to check if event is an alarm: %v", err)
				continue
			}
			if isAlarm {
				// Parse the alarm event using the parser
				event, err := parser.ParseAlarm(data)
				if err != nil {
					m.logger.Log(logger.Error, "Failed to parse alarm event: %v", err)
					continue
				}
				if event != nil {
					// Send the parsed event to server
					event.SiteId = 1 // TODO: Fix this

					// insert db and broadcast
					_, err = m.supabase.From("alarms").Insert(event, true, "public", "public", "public").ExecuteTo(&database.PublicAlarmInsert{})
					if err != nil {
						m.logger.Log(logger.Error, "Failed to insert alarm event into database: %v", err)
						continue
					}

					m.supabase.From("alarm").Insert(event, false, "public", "public", "public").Execute()
				}
			} else {
				m.logger.Log(logger.Info, "Event is not an alarm event, skipping")
			}
		}
	}
}
