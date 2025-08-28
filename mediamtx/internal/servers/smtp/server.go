package smtp

import (
	"context"
	"strconv"
	"sync"
	"time"

	"github.com/bluenviron/mediamtx/internal/logger"
	"github.com/emersion/go-smtp"
)

type Mail struct {
	From    string
	To      []string
	Parts   []EmailPart
	Content []byte
}

type serverParent interface {
	logger.Writer
}

// Server represents an SMTP server
type Server struct {
	server *smtp.Server
	Port   int
	Parent serverParent

	ctx       context.Context
	ctxCancel func()
	wg        sync.WaitGroup

	// out
	ChMail chan Mail
}

func (s *Server) Initialize() error {
	backend := &Backend{
		Parent: s.Parent,
		chMail: &s.ChMail,
	}

	s.server = smtp.NewServer(backend)
	s.server.Addr = ":" + strconv.Itoa(s.Port)
	s.server.Domain = "localhost"
	s.server.ReadTimeout = 10 * time.Second
	s.server.WriteTimeout = 10 * time.Second
	s.server.MaxMessageBytes = 1024 * 1024 // 1MB
	s.server.MaxRecipients = 50
	s.server.MaxLineLength = 2000
	s.server.AllowInsecureAuth = true

	s.ChMail = make(chan Mail, 10000)

	// Initialize context for graceful shutdown
	s.ctx, s.ctxCancel = context.WithCancel(context.Background())

	// Start the server in a goroutine
	s.wg.Add(1)
	go s.run()

	return nil
}

// Log implements logger.Writer.
func (s *Server) Log(level logger.Level, format string, args ...interface{}) {
	s.Parent.Log(level, "[SMTP] "+format, args...)
}

// Close closes the server.
func (s *Server) Close() {
	s.Log(logger.Info, "server is closing")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	s.server.Shutdown(ctx)

	s.ctxCancel()
	s.wg.Wait()
}

// run starts the SMTP server with context for graceful shutdown
func (s *Server) run() {
	defer s.wg.Done()

	s.Log(logger.Info, "Starting SMTP server on %s", s.server.Addr)

	// Create a channel to receive server errors
	errChan := make(chan error, 1)

	go func() {
		errChan <- s.server.ListenAndServe()
	}()

	// Wait for either context cancellation or server error
	select {
	case err := <-errChan:
		if err != nil {
			s.Log(logger.Error, "SMTP server error: %v", err)
		}
	case <-s.ctx.Done():
		s.Log(logger.Info, "Shutting down SMTP server...")
		err := s.server.Shutdown(s.ctx)
		if err != nil {
			s.Log(logger.Error, "Error shutting down SMTP server: %v", err)
		}
	}
}
