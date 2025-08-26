// main executable for bridge service.
package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/kaonmir/bridge/internal/core"
)

func main() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found or could not be loaded: %v", err)
	}

	// SMTP bridge server only
	s, ok := core.New(os.Args[1:])
	if !ok {
		os.Exit(1)
	}
	s.Wait()
}
