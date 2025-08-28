package alarm

import "github.com/kaonmir/mini-chekt/internal/defs"

// Parser defines the common interface for all protocol parsers
type Parser interface {
	IsAlarm(data interface{}) (bool, error)
	ParseAlarm(data interface{}) (*defs.PublicAlarmInsert, error)
}
