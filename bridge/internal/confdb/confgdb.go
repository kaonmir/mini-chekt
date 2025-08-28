package confdb

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"time"

	"github.com/supabase-community/supabase-go"

	"github.com/kaonmir/mini-chekt/internal/conf"
	"github.com/kaonmir/mini-chekt/internal/defs"
	"github.com/kaonmir/mini-chekt/internal/logger"
)

// generateRandomToken generates a random 5-character alphanumeric token
func generateRandomToken() string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	token := make([]byte, 5)
	for i := range token {
		randomIndex, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		token[i] = charset[randomIndex.Int64()]
	}
	return string(token)
}

type confdbParent interface {
	logger.Writer
	APIConfigSet(conf *conf.Conf)
	ReloadConf(newConf *conf.Conf, calledByAPI bool) error
}

type ConfDB struct {
	Conf   *conf.Conf
	Parent confdbParent

	BridgeId int64
	SiteId   int64
}

func (c *ConfDB) Log(level logger.Level, format string, args ...interface{}) {
	c.Parent.Log(level, format, args...)
}

func (c *ConfDB) Load() error {
	client, err := supabase.NewClient(c.Conf.SupabaseURL, c.Conf.SupabaseKey, &supabase.ClientOptions{
		Headers: map[string]string{
			"Authorization": "Bearer " + c.Conf.SupabaseKey,
			"apikey":        c.Conf.SupabaseKey,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create Supabase client: %w", err)
	}

	newbridge := map[string]interface{}{
		"bridge_uuid":  c.Conf.BridgeUUID,
		"bridge_name":  "Bridge-" + c.Conf.BridgeUUID[:8],
		"access_token": generateRandomToken(),
		"healthy":      &[]bool{true}[0],
	}
	_, _, _ = client.From("bridge").Insert(newbridge, false, "", "", "").Execute()

	var bridgeData defs.PublicBridgeSelect
	for {
		data, _, err := client.From("bridge").Select("id, bridge_name, site_id, access_token", "", false).Eq("bridge_uuid", c.Conf.BridgeUUID).Single().Execute()
		if err != nil {
			c.Log(logger.Warn, "Failed to retrieve bridge record: %v", err)
		}

		err = json.Unmarshal(data, &bridgeData)
		if err != nil {
			c.Log(logger.Warn, "Failed to unmarshal bridge record: %v", err)
		}

		if bridgeData.SiteId != nil {
			break
		}

		c.Log(logger.Warn, "Please visit https://chekt.kaonmir.com and register bridge here.")
		c.Log(logger.Warn, "Then enter access_token here: %s", *bridgeData.AccessToken)
		c.Log(logger.Warn, "Bridge is yet registered, waiting 20 seconds...")
		time.Sleep(20 * time.Second)
	}

	c.Log(logger.Warn, "Successfully connected to CHeKT Server with bridge ID: %d", bridgeData.Id)

	// Set BridgeId and SiteId from bridge data
	c.BridgeId = bridgeData.Id
	c.SiteId = *bridgeData.SiteId

	c.loadFromDatabase(client)

	return nil
}

func (c *ConfDB) loadFromDatabase(client *supabase.Client) {
	data, _, err := client.From("camera").Select("id, camera_name, ip_address, source", "", false).Eq("bridge_id", fmt.Sprintf("%d", c.BridgeId)).Execute()
	if err != nil {
		c.Log(logger.Warn, "Failed to retrieve camera record: %v", err)
		return
	}

	var cameraData []defs.PublicCameraSelect
	err = json.Unmarshal(data, &cameraData)
	if err != nil {
		c.Log(logger.Warn, "Failed to unmarshal camera record: %v", err)
		return
	}

	newConf := c.Conf.Clone()

	cameraData = []defs.PublicCameraSelect{
		{
			Id:         11,
			CameraName: "Camera-1",
			IpAddress:  "192.168.0.86",
			Source:     "rtsp://admin:P%40ssword@192.168.0.86:554/cam/realmonitor?channel=1&subtype=0",
		},
	}

	for _, camera := range cameraData {
		// c.Cameras = append(c.Cameras, Camera{
		// 	Id:     camera.Id,
		// 	Source: camera.Source,
		// })

		fmt.Printf("Loaded %d cameras from database:\n", len(cameraData))

		path := c.Conf.PathDefaults.Clone()
		path.Source = camera.Source
		path.Name = camera.IpAddress
		path.RecordPath = "./recordings/%path/%Y-%m-%d_%H-%M-%S-%f"

		err = newConf.AddPath(camera.IpAddress, &conf.OptionalPath{
			Values: path,
		})
		if err != nil {
			c.Log(logger.Warn, "Failed to add path: %v", err)
			return
		}
		err = newConf.Validate(nil)
		if err != nil {
			c.Log(logger.Warn, "Failed to validate path: %v", err)
			return
		}

	}

	c.Conf.Paths = newConf.Paths
}
