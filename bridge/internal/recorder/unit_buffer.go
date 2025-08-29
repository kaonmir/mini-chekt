package recorder

import (
	"sync"
	"time"

	"github.com/bluenviron/gortsplib/v4/pkg/description"
	rtspformat "github.com/bluenviron/gortsplib/v4/pkg/format"
	"github.com/kaonmir/mini-chekt/internal/unit"
)

type bufferedUnit struct {
	media *description.Media
	forma rtspformat.Format
	u     unit.Unit
	ntp   time.Time
}

type unitRingBuffer struct {
	mu        sync.RWMutex
	maxWindow time.Duration
	items     []bufferedUnit
}

func newUnitRingBuffer(maxWindow time.Duration) *unitRingBuffer {
	return &unitRingBuffer{maxWindow: maxWindow}
}

func (rb *unitRingBuffer) push(media *description.Media, forma rtspformat.Format, u unit.Unit) {
	ntp := u.GetNTP()

	rb.mu.Lock()
	defer rb.mu.Unlock()

	rb.items = append(rb.items, bufferedUnit{media: media, forma: forma, u: u, ntp: ntp})

	// evict items older than window from the head
	cutoff := ntp.Add(-rb.maxWindow)
	idx := 0
	for idx < len(rb.items) && rb.items[idx].ntp.Before(cutoff) {
		idx++
	}
	if idx > 0 {
		// drop [0:idx]
		rb.items = append([]bufferedUnit{}, rb.items[idx:]...)
	}
}

func (rb *unitRingBuffer) snapshot() []bufferedUnit {
	rb.mu.RLock()
	defer rb.mu.RUnlock()
	out := make([]bufferedUnit, len(rb.items))
	copy(out, rb.items)
	return out
}
