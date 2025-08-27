package subscription

import (
	"github.com/kaonmir/bridge/internal/logger"
	"github.com/kaonmir/bridge/internal/manager/discover"
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
}

func (s *Subscription) onBroadcast(m realtimego.Message) {
	event := m.Payload.(map[string]interface{})["event"].(string)
	payload := m.Payload.(map[string]interface{})["payload"].(map[string]interface{})

	request_id, ok := payload["request_id"].(string)
	if !ok || request_id == "" {
		s.log.Log(logger.Error, "Request ID is null")
		return
	}

	requester_id, ok := payload["requester_id"].(string)
	if !ok {
		s.log.Log(logger.Error, "Requester ID is null")
		return
	}

	session := &session{
		log:          s.log,
		db:           s.supabase.Client,
		ch:           s.ch,
		event:        event,
		request_id:   request_id,
		requester_id: requester_id,
		bridge_id:    s.BridgeId,
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
	case "Test message":
		s.onCameras(payload) // ? Test
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
