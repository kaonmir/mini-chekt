package subscription

import (
	"github.com/kaonmir/bridge/internal/logger"
	realtimego "github.com/overseedio/realtime-go"
)

// Subscription manages Supabase realtime subscriptions
type Subscription struct {
	realtimeClient *realtimego.Client
	log            *logger.Logger
}

// NewSubscription creates a new subscription manager
func NewSubscription(realtimeClient *realtimego.Client, log *logger.Logger) *Subscription {
	return &Subscription{
		realtimeClient: realtimeClient,
		log:            log,
	}
}

// SetupAlarmSubscription sets up subscription for alarm table
func (s *Subscription) SetupAlarmSubscription() error {
	// create and subscribe to channel
	db := "realtime"
	schema := "public"
	table := "alarm"

	ch, err := s.realtimeClient.Channel(realtimego.WithTable(&db, &schema, &table))
	if err != nil {
		return err
	}

	// setup hooks
	ch.OnInsert = func(m realtimego.Message) {
		s.log.Log(logger.Info, "Alarm INSERT: %v", m)
		// TODO: Handle alarm insert event
	}

	ch.OnDelete = func(m realtimego.Message) {
		s.log.Log(logger.Info, "Alarm DELETE: %v", m)
		// TODO: Handle alarm delete event
	}

	ch.OnUpdate = func(m realtimego.Message) {
		s.log.Log(logger.Info, "Alarm UPDATE: %v", m)
		// TODO: Handle alarm update event
	}

	// subscribe to channel
	err = ch.Subscribe()
	if err != nil {
		return err
	}

	s.log.Log(logger.Info, "Successfully subscribed to alarm table")
	return nil
}

// SetupCameraSubscription sets up subscription for camera table
func (s *Subscription) SetupCameraSubscription() error {
	// create and subscribe to channel
	db := "realtime"
	schema := "public"
	table := "camera"

	ch, err := s.realtimeClient.Channel(realtimego.WithTable(&db, &schema, &table))
	if err != nil {
		return err
	}

	// setup hooks
	ch.OnInsert = func(m realtimego.Message) {
		s.log.Log(logger.Info, "Camera INSERT: %v", m)
		// TODO: Handle camera insert event
	}

	ch.OnDelete = func(m realtimego.Message) {
		s.log.Log(logger.Info, "Camera DELETE: %v", m)
		// TODO: Handle camera delete event
	}

	ch.OnUpdate = func(m realtimego.Message) {
		s.log.Log(logger.Info, "Camera UPDATE: %v", m)
		// TODO: Handle camera update event
	}

	// subscribe to channel
	err = ch.Subscribe()
	if err != nil {
		return err
	}

	s.log.Log(logger.Info, "Successfully subscribed to camera table")
	return nil
}

// SetupBridgeSubscription sets up subscription for bridge table
func (s *Subscription) SetupBridgeSubscription() error {
	// create and subscribe to channel
	db := "realtime"
	schema := "public"
	table := "bridge"

	ch, err := s.realtimeClient.Channel(realtimego.WithTable(&db, &schema, &table))
	if err != nil {
		return err
	}

	// setup hooks
	ch.OnInsert = func(m realtimego.Message) {
		s.log.Log(logger.Info, "Bridge INSERT: %v", m)
		// TODO: Handle bridge insert event
	}

	ch.OnDelete = func(m realtimego.Message) {
		s.log.Log(logger.Info, "Bridge DELETE: %v", m)
		// TODO: Handle bridge delete event
	}

	ch.OnUpdate = func(m realtimego.Message) {
		s.log.Log(logger.Info, "Bridge UPDATE: %v", m)
		// TODO: Handle bridge update event
	}

	// subscribe to channel
	err = ch.Subscribe()
	if err != nil {
		return err
	}

	s.log.Log(logger.Info, "Successfully subscribed to bridge table")
	return nil
}

// SetupAllSubscriptions sets up all subscriptions
func (s *Subscription) SetupAllSubscriptions() error {
	subscriptions := []func() error{
		s.SetupAlarmSubscription,
		s.SetupCameraSubscription,
		s.SetupBridgeSubscription,
	}

	for _, setupFunc := range subscriptions {
		if err := setupFunc(); err != nil {
			s.log.Log(logger.Error, "Failed to setup subscription: %v", err)
			return err
		}
	}

	s.log.Log(logger.Info, "All subscriptions setup completed")
	return nil
}
