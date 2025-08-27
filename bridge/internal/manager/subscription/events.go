package subscription

import (
	"github.com/kaonmir/bridge/internal/logger"
	realtimego "github.com/kaonmir/bridge/pkg/realtime-go"
	"github.com/supabase-community/supabase-go"
)

// m.Payload: {"event":"Test message","payload":{"message":"Hello World"},"type":"broadcast"}

type session struct {
	log       *logger.Logger
	db        *supabase.Client
	ch        *realtimego.Channel
	bridge_id int64
}

func (s *Subscription) onBroadcast(m realtimego.Message) {
	event := m.Payload.(map[string]interface{})["event"].(string)
	payload := m.Payload.(map[string]interface{})["payload"].(map[string]interface{})

	request_id, ok := payload["request_id"].(string)
	if !ok || request_id == "" {
		s.log.Log(logger.Error, "Request ID is null")
		return
	}

	server_id, ok := payload["server_id"].(string)
	if !ok || server_id == "" {
		s.log.Log(logger.Error, "Server ID is null")
		return
	}

	session := &session{
		log:       s.log,
		db:        s.supabase.Client,
		ch:        s.ch,
		bridge_id: s.BridgeId,
	}

	session.handleEvent(event, payload)
}

func (s *session) respond(payload map[string]interface{}) {
	request_id := payload["request_id"].(string)
	server_id := payload["server_id"].(string)

	responseData := map[string]interface{}{
		"bridge_id":     s.bridge_id,
		"request_id":    request_id,
		"server_id":     server_id,
		"request_path":  "",
		"response_body": payload,
	}
	s.db.From("response").Insert(responseData, false, "", "", "").Execute()
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

func (s *session) onCameras(payload map[string]interface{}) {
	s.log.Log(logger.Info, "Cameras received: %v", payload)

	s.respond(payload)
}
