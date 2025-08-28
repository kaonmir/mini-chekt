package smtp

import (
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/bluenviron/mediamtx/internal/defs"
	"github.com/bluenviron/mediamtx/internal/logger"
	"github.com/bluenviron/mediamtx/internal/servers/smtp"
)

type dahuaParserParent interface {
	logger.Writer
}

func NewDahuaParser(parent dahuaParserParent) *DahuaParser {
	return &DahuaParser{
		parent: parent,
	}
}

type DahuaParser struct {
	parent dahuaParserParent
}

func (d *DahuaParser) Log(level logger.Level, format string, args ...interface{}) {
	d.parent.Log(level, "[DahuaParser] "+format, args...)
}

// IsAlarm checks if the email content contains a Dahua alarm event
func (d *DahuaParser) IsAlarm(data interface{}) (bool, error) {
	email, ok := data.(*smtp.Mail)
	if !ok {
		return false, fmt.Errorf("data is not a *smtp.Mail")
	}

	// Check if Parts array is empty
	if len(email.Parts) == 0 {
		d.Log(logger.Debug, "Email has no parts, using raw content")
		// Use raw content as fallback
		contentStr := string(email.Content)
		return (strings.HasPrefix(strings.TrimSpace(contentStr), "Alarm Event:") ||
			strings.Contains(contentStr, "Alarm Device Name:") ||
			strings.Contains(contentStr, "Alarm Input Channel:")), nil
	}

	if !strings.HasPrefix(email.Parts[0].ContentType, "text/plain") {
		d.Log(logger.Debug, "Email content type is not text/plain: %s", email.Parts[0].ContentType)
		return false, nil
	}

	// Try to decode as base64 first
	content, err := base64.StdEncoding.DecodeString(string(email.Parts[0].Content))
	if err != nil {
		d.Log(logger.Debug, "Content is not base64 encoded, using raw content")
		// If not base64, use raw content
		content = email.Parts[0].Content
	}

	// Check for Dahua-specific alarm indicators
	contentStr := string(content)
	return (strings.HasPrefix(strings.TrimSpace(contentStr), "Alarm Event:") ||
		strings.Contains(contentStr, "Alarm Device Name:") ||
		strings.Contains(contentStr, "Alarm Input Channel:")), nil
}

// ParseAlarm parses email content to extract Dahua alarm event information
func (d *DahuaParser) ParseAlarm(data interface{}) (*defs.PublicAlarmInsert, error) {
	email, ok := data.(*smtp.Mail)
	if !ok {
		return nil, fmt.Errorf("data is not a *smtp.Mail")
	}

	var content string

	// Check if Parts array is empty
	if len(email.Parts) == 0 {
		d.Log(logger.Debug, "Email has no parts, using raw content")
		content = string(email.Content)
	} else {
		// Try to decode as base64 first
		decodedContent, err := base64.StdEncoding.DecodeString(string(email.Parts[0].Content))
		if err != nil {
			d.Log(logger.Debug, "Content is not base64 encoded, using raw content")
			// If not base64, use raw content
			content = string(email.Parts[0].Content)
		} else {
			content = string(decodedContent)
		}
	}

	lines := strings.Split(content, "\n")
	dahuaData := &defs.PublicAlarmInsert{}

	// Parse each line based on Dahua email format
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Parse each line based on the Dahua format
		if strings.HasPrefix(line, "Alarm Event:") {
			dahuaData.AlarmName = strings.TrimSpace(strings.TrimPrefix(line, "Alarm Event:"))
		} else if strings.HasPrefix(line, "Alarm Start Time(D/M/Y H:M:S):") || strings.HasPrefix(line, "Alarm Stop Time(D/M/Y H:M:S):") {
			timeStr := strings.TrimSpace(strings.TrimPrefix(strings.TrimPrefix(line, "Alarm Start Time(D/M/Y H:M:S):"), "Alarm Stop Time(D/M/Y H:M:S):"))
			if parsedTime, err := time.Parse("02/01/2006 15:04:05", timeStr); err == nil {
				parsedTimeStr := parsedTime.Format(time.RFC3339)
				dahuaData.LastAlarmAt = &parsedTimeStr
			} else {
				// Try alternative format if the first one fails
				if parsedTime, err := time.Parse("2006-01-02 15:04:05", timeStr); err == nil {
					parsedTimeStr := parsedTime.Format(time.RFC3339)
					dahuaData.LastAlarmAt = &parsedTimeStr
				}
			}
		} else if strings.HasPrefix(line, "Alarm Device Name:") {
			dahuaData.CameraId = 1 // TODO!!!!
		} else if strings.HasPrefix(line, "IP Address:") {
			dahuaData.BridgeId = 1 // TODO!!!
		}
	}

	// Validate that we have the minimum required information
	if dahuaData.AlarmName == "" {
		d.Log(logger.Error, "Missing required field: Alarm Event")
		return nil, fmt.Errorf("missing required field: Alarm Event")
	}

	d.Log(logger.Info, "Parsed Dahua alarm event: %s from device %s", dahuaData.AlarmName, dahuaData.CameraId)

	// Convert LegacyType to Event
	event := &defs.PublicAlarmInsert{
		AlarmName:   dahuaData.AlarmName,
		LastAlarmAt: dahuaData.LastAlarmAt,
		CameraId:    dahuaData.CameraId,
		BridgeId:    dahuaData.BridgeId,
	}

	return event, nil
}
