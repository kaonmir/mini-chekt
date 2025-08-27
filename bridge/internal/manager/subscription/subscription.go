package subscription

import (
	"fmt"

	"github.com/kaonmir/bridge/internal/logger"
	"github.com/kaonmir/bridge/internal/manager/alarm"
	"github.com/kaonmir/bridge/internal/manager/recorder"
	"github.com/kaonmir/bridge/internal/manager/toolbox"
	"github.com/kaonmir/bridge/internal/supabase"
	realtimego "github.com/kaonmir/bridge/pkg/realtime-go"
)

// Subscription manages Supabase realtime subscriptions
type Subscription struct {
	supabase *supabase.Supabase

	toolbox         *toolbox.Toolbox
	alarmManager    *alarm.Manager
	recorderManager *recorder.Manager

	log      *logger.Logger
	BridgeId int64
	ch       *realtimego.Channel
}

// NewSubscription creates a new subscription manager
func NewSubscription(supabase *supabase.Supabase, log *logger.Logger, bridgeId int64, recorderManager *recorder.Manager) *Subscription {
	return &Subscription{
		supabase:        supabase,
		log:             log,
		BridgeId:        bridgeId,
		recorderManager: recorderManager,
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
