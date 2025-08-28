package subscriber

import (
	"fmt"
	"sync"

	"github.com/kaonmir/mini-chekt/internal/conf"
	"github.com/kaonmir/mini-chekt/internal/confdb"
	"github.com/kaonmir/mini-chekt/internal/logger"
	"github.com/kaonmir/mini-chekt/internal/onvif/discovery"
	realtimego "github.com/kaonmir/mini-chekt/pkg/realtime-go"
)

type SubscriberParent interface {
	logger.Writer
}

type Subscriber struct {
	Conf   *conf.Conf
	ConfDB *confdb.ConfDB

	ch *realtimego.Channel

	Parent SubscriberParent
	mutex  sync.RWMutex
}

func (s *Subscriber) Initialize() error {
	client, err := realtimego.NewClient(s.Conf.SupabaseURL, s.Conf.SupabaseKey)
	if err != nil {
		return fmt.Errorf("failed to create supabase realtime client: %w", err)
	}

	err = client.Connect()
	if err != nil {
		return fmt.Errorf("failed to connect to supabase realtime server: %w", err)
	}

	ch, err := client.Channel(
		realtimego.WithBroadcast(fmt.Sprintf("bridge-%d", s.ConfDB.BridgeId)),
	)
	if err != nil {
		return fmt.Errorf("failed to create realtime channel: %w", err)
	}

	ch.OnBroadcast = func(m realtimego.Message) {
		event := m.Payload.(map[string]interface{})["event"].(string)
		payload := m.Payload.(map[string]interface{})["payload"].(map[string]interface{})

		switch event {
		// ! Test
		case "Test message":
			s.onCameras(payload) // ? Test
		case "/api/v1/cameras":
			s.onCameras(payload)

		}
	}

	if err = ch.Subscribe(); err != nil {
		return fmt.Errorf("failed to subscribe to channel: %w", err)
	}

	s.Log(logger.Info, "subscribed to channel %s", ch.Topic)
	s.ch = ch

	return nil
}

// func (s *session) respond(payload map[string]interface{}) {
// 	responseData := map[string]interface{}{
// 		"bridge_id":     s.bridge_id,
// 		"request_id":    s.request_id,
// 		"requester_id":  s.requester_id,
// 		"request_path":  s.event,
// 		"response_body": payload,
// 	}
// 	_, _, err := s.db.From("response").Insert(responseData, false, "", "", "").Execute()
// 	if err != nil {
// 		s.log.Log(logger.Error, "[%s] [%s] Failed to insert response: %v", s.event, s.request_id, err)
// 	}
// }

func (s *Subscriber) Close() {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if s.ch != nil {
		s.ch.Unsubscribe()
	}
}

// Log implements logger.Writer.
func (s *Subscriber) Log(level logger.Level, format string, args ...interface{}) {
	s.Parent.Log(level, "[Subscriber] "+format, args...)
}

func (s *Subscriber) onCameras(payload map[string]interface{}) {
	devices, err := discovery.DiscoverDevices()
	if err != nil {
		s.Log(logger.Error, "failed to discover devices: %v", err)
		return
	}

	s.Log(logger.Info, "found %d devices", len(devices))
}
