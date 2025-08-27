package toolbox

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

type Toolbox struct {
	log      *logger.Logger
	cfg      *config.Config
	supabase *supabase.Supabase

	SiteId     int64
	BridgeId   int64
	BridgeUUID string
	Cameras    []Camera
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

func NewToolbox(log *logger.Logger, cfg *config.Config, supabase *supabase.Supabase) *Toolbox {
	newbridge := map[string]interface{}{
		"bridge_uuid":  cfg.BridgeUUID,
		"bridge_name":  "Bridge-" + cfg.BridgeUUID[:8],
		"access_token": generateRandomToken(),
		"healthy":      &[]bool{true}[0],
	}
	_, _, _ = supabase.Client.From("bridge").Insert(newbridge, false, "", "", "").Execute()

	var bridgeData database.PublicBridgeSelect
	for {
		data, _, err := supabase.Client.From("bridge").Select("id, bridge_name, site_id, access_token", "", false).Eq("bridge_uuid", cfg.BridgeUUID).Single().Execute()
		if err != nil {
			log.Log(logger.Warn, "Failed to retrieve bridge record: %v", err)
		}

		err = json.Unmarshal(data, &bridgeData)
		if err != nil {
			log.Log(logger.Warn, "Failed to unmarshal bridge record: %v", err)
		}

		if bridgeData.SiteId != nil {
			break
		}

		log.Log(logger.Warn, "Please visit https://chekt.kaonmir.com and register bridge here.")
		log.Log(logger.Warn, "Then enter access_token here: %s", *bridgeData.AccessToken)
		log.Log(logger.Info, "Bridge is yet registered, waiting 20 seconds...")
		time.Sleep(20 * time.Second)
	}

	log.Log(logger.Info, "Site ID received: %d", *bridgeData.SiteId)
	return &Toolbox{
		log:        log,
		cfg:        cfg,
		supabase:   supabase,
		SiteId:     *bridgeData.SiteId,
		BridgeId:   bridgeData.Id,
		BridgeUUID: cfg.BridgeUUID,
		Cameras: []Camera{
			// TODO: DB에서 가져오도록 설정
			{
				Id:        1,
				RTSPURL:   "rtsp://210.99.70.120:1935/live/cctv001.stream",
				Username:  "",
				Password:  "",
				IPAddress: "210.99.70.120",
			},
			{
				Id:        2,
				RTSPURL:   "rtsp://210.99.70.120:1935/live/cctv002.stream",
				Username:  "",
				Password:  "",
				IPAddress: "210.99.70.120",
			},
		},
	}
}
