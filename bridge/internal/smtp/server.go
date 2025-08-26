package smtp

import (
	"context"
	"io"
	"net"
	"strconv"
	"time"

	"github.com/emersion/go-sasl"
	"github.com/emersion/go-smtp"
	"github.com/kaonmir/bridge/internal/logger"
)

type Mail struct {
	From    string
	To      []string
	Parts   []EmailPart
	Content []byte
}

// Server represents an SMTP server
type Server struct {
	server *smtp.Server
	logger *logger.Logger
}

// Backend implements the SMTP backend interface
type Backend struct {
	logger *logger.Logger
}

// New creates a new SMTP server with logger
func New(logger *logger.Logger, port int) *Server {
	backend := &Backend{
		logger: logger,
	}

	server := smtp.NewServer(backend)
	server.Addr = ":" + strconv.Itoa(port)
	server.Domain = "localhost"
	server.ReadTimeout = 10 * time.Second
	server.WriteTimeout = 10 * time.Second
	server.MaxMessageBytes = 1024 * 1024 // 1MB
	server.MaxRecipients = 50
	server.AllowInsecureAuth = true

	return &Server{
		server: server,
		logger: logger,
	}
}

// NewSession creates a new SMTP session
func (b *Backend) NewSession(c *smtp.Conn) (smtp.Session, error) {
	return &Session{
		logger: b.logger,
	}, nil
}

// Session represents an SMTP session
type Session struct {
	from   string
	to     []string
	logger *logger.Logger
	auth   bool // Track authentication status
}

// Ensure Session implements AuthSession interface
var _ smtp.AuthSession = (*Session)(nil)

// AuthMechanisms returns the list of supported authentication mechanisms
func (s *Session) AuthMechanisms() []string {
	return []string{sasl.Plain, sasl.Login}
}

// Auth implements SMTP AUTH command
func (s *Session) Auth(mech string) (sasl.Server, error) {
	s.logger.Log(logger.Debug, "Auth mechanism: %s", mech)
	switch mech {
	case sasl.Plain:
		return sasl.NewPlainServer(func(identity, username, password string) error {
			// For development/testing purposes, accept any credentials
			// In production, you should implement proper authentication
			s.auth = true
			s.logger.Log(logger.Debug, "Authentication successful for user: %s", username)
			return nil
		}), nil
	case sasl.Login:
		return NewLoginServer(s), nil
	default:
		return nil, smtp.ErrAuthUnknownMechanism
	}
}

// Mail implements SMTP MAIL command
func (s *Session) Mail(from string, opts *smtp.MailOptions) error {
	// Check if authentication is required and completed
	if !s.auth {
		s.logger.Log(logger.Warn, "Authentication required but not provided")
		return smtp.ErrAuthRequired
	}

	s.from = from
	s.logger.Log(logger.Debug, "Mail from: %s", from)
	return nil
}

// Rcpt implements SMTP RCPT command
func (s *Session) Rcpt(to string, opts *smtp.RcptOptions) error {
	s.to = append(s.to, to)
	s.logger.Log(logger.Debug, "Rcpt to: %s", to)
	return nil
}

// Data implements SMTP DATA command
func (s *Session) Data(r io.Reader) error {
	// Read the email data
	data, err := io.ReadAll(r)
	if err != nil {
		return err
	}

	// Process the email data
	s.logger.Log(logger.Debug, "Received email from %s to %v", s.from, s.to)
	s.logger.Log(logger.Debug, "Email data length: %d bytes", len(data))

	// Send entire email content via channel
	s.handleMail(data)

	return nil
}

// Reset implements SMTP RSET command
func (s *Session) Reset() {
	s.from = ""
	s.to = nil
	s.auth = false // Reset authentication status
	s.logger.Log(logger.Debug, "Session reset")
}

// Logout implements SMTP LOGOUT command
func (s *Session) Logout() error {
	s.logger.Log(logger.Debug, "Session logout")
	return nil
}

// Start starts the SMTP server
func (s *Server) Start() error {
	s.logger.Log(logger.Info, "Starting SMTP server on %s", s.server.Addr)
	return s.server.ListenAndServe()
}

// StartWithContext starts the SMTP server with context for graceful shutdown
func (s *Server) StartWithContext(ctx context.Context) error {
	s.logger.Log(logger.Info, "Starting SMTP server on %s", s.server.Addr)

	// Create a channel to receive server errors
	errChan := make(chan error, 1)

	go func() {
		errChan <- s.server.ListenAndServe()
	}()

	// Wait for either context cancellation or server error
	select {
	case err := <-errChan:
		return err
	case <-ctx.Done():
		s.logger.Log(logger.Info, "Shutting down SMTP server...")
		return s.server.Shutdown(ctx)
	}
}

// Stop stops the SMTP server gracefully
func (s *Server) Stop() error {
	s.logger.Log(logger.Info, "Stopping SMTP server...")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	return s.server.Shutdown(ctx)
}

// GetListener returns the underlying listener (useful for testing)
func (s *Server) GetListener() (net.Listener, error) {
	return net.Listen("tcp", s.server.Addr)
}
