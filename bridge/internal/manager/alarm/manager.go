package alarm

import (
	"bytes"
	"context"
	"fmt"
	"time"

	"github.com/kaonmir/bridge/internal/config"
	"github.com/kaonmir/bridge/internal/logger"
	"github.com/kaonmir/bridge/internal/manager/alarm/smtp"
	"github.com/kaonmir/bridge/internal/manager/toolbox"
	smtpServer "github.com/kaonmir/bridge/internal/smtp"
	"github.com/kaonmir/bridge/internal/supabase"
	"github.com/kaonmir/bridge/internal/supabase/database"
	storage "github.com/supabase-community/storage-go"
)

// Manager handles alarm events from multiple protocols (SMTP, HTTP)
type Manager struct {
	logger     *logger.Logger
	ctx        context.Context
	cancelFunc context.CancelFunc
	config     *config.Config

	supabase *supabase.Supabase
	parsers  map[string][]Parser // [protocol][parser]

	smtpChan chan smtpServer.Mail
	toolbox  *toolbox.Toolbox
}

// New creates a new AlarmManager
func New(logger *logger.Logger, smtpChan chan smtpServer.Mail, cfg *config.Config, supabase *supabase.Supabase, toolbox *toolbox.Toolbox) *Manager {
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
		toolbox:    toolbox,
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

// createSampleTestFile creates a sample test file content for alarm events
func (m *Manager) createSampleTestFile(event *database.PublicAlarmInsert) string {
	content := fmt.Sprintf(`# Alarm Test File
Generated at: %s
Site ID: %d
Alarm Name: %s
Alarm Type: %s

This is a sample test file generated when an alarm was detected.
The alarm event has been processed and stored in the database.

Event Details:
- Timestamp: %s
- Site ID: %d
- Alarm Name: %s
- Alarm Type: %s
- Bridge ID: %d
- Camera ID: %d

This file serves as a test artifact to verify that alarm detection
and file upload functionality is working correctly.
`,
		time.Now().Format("2006-01-02 15:04:05"),
		event.SiteId,
		event.AlarmName,
		event.AlarmType,
		time.Now().Format("2006-01-02 15:04:05"),
		event.SiteId,
		event.AlarmName,
		event.AlarmType,
		event.BridgeId,
		event.CameraId,
	)

	return content
}

// UploadSampleFileToBucket uploads a sample test file to Supabase storage bucket
func (m *Manager) UploadSampleFileToBucket(event *database.PublicAlarmInsert) error {
	// Create sample file content
	fileContent := m.createSampleTestFile(event)

	// Generate unique filename
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	filename := fmt.Sprintf("alarm_test_%s_%d.txt", timestamp, event.SiteId)

	// Convert string content to bytes
	contentBytes := []byte(fileContent)
	contentType := "text/plain"
	upsert := false

	// Upload to alarm-snapshots bucket
	_, err := m.supabase.Client.Storage.UploadFile("alarm-snapshots", filename, bytes.NewReader(contentBytes), storage.FileOptions{
		ContentType: &contentType,
		Upsert:      &upsert,
	})

	if err != nil {
		return fmt.Errorf("failed to upload sample file to bucket: %w", err)
	}

	m.logger.Log(logger.Info, "Successfully uploaded sample test file: %s", filename)
	return nil
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
					event.SiteId = m.toolbox.SiteId

					// Upload sample test file to Supabase bucket
					err = m.UploadSampleFileToBucket(event)
					if err != nil {
						m.logger.Log(logger.Error, "Failed to upload sample test file: %v", err)
						// Continue processing even if file upload fails
					} else {
						m.logger.Log(logger.Info, "Successfully uploaded sample test file")
					}

					// insert db and broadcast
					_, err = m.supabase.Client.From("alarm").Insert(event, false, "public", "public", "public").ExecuteTo(&database.PublicAlarmInsert{})
					if err != nil {
						m.logger.Log(logger.Error, "Failed to insert alarm event into database: %v", err)
						continue
					}
				}
			} else {
				m.logger.Log(logger.Info, "Event is not an alarm event, skipping")
			}
		}
	}
}
