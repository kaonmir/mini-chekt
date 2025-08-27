package subscription

import (
	"fmt"

	"github.com/kaonmir/bridge/internal/logger"
	"github.com/kaonmir/bridge/internal/supabase"
	realtimego "github.com/kaonmir/bridge/pkg/realtime-go"
)

// Subscription manages Supabase realtime subscriptions
type Subscription struct {
	supabase         *supabase.Supabase
	log              *logger.Logger
	BridgeId         int64
	broadcastChannel *realtimego.Channel
}

// NewSubscription creates a new subscription manager
func NewSubscription(supabase *supabase.Supabase, log *logger.Logger, bridgeId int64) *Subscription {
	return &Subscription{
		supabase: supabase,
		log:      log,
		BridgeId: bridgeId,
	}
}

// Start sets up all subscriptions
func (s *Subscription) Start() error {
	broadcastChannel, err := s.supabase.Realtime.Channel(
		realtimego.WithBroadcast("bridge-" + fmt.Sprintf("%d", s.BridgeId)),
	)
	if err != nil {
		return err
	}

	broadcastChannel.OnBroadcast = func(m realtimego.Message) {
		payload := m.Payload.(map[string]interface{})

		s.log.Log(logger.Info, "Alarm received: %v", payload)
	}

	err = broadcastChannel.Subscribe()
	if err != nil {
		return err
	}

	s.broadcastChannel = broadcastChannel

	s.log.Log(logger.Info, "Successfully subscribed to alarm table")
	return nil

}

func (s *Subscription) Stop() error {
	if s.broadcastChannel != nil {
		s.broadcastChannel.Unsubscribe()
	}
	return nil
}
