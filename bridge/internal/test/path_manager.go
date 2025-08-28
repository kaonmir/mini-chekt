package test

import (
	"github.com/kaonmir/mini-chekt/internal/conf"
	"github.com/kaonmir/mini-chekt/internal/defs"
	"github.com/kaonmir/mini-chekt/internal/stream"
)

// PathManager is a dummy path manager.
type PathManager struct {
	FindPathConfImpl func(req defs.PathFindPathConfReq) (*conf.Path, error)
	DescribeImpl     func(req defs.PathDescribeReq) defs.PathDescribeRes
	AddPublisherImpl func(req defs.PathAddPublisherReq) (defs.Path, *stream.Stream, error)
	AddReaderImpl    func(req defs.PathAddReaderReq) (defs.Path, *stream.Stream, error)
}

// FindPathConf implements PathManager.
func (pm *PathManager) FindPathConf(req defs.PathFindPathConfReq) (*conf.Path, error) {
	return pm.FindPathConfImpl(req)
}

// Describe implements PathManager.
func (pm *PathManager) Describe(req defs.PathDescribeReq) defs.PathDescribeRes {
	return pm.DescribeImpl(req)
}

// AddPublisher implements PathManager.
func (pm *PathManager) AddPublisher(req defs.PathAddPublisherReq) (defs.Path, *stream.Stream, error) {
	return pm.AddPublisherImpl(req)
}

// AddReader implements PathManager.
func (pm *PathManager) AddReader(req defs.PathAddReaderReq) (defs.Path, *stream.Stream, error) {
	return pm.AddReaderImpl(req)
}
