package smtp

import (
	"github.com/emersion/go-smtp"
	"github.com/kaonmir/mini-chekt/internal/logger"
)

// loginServer implements AUTH LOGIN mechanism
type loginServer struct {
	session *Session
	state   int // 0: waiting for username, 1: waiting for password
}

// NewLoginServer creates a new AUTH LOGIN server
func NewLoginServer(session *Session) *loginServer {
	return &loginServer{
		session: session,
		state:   0,
	}
}

// Next implements the SASL server interface for AUTH LOGIN
func (l *loginServer) Next(response []byte) (challenge []byte, done bool, err error) {
	switch l.state {
	case 0:
		// First challenge: ask for username
		l.state = 1
		return []byte("Username:"), false, nil
	case 1:
		// Second challenge: ask for password
		l.state = 2
		return []byte("Password:"), false, nil
	case 2:
		// Authentication complete
		// For development/testing purposes, accept any credentials
		// In production, you should implement proper authentication
		// TODO: Implement proper authentication
		l.session.auth = true
		l.session.Log(logger.Debug, "AUTH LOGIN successful")
		return nil, true, nil
	default:
		return nil, false, smtp.ErrAuthFailed
	}
}
