package alarm

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/kaonmir/mini-chekt/internal/alarm/smtp"
	"github.com/kaonmir/mini-chekt/internal/conf"
	"github.com/kaonmir/mini-chekt/internal/confdb"
	"github.com/kaonmir/mini-chekt/internal/defs"
	"github.com/kaonmir/mini-chekt/internal/logger"
	smtpServer "github.com/kaonmir/mini-chekt/internal/servers/smtp"
	storage "github.com/supabase-community/storage-go"
	"github.com/supabase-community/supabase-go"
)

type alarmParent interface {
	logger.Writer
}

// Aalrm handles alarm events from multiple protocols (SMTP, HTTP)
type Aalrm struct {
	conf   *conf.Conf
	confdb *confdb.ConfDB
	Parent alarmParent

	ctx       context.Context
	ctxCancel func()
	wg        sync.WaitGroup

	parsers        map[string][]Parser // [protocol][parser]
	supabaseClient *supabase.Client

	// in
	chMail *(chan smtpServer.Mail)
}

// New creates a new Alarm Manager instance
func New(conf *conf.Conf, confdb *confdb.ConfDB, parent alarmParent, chMail *(chan smtpServer.Mail)) *Aalrm {
	return &Aalrm{
		conf:   conf,
		confdb: confdb,
		Parent: parent,
		chMail: chMail,
	}
}

func (a *Aalrm) Initialize() error {
	a.ctx, a.ctxCancel = context.WithCancel(context.Background())

	var err error
	a.supabaseClient, err = supabase.NewClient(a.conf.SupabaseURL, a.conf.SupabaseKey, &supabase.ClientOptions{
		Headers: map[string]string{
			"Authorization": "Bearer " + a.conf.SupabaseKey,
			"apikey":        a.conf.SupabaseKey,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create supabase client: %w", err)
	}

	a.parsers = map[string][]Parser{
		"smtp": {
			smtp.NewDahuaParser(a.Parent),
		},
	}

	a.wg.Add(1)
	go a.run()

	return nil
}

func (a *Aalrm) Log(level logger.Level, format string, args ...interface{}) {
	a.Parent.Log(level, "[Alarm] "+format, args...)
}

// processEvents processes incoming events from multiple protocols
func (a *Aalrm) run() {
	for {
		var data any
		protocol := ""

		select {
		case email := <-*a.chMail:
			data = &email
			protocol = "smtp"
		case <-a.ctx.Done():
			a.Log(logger.Info, "AlarmManager context cancelled, stopping event processing")
			return
		}

		for _, parser := range a.parsers[protocol] {
			isAlarm, err := parser.IsAlarm(data)
			if err != nil {
				a.Log(logger.Error, "Failed to check if event is an alarm: %v", err)
				continue
			}
			if isAlarm {
				// Parse the alarm event using the parser
				event, err := parser.ParseAlarm(data)
				if err != nil {
					a.Log(logger.Error, "Failed to parse alarm event: %v", err)
					continue
				}
				if event != nil {
					event.SiteId = a.confdb.SiteId

					// Upload recordings folder as zip to Supabase bucket
					videoUrl, err := a.UploadRecordingsToBucket(event, data)
					if err != nil {
						a.Log(logger.Error, "Failed to upload recordings: %v", err)
						// Continue processing even if file upload fails
					} else {
						a.Log(logger.Info, "Recordings uploaded successfully, public URL: %s", videoUrl)
					}

					// insert db and broadcast
					eventData := map[string]interface{}{
						"site_id":    event.SiteId,
						"alarm_name": event.AlarmName,
						"alarm_type": event.AlarmType,
						"bridge_id":  event.BridgeId,
						"camera_id":  event.CameraId,
						"created_at": time.Now().UTC(),
						"video_url":  videoUrl,
					}
					_, _, err = a.supabaseClient.From("alarm").Insert(eventData, false, "", "", "").Execute()
					if err != nil {
						a.Log(logger.Error, "Failed to insert alarm event into database: %v", err)
						continue
					}
				}
			} else {
				a.Log(logger.Info, "Event is not an alarm event, skipping")
			}
		}
	}
}

// Stop stops the alarm manager
func (a *Aalrm) Close() {
	a.Log(logger.Info, "Stopping AlarmManager")

	a.ctxCancel()
	a.wg.Wait()
}

// UploadRecordingsToBucket uploads recordings folder as zip to Supabase storage bucket and returns public URL
func (a *Aalrm) UploadRecordingsToBucket(event *defs.PublicAlarmInsert, data any) (string, error) {
	mail, ok := data.(*smtpServer.Mail)
	if !ok {
		return "", fmt.Errorf("data is not a smtpServer.Mail")
	}

	// Get camera information to find the recordings folder
	cameraIP := mail.FromIP

	recordingsPath := fmt.Sprintf("./recordings/%s", cameraIP)

	// Check if recordings folder exists
	if _, err := os.Stat(recordingsPath); os.IsNotExist(err) {
		a.Log(logger.Warn, "Recordings folder does not exist: %s", recordingsPath)
		return "", fmt.Errorf("recordings folder does not exist: %s", recordingsPath)
	}

	// Create zip buffer
	var zipBuffer bytes.Buffer
	zipWriter := zip.NewWriter(&zipBuffer)

	// Walk through recordings folder and add files to zip
	err := filepath.Walk(recordingsPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories
		if info.IsDir() {
			return nil
		}

		// Create relative path for zip
		relPath, err := filepath.Rel(recordingsPath, path)
		if err != nil {
			a.Log(logger.Error, "Failed to create relative path: %v", err)
			return err
		}

		// Create zip file entry
		zipFile, err := zipWriter.Create(relPath)
		if err != nil {
			a.Log(logger.Error, "Failed to create zip file entry: %v", err)
			return err
		}

		// Open and copy file content
		file, err := os.Open(path)
		if err != nil {
			a.Log(logger.Error, "Failed to open file: %v", err)
			return err
		}
		defer file.Close()

		_, err = io.Copy(zipFile, file)
		if err != nil {
			a.Log(logger.Error, "Failed to copy file: %v", err)
		}
		return err
	})

	if err != nil {
		return "", fmt.Errorf("failed to create zip file: %w", err)
	}

	// Close zip writer
	err = zipWriter.Close()
	if err != nil {
		return "", fmt.Errorf("failed to close zip writer: %w", err)
	}

	// Generate unique filename
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	filename := fmt.Sprintf("recordings_%s_camera_%d_site_%d.zip", timestamp, event.CameraId, event.SiteId)

	// Get zip content
	zipContent := zipBuffer.Bytes()
	contentType := "application/zip"
	upsert := false

	// Upload to alarm-snapshots bucket
	_, err = a.supabaseClient.Storage.UploadFile("alarm-snapshots", filename, bytes.NewReader(zipContent), storage.FileOptions{
		ContentType: &contentType,
		Upsert:      &upsert,
	})

	if err != nil {
		return "", fmt.Errorf("failed to upload recordings zip to bucket: %w", err)
	}

	// Generate public URL for the uploaded file
	publicURL := fmt.Sprintf("%s/storage/v1/object/public/alarm-snapshots/%s", a.conf.SupabaseURL, filename)

	a.Log(logger.Info, "Successfully uploaded recordings zip: %s (size: %d bytes)", filename, len(zipContent))
	a.Log(logger.Info, "Public URL: %s", publicURL)
	return publicURL, nil
}
