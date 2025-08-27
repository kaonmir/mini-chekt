package recorder

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/kaonmir/bridge/internal/logger"
	"github.com/kaonmir/bridge/internal/manager/toolbox"
)

// Packet represents a video packet with timestamp
type Packet struct {
	Data      []byte
	Timestamp time.Time
}

// Manager manages multiple camera recorders
type Manager struct {
	recorders map[int64]*Recorder
	mutex     sync.RWMutex
	log       *logger.Logger
}

// NewManager creates camera recorders for multiple cameras
func NewManager(cameras []toolbox.Camera, log *logger.Logger) *Manager {

	log.Log(logger.Info, "Creating recorder manager for %d cameras", len(cameras))

	recorders := make(map[int64]*Recorder)

	for _, camera := range cameras {
		// Use the RTSP URL from the camera if available, otherwise construct it
		rtspURL := camera.RTSPURL
		if rtspURL == "" {
			rtspURL = fmt.Sprintf("rtsp://%s:%s@%s:554/stream1", camera.Username, camera.Password, camera.IPAddress)
		}

		ctx, cancel := context.WithCancel(context.Background())

		recorders[camera.Id] = &Recorder{
			CameraID:     camera.Id,
			IPAddress:    camera.IPAddress,
			Username:     camera.Username,
			Password:     camera.Password,
			RTSPURL:      rtspURL,
			packets:      make([]*Packet, 0),
			maxPackets:   140, // 140 seconds worth of packets
			packetTTL:    140 * time.Second,
			snapshots:    make([]*Snapshot, 0),
			maxSnapshots: 8, // Keep 8 snapshots
			ctx:          ctx,
			cancel:       cancel,
			log:          log,
		}
	}

	return &Manager{
		recorders: recorders,
		log:       log,
	}
}

// GetRecorder returns a camera recorder by ID
func (r *Manager) GetRecorder(cameraID int64) (*Recorder, bool) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	recorder, exists := r.recorders[cameraID]
	return recorder, exists
}

// GetAllRecorders returns all active recorders
func (r *Manager) GetAllRecorders() map[int64]*Recorder {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	result := make(map[int64]*Recorder)
	for id, recorder := range r.recorders {
		result[id] = recorder
	}
	return result
}

func (r *Manager) GetAllSnapshots() map[int64][]*Snapshot {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	result := make(map[int64][]*Snapshot)
	for id, recorder := range r.recorders {
		result[id] = recorder.GetSnapshots()
	}
	return result
}

func (r *Manager) GetAllPackets() map[int64][]*Packet {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	result := make(map[int64][]*Packet)
	for id, recorder := range r.recorders {
		result[id] = recorder.GetPackets(time.Now().Add(-140 * time.Second))
	}
	return result
}

// StartAll starts all recorders
func (r *Manager) StartAll() {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	for cameraID, recorder := range r.recorders {
		if err := recorder.Start(); err != nil {
			r.log.Log(logger.Error, "Failed to start recorder for camera %s: %v", cameraID, err)
		} else {
			r.log.Log(logger.Info, "Started recorder for camera %s", cameraID)
		}
	}
}

// StopAll stops all recorders
func (r *Manager) StopAll() {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	for cameraID, recorder := range r.recorders {
		recorder.Stop()
		r.log.Log(logger.Info, "Stopped recorder for camera %s", cameraID)
	}
	r.recorders = make(map[int64]*Recorder)
}
