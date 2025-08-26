package recorder

import (
	"fmt"
	"time"

	"github.com/kaonmir/bridge/internal/config"
	"github.com/kaonmir/bridge/internal/logger"
	"github.com/kaonmir/bridge/internal/supabase"
)

// Example usage of the recorder
func ExampleUsage() {
	// Initialize logger
	log := logger.New()

	// Initialize config (you'll need to provide actual config)
	cfg := &config.Config{
		BridgeUUID: "example-bridge-uuid",
	}

	// Initialize Supabase client
	supabaseClient, err := supabase.NewSupabaseClient(cfg)
	if err != nil {
		log.Log(logger.Error, "Failed to create Supabase client: %v", err)
		return
	}

	// Create recorder
	recorder := NewRecorder(log, supabaseClient)

	// Load cameras for a specific bridge
	bridgeID := "1" // Replace with actual bridge ID
	err = recorder.LoadCameras(bridgeID)
	if err != nil {
		log.Log(logger.Error, "Failed to load cameras: %v", err)
		return
	}

	// Wait for some time to collect packets
	time.Sleep(10 * time.Second)

	// Get all active recorders
	recorders := recorder.GetAllRecorders()
	for cameraID, cameraRecorder := range recorders {
		packetCount := cameraRecorder.GetPacketCount()
		log.Log(logger.Info, "Camera %s has %d packets", cameraID, packetCount)

		// Get latest 5 packets
		latestPackets := cameraRecorder.GetLatestPackets(5)
		log.Log(logger.Info, "Latest %d packets for camera %s", len(latestPackets), cameraID)

		// Get packets from last 30 seconds
		since := time.Now().Add(-30 * time.Second)
		recentPackets := cameraRecorder.GetPackets(since)
		log.Log(logger.Info, "Packets from last 30 seconds for camera %s: %d", cameraID, len(recentPackets))
	}

	// Stop all recorders
	recorder.StopAll()
}

// Example of getting packets for a specific camera
func ExampleGetCameraPackets(recorder *Recorder, cameraID string) {
	cameraRecorder, exists := recorder.GetRecorder(cameraID)
	if !exists {
		fmt.Printf("Camera %s not found\n", cameraID)
		return
	}

	// Get packet count
	count := cameraRecorder.GetPacketCount()
	fmt.Printf("Camera %s has %d packets\n", cameraID, count)

	// Get latest packets
	latest := cameraRecorder.GetLatestPackets(10)
	fmt.Printf("Latest %d packets:\n", len(latest))
	for i, packet := range latest {
		fmt.Printf("  Packet %d: %d bytes at %s\n", i+1, len(packet.Data), packet.Timestamp.Format(time.RFC3339))
	}

	// Get packets from specific time
	since := time.Now().Add(-60 * time.Second) // Last minute
	recent := cameraRecorder.GetPackets(since)
	fmt.Printf("Packets from last minute: %d\n", len(recent))
}
