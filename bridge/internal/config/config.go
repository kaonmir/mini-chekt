// Package config provides configuration management for the bridge service.
package config

import (
	"os"
	"strconv"
)

// Config holds all configuration values for the bridge service.
type Config struct {
	BridgeUUID   string
	ServerURL    string
	WebSocketURL string
	SMTPPort     int
	HTTPPort     int
	Debug        bool
	SiteId       string
	CameraPath   string
	SupabaseURL  string
	SupabaseKey  string
}

// Load loads configuration from environment variables.
func Load() *Config {
	config := &Config{
		BridgeUUID:   getEnv("BRIDGE_UUID", ""),
		ServerURL:    getEnv("SERVER_URL", "http://localhost:8080"),
		WebSocketURL: getEnv("WEBSOCKET_URL", "ws://localhost:8080"),
		SMTPPort:     getEnvAsInt("SMTP_PORT", 1025),
		HTTPPort:     getEnvAsInt("HTTP_PORT", 8081),
		Debug:        getEnvAsBool("DEBUG", false),
		SiteId:       getEnv("SITE_ID", "1"),
		CameraPath:   getEnv("CAMERA_PATH", "camera.csv"),

		SupabaseURL: getEnv("SUPABASE_URL", ""),
		SupabaseKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
	}

	return config
}

// getEnv gets an environment variable with a default value.
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt gets an environment variable as an integer with a default value.
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// getEnvAsBool gets an environment variable as a boolean with a default value.
func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}
