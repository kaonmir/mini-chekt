package initializer

import (
	"encoding/json"
	"time"

	"github.com/kaonmir/bridge/internal/config"
	"github.com/kaonmir/bridge/internal/logger"
	"github.com/kaonmir/bridge/internal/supabase/database"
	"github.com/supabase-community/supabase-go"
)

type Initializer struct {
	log      *logger.Logger
	cfg      *config.Config
	supabase *supabase.Client

	SiteId    string
	BridgeId  string
	CameraMap map[string]string // ip: camera_id
}

func NewInitializer(log *logger.Logger, cfg *config.Config, supabase *supabase.Client) *Initializer {
	newbridge := map[string]interface{}{
		"bridge_uuid": cfg.BridgeUUID,
		"bridge_name": "Bridge-" + cfg.BridgeUUID[:8],
		"healthy":     &[]bool{true}[0],
	}
	_, _, _ = supabase.From("bridge").Insert(newbridge, false, "", "", "").Execute()

	for {
		data, _, err := supabase.From("bridge").Select("id, bridge_name, site_id", "", false).Eq("bridge_uuid", cfg.BridgeUUID).Single().Execute()
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
				SiteId:    cfg.SiteId,
				BridgeId:  cfg.BridgeUUID,
				CameraMap: make(map[string]string),
			}
		}

		log.Log(logger.Info, "Site ID not yet assigned, waiting 20 seconds...")
		time.Sleep(20 * time.Second)
	}
}
