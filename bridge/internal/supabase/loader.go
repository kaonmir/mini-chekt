package supabase

import (
	"fmt"
	"log"

	"github.com/joho/godotenv"
	"github.com/kaonmir/bridge/internal/config"
	realtimego "github.com/kaonmir/bridge/pkg/realtime-go"
	supabase "github.com/supabase-community/supabase-go"
)

type Supabase struct {
	Client   *supabase.Client
	Realtime *realtimego.Client
}

// NewSupabaseClient creates a new Supabase client with proper configuration
func NewSupabaseClient(cfg *config.Config) (*Supabase, error) {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found or could not be loaded: %v", err)
	}

	if cfg.SupabaseURL == "" {
		return nil, fmt.Errorf("SUPABASE_URL environment variable is required")
	}
	if cfg.SupabaseKey == "" {
		return nil, fmt.Errorf("SUPABASE_SERVICE_ROLE_KEY environment variable is required")
	}

	//! Create Supabase client
	client, err := supabase.NewClient(cfg.SupabaseURL, cfg.SupabaseKey, &supabase.ClientOptions{
		Headers: map[string]string{
			"Authorization": "Bearer " + cfg.SupabaseKey,
			"apikey":        cfg.SupabaseKey,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Supabase client: %w", err)
	}

	//! Create realtime client
	realtimeClient, err := realtimego.NewClient(cfg.SupabaseURL, cfg.SupabaseKey)
	if err != nil {
		return nil, fmt.Errorf("failed to create realtime client: %w", err)
	}

	err = realtimeClient.Connect()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to realtime server: %w", err)
	}

	return &Supabase{
		Client:   client,
		Realtime: realtimeClient,
	}, nil
}
