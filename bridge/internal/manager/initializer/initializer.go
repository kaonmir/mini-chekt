package initializer

import (
	"crypto/rand"
	"encoding/json"
	"math/big"
	"time"

	"github.com/kaonmir/bridge/internal/config"
	"github.com/kaonmir/bridge/internal/logger"
	"github.com/kaonmir/bridge/internal/supabase"
	"github.com/kaonmir/bridge/internal/supabase/database"
)

type Initializer struct {
	log      *logger.Logger
	cfg      *config.Config
	supabase *supabase.Supabase

	SiteId    int64
	BridgeId  string
	CameraMap map[string]string // ip: camera_id
}

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

func NewInitializer(log *logger.Logger, cfg *config.Config, supabase *supabase.Supabase) *Initializer {
	newbridge := map[string]interface{}{
		"bridge_uuid":  cfg.BridgeUUID,
		"bridge_name":  "Bridge-" + cfg.BridgeUUID[:8],
		"access_token": generateRandomToken(),
		"healthy":      &[]bool{true}[0],
	}
	_, _, _ = supabase.Client.From("bridge").Insert(newbridge, false, "", "", "").Execute()

	for {
		data, _, err := supabase.Client.From("bridge").Select("id, bridge_name, site_id, access_token", "", false).Eq("bridge_uuid", cfg.BridgeUUID).Single().Execute()
		if err != nil {
			log.Log(logger.Warn, "Failed to retrieve bridge record: %v", err)
		}

		bridgeData := database.PublicBridgeSelect{}
		err = json.Unmarshal(data, &bridgeData)
		if err != nil {
			log.Log(logger.Warn, "Failed to unmarshal bridge record: %v", err)
		}

		if bridgeData.SiteId != nil {
			log.Log(logger.Info, "Site ID received: %d", *bridgeData.SiteId)
			return &Initializer{
				log:       log,
				cfg:       cfg,
				supabase:  supabase,
				SiteId:    *bridgeData.SiteId,
				BridgeId:  cfg.BridgeUUID,
				CameraMap: make(map[string]string),
			}
		}

		log.Log(logger.Warn, "Please visit https://chekt.kaonmir.com and register bridge here.")
		log.Log(logger.Warn, "Then enter access_token here: %s", *bridgeData.AccessToken)

		log.Log(logger.Info, "Bridge is yet registered, waiting 20 seconds...")
		time.Sleep(20 * time.Second)
	}
}
