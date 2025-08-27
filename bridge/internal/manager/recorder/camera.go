package recorder

import (
	"context"
	"os/exec"
	"sync"
	"time"

	"github.com/kaonmir/bridge/internal/logger"
)

// Snapshot represents a video snapshot with timestamp
type Snapshot struct {
	Data      []byte
	Timestamp time.Time
}

// Recorder manages recording for a single camera
type Recorder struct {
	CameraID  int64
	IPAddress string
	Username  string
	Password  string
	RTSPURL   string

	packets    []*Packet
	mutex      sync.RWMutex
	maxPackets int
	packetTTL  time.Duration

	// Snapshot related fields
	snapshots        []*Snapshot
	snapshotMutex    sync.RWMutex
	maxSnapshots     int
	lastSnapshotTime time.Time

	ctx    context.Context
	cancel context.CancelFunc
	log    *logger.Logger
}

// Start begins recording for a camera
func (cr *Recorder) Start() error {
	cr.log.Log(logger.Info, "Starting recorder for camera %d at %s", cr.CameraID, cr.IPAddress)

	// Start snapshot generation goroutine
	// go cr.generateSnapshots() // TODO

	// Try gstreamer first, fallback to ffmpeg
	go func() {
		// Check if gstreamer is available
		if _, err := exec.LookPath("gst-launch-1.0"); err == nil {
			cr.recordStream()
		} else if _, err := exec.LookPath("ffmpeg"); err == nil {
			cr.recordStreamWithFFmpeg()
		} else {
			cr.log.Log(logger.Error, "gstreamer or ffmpeg not found")
			return
		}
	}()

	return nil
}

// Stop stops recording for a camera
func (cr *Recorder) Stop() {
	cr.log.Log(logger.Info, "Stopping recorder for camera %d", cr.CameraID)
	cr.cancel()
}

// addPacket adds a new packet and manages the 140-second limit
func (cr *Recorder) addPacket(data []byte) {
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
func (cr *Recorder) GetPackets(since time.Time) []*Packet {
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
func (cr *Recorder) GetLatestPackets(count int) []*Packet {
	cr.mutex.RLock()
	defer cr.mutex.RUnlock()

	if count >= len(cr.packets) {
		return append([]*Packet{}, cr.packets...)
	}

	return append([]*Packet{}, cr.packets[len(cr.packets)-count:]...)
}

// GetPacketCount returns the current number of stored packets
func (cr *Recorder) GetPacketCount() int {
	cr.mutex.RLock()
	defer cr.mutex.RUnlock()
	return len(cr.packets)
}

// addSnapshot adds a new snapshot and manages the 8-snapshot limit
func (cr *Recorder) addSnapshot(data []byte) {
	cr.snapshotMutex.Lock()
	defer cr.snapshotMutex.Unlock()

	now := time.Now()
	snapshot := &Snapshot{
		Data:      data,
		Timestamp: now,
	}

	// Add new snapshot
	cr.snapshots = append(cr.snapshots, snapshot)

	// Keep only the latest 8 snapshots
	if len(cr.snapshots) > cr.maxSnapshots {
		cr.snapshots = cr.snapshots[len(cr.snapshots)-cr.maxSnapshots:]
	}

	cr.lastSnapshotTime = now
}

// GetSnapshots returns all stored snapshots
func (cr *Recorder) GetSnapshots() []*Snapshot {
	cr.snapshotMutex.RLock()
	defer cr.snapshotMutex.RUnlock()

	result := make([]*Snapshot, len(cr.snapshots))
	copy(result, cr.snapshots)
	return result
}

// GetSnapshotCount returns the current number of stored snapshots
func (cr *Recorder) GetSnapshotCount() int {
	cr.snapshotMutex.RLock()
	defer cr.snapshotMutex.RUnlock()
	return len(cr.snapshots)
}

// generateSnapshots generates snapshots every 5 seconds
func (cr *Recorder) generateSnapshots() {
	cr.log.Log(logger.Info, "Starting snapshot generation for camera %d", cr.CameraID)

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-cr.ctx.Done():
			cr.log.Log(logger.Info, "Snapshot generation stopped for camera %d", cr.CameraID)
			return
		case <-ticker.C:
			cr.createSnapshot()
		}
	}
}

// createSnapshot creates a single snapshot from the RTSP stream
func (cr *Recorder) createSnapshot() {
	defer func() {
		if r := recover(); r != nil {
			cr.log.Log(logger.Error, "Panic in snapshot creation for camera %d: %v", cr.CameraID, r)
		}
	}()

	// Try gstreamer first, fallback to ffmpeg
	if _, err := exec.LookPath("gst-launch-1.0"); err == nil {
		cr.createSnapshotWithGStreamer()
	} else if _, err := exec.LookPath("ffmpeg"); err == nil {
		cr.createSnapshotWithFFmpeg()
	} else {
		cr.log.Log(logger.Error, "gstreamer or ffmpeg not found for snapshot generation")
	}
}

// createSnapshotWithGStreamer creates a snapshot using GStreamer
func (cr *Recorder) createSnapshotWithGStreamer() {
	// Use gstreamer to capture a single frame from RTSP stream
	// gst-launch-1.0 rtspsrc location=<rtsp_url> ! rtph264depay ! h264parse ! avdec_h264 ! videoconvert ! jpegenc ! fdsink
	gstreamerCmd := exec.CommandContext(cr.ctx, "gst-launch-1.0",
		"rtspsrc", "location="+cr.RTSPURL, "latency=0", "drop-on-latency=true",
		"!", "rtph264depay",
		"!", "h264parse",
		"!", "avdec_h264",
		"!", "videoconvert",
		"!", "jpegenc", "quality=85",
		"!", "fdsink")

	// Create pipe for reading snapshot data
	stdout, err := gstreamerCmd.StdoutPipe()
	if err != nil {
		cr.log.Log(logger.Error, "Failed to create stdout pipe for snapshot camera %d: %v", cr.CameraID, err)
		return
	}

	// Start gstreamer process
	if err := gstreamerCmd.Start(); err != nil {
		cr.log.Log(logger.Error, "Failed to start gstreamer for snapshot camera %d: %v", cr.CameraID, err)
		return
	}

	// Read snapshot data
	var snapshotData []byte
	buffer := make([]byte, 4096)

	// Set a timeout for reading snapshot data
	done := make(chan bool)
	go func() {
		for {
			n, err := stdout.Read(buffer)
			if err != nil {
				break
			}
			if n > 0 {
				snapshotData = append(snapshotData, buffer[:n]...)
			}
		}
		done <- true
	}()

	// Wait for snapshot data or timeout
	select {
	case <-done:
		// Successfully read snapshot data
	case <-time.After(5 * time.Second):
		// Timeout
		cr.log.Log(logger.Warn, "Timeout reading snapshot data for camera %d", cr.CameraID)
	}

	// Clean up
	gstreamerCmd.Process.Kill()
	gstreamerCmd.Wait()

	// Add snapshot if we got data
	if len(snapshotData) > 0 {
		cr.addSnapshot(snapshotData)
		cr.log.Log(logger.Debug, "Created snapshot for camera %d, size: %d bytes", cr.CameraID, len(snapshotData))
	}
}

// createSnapshotWithFFmpeg creates a snapshot using FFmpeg
func (cr *Recorder) createSnapshotWithFFmpeg() {
	// Use ffmpeg to capture a single frame from RTSP stream
	// ffmpeg -i <rtsp_url> -vframes 1 -f image2 -update 1 pipe:1
	ffmpegCmd := exec.CommandContext(cr.ctx, "ffmpeg",
		"-i", cr.RTSPURL,
		"-vframes", "1",
		"-f", "image2",
		"-update", "1",
		"-q:v", "2", // High quality
		"pipe:1")

	// Create pipe for reading snapshot data
	stdout, err := ffmpegCmd.StdoutPipe()
	if err != nil {
		cr.log.Log(logger.Error, "Failed to create stdout pipe for snapshot camera %d: %v", cr.CameraID, err)
		return
	}

	// Start ffmpeg process
	if err := ffmpegCmd.Start(); err != nil {
		cr.log.Log(logger.Error, "Failed to start ffmpeg for snapshot camera %d: %v", cr.CameraID, err)
		return
	}

	// Read snapshot data
	var snapshotData []byte
	buffer := make([]byte, 4096)

	// Set a timeout for reading snapshot data
	done := make(chan bool)
	go func() {
		for {
			n, err := stdout.Read(buffer)
			if err != nil {
				break
			}
			if n > 0 {
				snapshotData = append(snapshotData, buffer[:n]...)
			}
		}
		done <- true
	}()

	// Wait for snapshot data or timeout
	select {
	case <-done:
		// Successfully read snapshot data
	case <-time.After(5 * time.Second):
		// Timeout
		cr.log.Log(logger.Warn, "Timeout reading snapshot data for camera %d", cr.CameraID)
	}

	// Clean up
	ffmpegCmd.Process.Kill()
	ffmpegCmd.Wait()

	// Add snapshot if we got data
	if len(snapshotData) > 0 {
		cr.addSnapshot(snapshotData)
		cr.log.Log(logger.Debug, "Created snapshot for camera %d, size: %d bytes", cr.CameraID, len(snapshotData))
	}
}

// recordStream continuously records the RTSP stream using gstreamer
func (cr *Recorder) recordStream() {
	cr.log.Log(logger.Info, "Starting RTSP stream recording for camera %d at %s", cr.CameraID, cr.RTSPURL)

	// Use gstreamer to capture RTSP stream and output raw video data
	// gst-launch-1.0 rtspsrc location=<rtsp_url> ! rtph264depay ! h264parse ! avdec_h264 ! videoconvert ! rawvideoparse ! fdsink
	gstreamerCmd := exec.CommandContext(cr.ctx, "gst-launch-1.0",
		"rtspsrc", "location="+cr.RTSPURL, "latency=0", "drop-on-latency=true",
		"!", "rtph264depay",
		"!", "h264parse",
		"!", "avdec_h264",
		"!", "videoconvert",
		"!", "rawvideoparse",
		"!", "fdsink")

	// Create pipe for reading video data
	stdout, err := gstreamerCmd.StdoutPipe()
	if err != nil {
		cr.log.Log(logger.Error, "Failed to create stdout pipe for camera %d: %v", cr.CameraID, err)
		return
	}

	// Start gstreamer process
	if err := gstreamerCmd.Start(); err != nil {
		cr.log.Log(logger.Error, "Failed to start gstreamer for camera %d: %v", cr.CameraID, err)
		return
	}
	defer func() {
		gstreamerCmd.Process.Kill()
		gstreamerCmd.Wait()
	}()

	cr.log.Log(logger.Info, "GStreamer started for camera %d", cr.CameraID)

	// Buffer for reading video data
	buffer := make([]byte, 4096)

	// Read video data continuously
	for {
		select {
		case <-cr.ctx.Done():
			cr.log.Log(logger.Info, "Recording stopped for camera %d", cr.CameraID)
			return
		default:
			// Read video data from gstreamer output
			n, err := stdout.Read(buffer)
			if err != nil {
				cr.log.Log(logger.Error, "Failed to read video data for camera %d: %v", cr.CameraID, err)
				// Wait a bit before returning to avoid rapid restart loops
				time.Sleep(1 * time.Second)
				return
			}

			if n > 0 {
				// Create packet with actual video data
				packetData := make([]byte, n)
				copy(packetData, buffer[:n])
				cr.addPacket(packetData)
			}
		}
	}
}

// Alternative implementation using ffmpeg if gstreamer is not available
func (cr *Recorder) recordStreamWithFFmpeg() {
	cr.log.Log(logger.Info, "Starting RTSP stream recording with FFmpeg for camera %d at %s", cr.CameraID, cr.RTSPURL)

	// Use ffmpeg to capture RTSP stream and output raw video data
	// ffmpeg -i <rtsp_url> -f rawvideo -pix_fmt yuv420p -vf scale=640:480 -t 140 pipe:1
	ffmpegCmd := exec.CommandContext(cr.ctx, "ffmpeg",
		"-i", cr.RTSPURL,
		"-f", "rawvideo",
		"-pix_fmt", "yuv420p",
		"-vf", "scale=640:480",
		"-t", "140", // Limit to 140 seconds
		"pipe:1")

	// Create pipe for reading video data
	stdout, err := ffmpegCmd.StdoutPipe()
	if err != nil {
		cr.log.Log(logger.Error, "Failed to create stdout pipe for camera %d: %v", cr.CameraID, err)
		return
	}

	// Start ffmpeg process
	if err := ffmpegCmd.Start(); err != nil {
		cr.log.Log(logger.Error, "Failed to start ffmpeg for camera %d: %v", cr.CameraID, err)
		return
	}
	defer func() {
		ffmpegCmd.Process.Kill()
		ffmpegCmd.Wait()
	}()

	cr.log.Log(logger.Info, "FFmpeg started for camera %d", cr.CameraID)

	// Buffer for reading video data
	buffer := make([]byte, 4096)

	// Read video data continuously
	for {
		select {
		case <-cr.ctx.Done():
			cr.log.Log(logger.Info, "Recording stopped for camera %d", cr.CameraID)
			return
		default:
			// Read video data from ffmpeg output
			n, err := stdout.Read(buffer)
			if err != nil {
				cr.log.Log(logger.Error, "Failed to read video data for camera %d: %v", cr.CameraID, err)
				// Wait a bit before returning to avoid rapid restart loops
				time.Sleep(1 * time.Second)
				return
			}

			if n > 0 {
				// Create packet with actual video data
				packetData := make([]byte, n)
				copy(packetData, buffer[:n])
				cr.addPacket(packetData)
			}
		}
	}
}
