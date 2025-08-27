package subscription

import (
	"fmt"

	"github.com/kaonmir/bridge/internal/logger"
	"github.com/kaonmir/bridge/internal/supabase"
	realtimego "github.com/kaonmir/bridge/pkg/realtime-go"
)

// Subscription manages Supabase realtime subscriptions
type Subscription struct {
	supabase *supabase.Supabase
	log      *logger.Logger
	BridgeId int64
	ch       *realtimego.Channel
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
	ch, err := s.supabase.Realtime.Channel(
		realtimego.WithBroadcast("bridge-" + fmt.Sprintf("%d", s.BridgeId)),
	)
	if err != nil {
		return err
	}

	ch.OnBroadcast = s.onBroadcast

	err = ch.Subscribe()
	if err != nil {
		return err
	}

	s.ch = ch

	s.log.Log(logger.Info, "Successfully subscribed to alarm table")
	return nil

}

func (s *Subscription) Stop() error {
	if s.ch != nil {
		s.ch.Unsubscribe()
	}
	return nil
}
