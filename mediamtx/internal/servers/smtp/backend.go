package smtp

import (
	"io"

	"github.com/bluenviron/mediamtx/internal/logger"
	"github.com/emersion/go-sasl"
	"github.com/emersion/go-smtp"
)

type backendParent interface {
	logger.Writer
}

// Backend implements the SMTP backend interface
type Backend struct {
	Parent backendParent
	chMail *chan Mail
}

// NewSession creates a new SMTP session
func (b *Backend) NewSession(c *smtp.Conn) (smtp.Session, error) {
	return &Session{
		Parent: b.Parent,
		chMail: b.chMail,
	}, nil
}

// Session represents an SMTP session
type Session struct {
	Parent backendParent
	chMail *chan Mail
	from   string
	to     []string
	auth   bool // Track authentication status
}

// Ensure Session implements AuthSession interface
var _ smtp.AuthSession = (*Session)(nil)

func (s *Session) Log(level logger.Level, format string, args ...interface{}) {
	s.Parent.Log(level, "[SMTP] "+format, args...)
}

// AuthMechanisms returns the list of supported authentication mechanisms
func (s *Session) AuthMechanisms() []string {
	return []string{sasl.Plain, sasl.Login}
}

// Auth implements SMTP AUTH command
func (s *Session) Auth(mech string) (sasl.Server, error) {
	s.Log(logger.Debug, "Auth mechanism: %s", mech)
	switch mech {
	case sasl.Plain:
		return sasl.NewPlainServer(func(identity, username, password string) error {
			// For development/testing purposes, accept any credentials
			// In production, you should implement proper authentication
			s.auth = true
			s.Log(logger.Debug, "Authentication successful for user: %s", username)
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
		s.Log(logger.Warn, "Authentication required but not provided")
		return smtp.ErrAuthRequired
	}

	s.from = from
	s.Log(logger.Debug, "Mail from: %s", from)
	return nil
}

// Rcpt implements SMTP RCPT command
func (s *Session) Rcpt(to string, opts *smtp.RcptOptions) error {
	s.to = append(s.to, to)
	s.Log(logger.Debug, "Rcpt to: %s", to)
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
	s.Log(logger.Debug, "Received email from %s to %v", s.from, s.to)
	s.Log(logger.Debug, "Email data length: %d bytes", len(data))

	// Parse the email data to extract parts
	parts, err := ParseMultipartEmail(data)
	if err != nil {
		s.Log(logger.Error, "Failed to parse multipart email: %v", err)
		// Create a simple text part as fallback
		parts = []EmailPart{
			{
				ContentType: "text/plain",
				Content:     data,
				Headers:     make(map[string]string),
			},
		}
	}

	// Create Mail struct and send via channel
	mail := Mail{
		From:    s.from,
		To:      s.to,
		Content: data,
		Parts:   parts,
	}

	// Send mail via channel
	select {
	case (*s.chMail) <- mail:
		s.Log(logger.Debug, "Email sent to channel successfully")
	default:
		s.Log(logger.Warn, "Channel is full, dropping email")
	}

	return nil
}

// Reset implements SMTP RSET command
func (s *Session) Reset() {
	s.from = ""
	s.to = nil
	s.auth = false // Reset authentication status
	s.Log(logger.Debug, "Session reset")
}

// Logout implements SMTP LOGOUT command
func (s *Session) Logout() error {
	s.Log(logger.Debug, "Session logout")
	return nil
}
