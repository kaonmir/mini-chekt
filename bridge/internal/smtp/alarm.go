package smtp

import (
	"encoding/base64"
	"strings"
	"time"

	"github.com/kaonmir/bridge/internal/logger"
)

type DahuaData struct {
	EventType    string
	InputChannel string
	StartTime    time.Time
	DeviceName   string
	AlarmName    string
	IPAddress    string
}

func (s *Session) handleMail(data []byte) {
	parts, err := ParseMultipartEmail(data)

	s.logger.Log(logger.Debug, "Parsed %d parts", len(parts))
	if err != nil {
		s.logger.Log(logger.Error, "Failed to parse email: %v", err)
		return
	}

	if len(parts) == 0 {
		s.logger.Log(logger.Error, "No parts found in email")
		return
	}

	if !strings.HasPrefix(parts[0].ContentType, "text/plain") {
		s.logger.Log(logger.Error, "Email content is not text/plain")
		return
	}

	content, err := base64.StdEncoding.DecodeString(string(parts[0].Content))
	if err != nil {
		s.logger.Log(logger.Error, "Failed to decode base64 content: %v", err)
		return
	}

	contentStr := string(content)

	// Check if this is a Dahua alarm event
	if !strings.HasPrefix(contentStr, "Alarm Event:") &&
		!strings.Contains(contentStr, "Alarm Device Name:") &&
		!strings.Contains(contentStr, "Alarm Input Channel:") {
		s.logger.Log(logger.Debug, "Email content is not a Dahua alarm event")
		return
	}

	s.logger.Log(logger.Debug, "Email content is a Dahua alarm event")

	// Parse the alarm data
	dahuaData := s.parseDahuaAlarm(contentStr)
	if dahuaData == nil {
		s.logger.Log(logger.Error, "Failed to parse Dahua alarm data")
		return
	}

	// TODO: Insert alarm into database
	// For now, just log the parsed data
	s.logger.Log(logger.Info, "Parsed Dahua alarm data: EventType=%s, DeviceName=%s, StartTime=%s, IPAddress=%s",
		dahuaData.EventType, dahuaData.DeviceName, dahuaData.StartTime.Format(time.RFC3339), dahuaData.IPAddress)

}

func (s *Session) parseDahuaAlarm(content string) *DahuaData {
	lines := strings.Split(content, "\n")
	dahuaData := &DahuaData{}

	// Parse each line based on Dahua email format
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Parse each line based on the Dahua format
		if strings.HasPrefix(line, "Alarm Event:") {
			dahuaData.EventType = strings.TrimSpace(strings.TrimPrefix(line, "Alarm Event:"))
		} else if strings.HasPrefix(line, "Alarm Start Time(D/M/Y H:M:S):") || strings.HasPrefix(line, "Alarm Stop Time(D/M/Y H:M:S):") {
			timeStr := strings.TrimSpace(strings.TrimPrefix(strings.TrimPrefix(line, "Alarm Start Time(D/M/Y H:M:S):"), "Alarm Stop Time(D/M/Y H:M:S):"))
			if parsedTime, err := time.Parse("02/01/2006 15:04:05", timeStr); err == nil {
				dahuaData.StartTime = parsedTime
			} else {
				// Try alternative format if the first one fails
				if parsedTime, err := time.Parse("2006-01-02 15:04:05", timeStr); err == nil {
					dahuaData.StartTime = parsedTime
				}
			}
		} else if strings.HasPrefix(line, "Alarm Device Name:") {
			dahuaData.DeviceName = strings.TrimSpace(strings.TrimPrefix(line, "Alarm Device Name:"))
		} else if strings.HasPrefix(line, "IP Address:") {
			dahuaData.IPAddress = strings.TrimSpace(strings.TrimPrefix(line, "IP Address:"))
		}
	}

	// Validate that we have the minimum required information
	if dahuaData.EventType == "" {
		s.logger.Log(logger.Error, "Missing required field: Alarm Event")
		return nil
	}

	// Set default values if not provided
	if dahuaData.StartTime.IsZero() {
		dahuaData.StartTime = time.Now()
	}
	if dahuaData.AlarmName == "" {
		dahuaData.AlarmName = dahuaData.EventType
	}

	return dahuaData
}
