package subscription

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/kaonmir/bridge/internal/logger"
	"github.com/kaonmir/bridge/internal/manager/discover"
	"github.com/kaonmir/bridge/internal/manager/recorder"
	realtimego "github.com/kaonmir/bridge/pkg/realtime-go"
	"github.com/supabase-community/supabase-go"
)

// m.Payload: {"event":"Test message","payload":{"message":"Hello World"},"type":"broadcast"}

type session struct {
	log *logger.Logger
	db  *supabase.Client
	ch  *realtimego.Channel

	event        string
	request_id   string
	requester_id string
	bridge_id    int64

	recorderManager *recorder.Manager
}

func (s *Subscription) onBroadcast(m realtimego.Message) {
	event := m.Payload.(map[string]interface{})["event"].(string)
	payload := m.Payload.(map[string]interface{})["payload"].(map[string]interface{})

	ok := true
	_ = ok
	request_id, ok := payload["request_id"].(string)
	// if !ok || request_id == "" {
	// 	s.log.Log(logger.Error, "Request ID is null")
	// 	return
	// }

	requester_id, ok := payload["requester_id"].(string)
	// if !ok {
	// 	s.log.Log(logger.Error, "Requester ID is null")
	// 	return
	// }

	session := &session{
		log:             s.log,
		db:              s.supabase.Client,
		ch:              s.ch,
		event:           event,
		request_id:      request_id,
		requester_id:    requester_id,
		bridge_id:       s.BridgeId,
		recorderManager: s.recorderManager,
	}

	session.handleEvent(event, payload)
}

func (s *session) respond(payload map[string]interface{}) {

	responseData := map[string]interface{}{
		"bridge_id":     s.bridge_id,
		"request_id":    s.request_id,
		"requester_id":  s.requester_id,
		"request_path":  s.event,
		"response_body": payload,
	}
	_, _, err := s.db.From("response").Insert(responseData, false, "", "", "").Execute()
	if err != nil {
		s.log.Log(logger.Error, "[%s] [%s] Failed to insert response: %v", s.event, s.request_id, err)
	}
}

func (s *session) handleEvent(event string, payload map[string]interface{}) {
	switch event {
	case "/api/v1/cameras":
		s.onCameras(payload)

	// ! Test
	case "Test message":
		s.onCameras(payload) // ? Test
	case "/api/v1/test/get-video-snapshot":
		s.onGetVideoSnapshot(payload)
	}
}

// -- Event handlers --
func (s *session) onCameras(_ map[string]interface{}) {
	devices, err := discover.DiscoverDevices()
	if err != nil {
		s.log.Log(logger.Error, "[%s] [%s] Failed to discover devices: %v", s.event, s.request_id, err)
		return
	}

	s.log.Log(logger.Info, "[%s] [%s] Found %d devices", s.event, s.request_id, len(devices))
	s.respond(map[string]interface{}{
		"devices": devices,
	})
}

func (s *session) onGetVideoSnapshot(_ map[string]interface{}) {
	snapshots := s.recorderManager.GetAllSnapshots()
	video_data := s.recorderManager.GetAllPackets()

	// Save snapshots and video data to /Users/json/Code/chekt/data/
	dataDir := "/Users/json/Code/chekt/data/"

	// Create directory if it doesn't exist
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		s.log.Log(logger.Error, "[%s] [%s] Failed to create data directory: %v", s.event, s.request_id, err)
	} else {
		// Save snapshots
		for cameraID, cameraSnapshots := range snapshots {
			for i, snapshot := range cameraSnapshots {
				filename := fmt.Sprintf("camera_%d_snapshot_%d_%d.jpg", cameraID, snapshot.Timestamp.Unix(), i)
				filepath := filepath.Join(dataDir, filename)
				if err := os.WriteFile(filepath, snapshot.Data, 0644); err != nil {
					s.log.Log(logger.Error, "[%s] [%s] Failed to save snapshot %s: %v", s.event, s.request_id, filename, err)
				} else {
					s.log.Log(logger.Info, "[%s] [%s] Saved snapshot: %s", s.event, s.request_id, filename)
				}
			}
		}

		// Save video data
		for cameraID, packets := range video_data {
			if len(packets) > 0 {
				filename := fmt.Sprintf("camera_%d_video_%d.raw", cameraID, time.Now().Unix())
				filepath := filepath.Join(dataDir, filename)

				file, err := os.Create(filepath)
				if err != nil {
					s.log.Log(logger.Error, "[%s] [%s] Failed to create video file %s: %v", s.event, s.request_id, filename, err)
					continue
				}

				for _, packet := range packets {
					if _, err := file.Write(packet.Data); err != nil {
						s.log.Log(logger.Error, "[%s] [%s] Failed to write packet to %s: %v", s.event, s.request_id, filename, err)
						break
					}
				}
				file.Close()
				s.log.Log(logger.Info, "[%s] [%s] Saved video data: %s", s.event, s.request_id, filename)
			}
		}
	}

}
