package discovery

import (
	"net"

	"github.com/jfsmig/onvif/networking"
)

// DiscoverDevices performs device discovery on all available network interfaces
func DiscoverDevices() ([]networking.ClientInfo, error) {
	var allDevices []networking.ClientInfo

	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, err
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

		devices, err := getAvailableDevicesAtSpecificEthernetInterface(itf.Name)
		if err != nil {
			continue
		}

		allDevices = append(allDevices, devices...)
	}

	return allDevices, nil
}

// DiscoverDevicesOnInterface performs device discovery on a specific network interface
func DiscoverDevicesOnInterface(interfaceName string) ([]networking.ClientInfo, error) {
	devices, err := getAvailableDevicesAtSpecificEthernetInterface(interfaceName)
	if err != nil {
		return nil, err
	}

	return devices, nil
}
