package core

import (
	"context"
	"net"
	"time"

	"github.com/kaonmir/bridge/internal/config"
	"github.com/kaonmir/bridge/internal/logger"
	wsdiscovery "github.com/kaonmir/bridge/internal/manager/discover/ws-discovery"
)

// Manager handles device discovery using WS-Discovery protocol
type Manager struct {
	logger     *logger.Logger
	ctx        context.Context
	cancelFunc context.CancelFunc
	config     *config.Config
}

// New creates a new DiscoveryManager
func New(logger *logger.Logger, cfg *config.Config) *Manager {
	ctx, cancel := context.WithCancel(context.Background())

	return &Manager{
		logger:     logger,
		ctx:        ctx,
		cancelFunc: cancel,
		config:     cfg,
	}
}

// Start starts the discovery manager
func (dm *Manager) Start() {
	dm.logger.Log(logger.Info, "Starting DiscoveryManager")

	go dm.process()
}

// Stop stops the discovery manager
func (dm *Manager) Stop() {
	dm.logger.Log(logger.Info, "Stopping DiscoveryManager")
	dm.cancelFunc()
}

func (dm *Manager) process() {
	ticker := time.NewTicker(30 * time.Second) // Increased interval to reduce network load
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			interfaces, err := net.Interfaces()
			if err != nil {
				dm.logger.Log(logger.Error, "Failed to get network interfaces: %v", err)
				continue
			}

			for _, itf := range interfaces {
				// Skip loopback, down, and virtual interfaces
				if itf.Flags&net.FlagLoopback != 0 {
					continue
				}
				if itf.Flags&net.FlagUp == 0 {
					continue
				}
				if itf.Flags&net.FlagPointToPoint != 0 {
					continue
				}

				// Skip interfaces without IPv4 addresses
				addrs, err := itf.Addrs()
				if err != nil {
					dm.logger.Log(logger.Debug, "Failed to get addresses for interface %s: %v", itf.Name, err)
					continue
				}

				hasIPv4 := false
				for _, addr := range addrs {
					if ipnet, ok := addr.(*net.IPNet); ok {
						if ipnet.IP.To4() != nil {
							hasIPv4 = true
							break
						}
					}
				}

				if !hasIPv4 {
					continue
				}

				dm.logger.Log(logger.Debug, "Trying discovery on interface: %s", itf.Name)
				devices, err := wsdiscovery.GetAvailableDevicesAtSpecificEthernetInterface(itf.Name)
				if err != nil {
					dm.logger.Log(logger.Debug, "Failed to get available devices at interface %s: %v", itf.Name, err)
					continue
				}

				dm.logger.Log(logger.Info, "Found %d devices", len(devices))
			}

			// TODO: Implement device discovery logic
		case <-dm.ctx.Done():
			dm.logger.Log(logger.Info, "Discovery manager context cancelled, stopping processing")
			return
		}
	}
}
