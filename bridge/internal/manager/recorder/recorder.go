package recorder

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/kaonmir/bridge/internal/logger"
	"github.com/kaonmir/bridge/internal/supabase"
	"github.com/kaonmir/bridge/internal/supabase/database"
)

// Packet represents a video packet with timestamp
type Packet struct {
	Data      []byte
	Timestamp time.Time
}

// CameraRecorder manages recording for a single camera
type CameraRecorder struct {
	CameraID  string
	IPAddress string
	Username  string
	Password  string
	RTSPURL   string

	packets    []*Packet
	mutex      sync.RWMutex
	maxPackets int
	packetTTL  time.Duration

	ctx    context.Context
	cancel context.CancelFunc
	log    *logger.Logger
}

// Recorder manages multiple camera recorders
type Recorder struct {
	recorders map[string]*CameraRecorder
	mutex     sync.RWMutex
	log       *logger.Logger
	supabase  *supabase.Supabase
}

// NewRecorder creates a new recorder instance
func NewRecorder(log *logger.Logger, supabase *supabase.Supabase) *Recorder {
	return &Recorder{
		recorders: make(map[string]*CameraRecorder),
		log:       log,
		supabase:  supabase,
	}
}

// NewCameraRecorder creates a new camera recorder
func NewCameraRecorder(cameraID, ipAddress, username, password string, log *logger.Logger) *CameraRecorder {
	rtspURL := fmt.Sprintf("rtsp://%s:%s@%s:554/cam/realmonitor?channel=1&subtype=0", username, password, ipAddress)

	ctx, cancel := context.WithCancel(context.Background())

	return &CameraRecorder{
		CameraID:   cameraID,
		IPAddress:  ipAddress,
		Username:   username,
		Password:   password,
		RTSPURL:    rtspURL,
		packets:    make([]*Packet, 0),
		maxPackets: 140, // 140 seconds worth of packets
		packetTTL:  140 * time.Second,
		ctx:        ctx,
		cancel:     cancel,
		log:        log,
	}
}

// Start begins recording for a camera
func (cr *CameraRecorder) Start() error {
	cr.log.Log(logger.Info, "Starting recorder for camera %s at %s", cr.CameraID, cr.IPAddress)

	go cr.recordStream()
	return nil
}

// Stop stops recording for a camera
func (cr *CameraRecorder) Stop() {
	cr.log.Log(logger.Info, "Stopping recorder for camera %s", cr.CameraID)
	cr.cancel()
}

// recordStream continuously records the RTSP stream
func (cr *CameraRecorder) recordStream() {
	cr.log.Log(logger.Info, "Starting RTSP stream recording for camera %s at %s", cr.CameraID, cr.RTSPURL)

	// For now, we'll simulate packet generation
	// In a real implementation, you would use an RTSP client library
	ticker := time.NewTicker(1 * time.Second) // 1 FPS for simulation
	defer ticker.Stop()

	for {
		select {
		case <-cr.ctx.Done():
			cr.log.Log(logger.Info, "Recording stopped for camera %s", cr.CameraID)
			return
		case <-ticker.C:
			// Simulate packet data (in real implementation, this would be actual video data)
			packetData := []byte(fmt.Sprintf("packet_%s_%d", cr.CameraID, time.Now().Unix()))
			cr.addPacket(packetData)
		}
	}
}

// addPacket adds a new packet and manages the 140-second limit
func (cr *CameraRecorder) addPacket(data []byte) {
	cr.mutex.Lock()
	defer cr.mutex.Unlock()

	now := time.Now()
	packet := &Packet{
		Data:      data,
		Timestamp: now,
	}

	// Add new packet
	cr.packets = append(cr.packets, packet)

	// Remove old packets that exceed 140 seconds
	cutoffTime := now.Add(-cr.packetTTL)
	for i, p := range cr.packets {
		if p.Timestamp.After(cutoffTime) {
			// Keep packets from this point forward
			cr.packets = cr.packets[i:]
			break
		}
	}

	// Also limit by packet count as a safety measure
	if len(cr.packets) > cr.maxPackets {
		cr.packets = cr.packets[len(cr.packets)-cr.maxPackets:]
	}
}

// GetPackets returns all packets within the specified time range
func (cr *CameraRecorder) GetPackets(since time.Time) []*Packet {
	cr.mutex.RLock()
	defer cr.mutex.RUnlock()

	var result []*Packet
	for _, packet := range cr.packets {
		if packet.Timestamp.After(since) {
			result = append(result, packet)
		}
	}
	return result
}

// GetLatestPackets returns the most recent packets
func (cr *CameraRecorder) GetLatestPackets(count int) []*Packet {
	cr.mutex.RLock()
	defer cr.mutex.RUnlock()

	if count >= len(cr.packets) {
		return append([]*Packet{}, cr.packets...)
	}

	return append([]*Packet{}, cr.packets[len(cr.packets)-count:]...)
}

// GetPacketCount returns the current number of stored packets
func (cr *CameraRecorder) GetPacketCount() int {
	cr.mutex.RLock()
	defer cr.mutex.RUnlock()
	return len(cr.packets)
}

// LoadCameras loads camera information from database and starts recording
func (r *Recorder) LoadCameras(bridgeID string) error {
	r.log.Log(logger.Info, "Loading cameras for bridge %s", bridgeID)

	// Query cameras from database
	data, _, err := r.supabase.Client.From("camera").
		Select("id, camera_name, ip_address, username, password", "", false).
		Eq("bridge_id", bridgeID).
		Eq("is_registered", "true").
		Eq("healthy", "true").
		Execute()

	if err != nil {
		return fmt.Errorf("failed to query cameras: %v", err)
	}

	var cameras []database.PublicCameraSelect
	if err := json.Unmarshal(data, &cameras); err != nil {
		return fmt.Errorf("failed to unmarshal camera data: %v", err)
	}

	r.mutex.Lock()
	defer r.mutex.Unlock()

	// Stop existing recorders that are no longer in the list
	for cameraID, recorder := range r.recorders {
		found := false
		for _, camera := range cameras {
			if fmt.Sprintf("%d", camera.Id) == cameraID {
				found = true
				break
			}
		}
		if !found {
			recorder.Stop()
			delete(r.recorders, cameraID)
			r.log.Log(logger.Info, "Stopped recorder for removed camera %s", cameraID)
		}
	}

	// Start recorders for cameras
	for _, camera := range cameras {
		cameraID := fmt.Sprintf("%d", camera.Id)

		// Skip if already recording
		if _, exists := r.recorders[cameraID]; exists {
			continue
		}

		// Create new recorder
		recorder := NewCameraRecorder(
			cameraID,
			camera.IpAddress,
			camera.Username,
			camera.Password,
			r.log,
		)

		// Start recording
		if err := recorder.Start(); err != nil {
			r.log.Log(logger.Error, "Failed to start recorder for camera %s: %v", cameraID, err)
			continue
		}

		r.recorders[cameraID] = recorder
		r.log.Log(logger.Info, "Started recorder for camera %s (%s)", cameraID, camera.CameraName)
	}

	return nil
}

// GetRecorder returns a camera recorder by ID
func (r *Recorder) GetRecorder(cameraID string) (*CameraRecorder, bool) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	recorder, exists := r.recorders[cameraID]
	return recorder, exists
}

// GetAllRecorders returns all active recorders
func (r *Recorder) GetAllRecorders() map[string]*CameraRecorder {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	result := make(map[string]*CameraRecorder)
	for id, recorder := range r.recorders {
		result[id] = recorder
	}
	return result
}

// StopAll stops all recorders
func (r *Recorder) StopAll() {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	for cameraID, recorder := range r.recorders {
		recorder.Stop()
		r.log.Log(logger.Info, "Stopped recorder for camera %s", cameraID)
	}
	r.recorders = make(map[string]*CameraRecorder)
}
