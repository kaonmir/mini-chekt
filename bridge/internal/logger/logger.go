// Package logger contains a logger.
package logger

import (
	"fmt"
	"log"
	"path/filepath"
	"runtime"
)

// LogLevel is a log level.
type LogLevel int

const (
	// Debug is the debug log level.
	Debug LogLevel = iota
	// Info is the info log level.
	Info
	// Warn is the warn log level.
	Warn
	// Error is the error log level.
	Error
)

// ANSI color codes
const (
	colorReset  = "\033[0m"
	colorRed    = "\033[31m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorBlue   = "\033[34m"
	colorPurple = "\033[35m"
	colorCyan   = "\033[36m"
	colorWhite  = "\033[37m"
)

// Logger is a logger.
type Logger struct {
	level LogLevel
}

// New allocates a logger.
func New() *Logger {
	return &Logger{
		level: Info,
	}
}

// getLevelColor returns the color code for the given log level
func getLevelColor(level LogLevel) string {
	switch level {
	case Debug:
		return colorCyan
	case Info:
		return colorGreen
	case Warn:
		return colorYellow
	case Error:
		return colorRed
	default:
		return colorWhite
	}
}

// getLevelName returns the string representation of the log level
func getLevelName(level LogLevel) string {
	switch level {
	case Debug:
		return "DEBUG"
	case Info:
		return "INFO"
	case Warn:
		return "WARN"
	case Error:
		return "ERROR"
	default:
		return "UNKNOWN"
	}
}

// SetLevel sets the log level.
func (l *Logger) SetLevel(level LogLevel) {
	l.level = level
}

// Log logs a message.
func (l *Logger) Log(level LogLevel, format string, args ...interface{}) {
	if level >= l.level {
		// Get caller information
		_, file, line, ok := runtime.Caller(1)
		if !ok {
			file = "unknown"
			line = 0
		}

		// Get just the filename without the full path
		filename := filepath.Base(file)

		color := getLevelColor(level)
		levelName := getLevelName(level)
		coloredLevel := fmt.Sprintf("%s[%s]%s", color, levelName, colorReset)
		fileInfo := fmt.Sprintf("%s%s:%d%s", colorCyan, filename, line, colorReset)

		log.Printf("%s %s "+format, append([]interface{}{coloredLevel, fileInfo}, args...)...)
	}
}
