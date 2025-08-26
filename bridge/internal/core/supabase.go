package core

import (
	"fmt"
	"log"

	"github.com/joho/godotenv"
	"github.com/kaonmir/bridge/internal/config"
	"github.com/supabase-community/supabase-go"
)

// NewSupabaseClient creates a new Supabase client with proper configuration
func NewSupabaseClient(cfg *config.Config) (*supabase.Client, error) {
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

	client, err := supabase.NewClient(cfg.SupabaseURL, cfg.SupabaseKey, &supabase.ClientOptions{
		Headers: map[string]string{
			"Authorization": "Bearer " + cfg.SupabaseKey,
			"apikey":        cfg.SupabaseKey,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Supabase client: %w", err)
	}

	return client, nil
}
