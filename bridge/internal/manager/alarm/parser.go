package alarm

import "github.com/kaonmir/bridge/internal/supabase/database"

// Parser defines the common interface for all protocol parsers
type Parser interface {
	IsAlarm(data interface{}) (bool, error)
	ParseAlarm(data interface{}) (*database.PublicAlarmInsert, error)
}
