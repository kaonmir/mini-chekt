package defs

type PublicResponseSelect struct {
	BridgeId     int64       `json:"bridge_id"`
	CreatedAt    string      `json:"created_at"`
	Id           int64       `json:"id"`
	RequestId    string      `json:"request_id"`
	RequestPath  string      `json:"request_path"`
	RequesterId  string      `json:"requester_id"`
	ResponseBody interface{} `json:"response_body"`
	UpdatedAt    string      `json:"updated_at"`
}

type PublicResponseInsert struct {
	BridgeId     int64       `json:"bridge_id"`
	CreatedAt    *string     `json:"created_at"`
	Id           *int64      `json:"id"`
	RequestId    string      `json:"request_id"`
	RequestPath  string      `json:"request_path"`
	RequesterId  string      `json:"requester_id"`
	ResponseBody interface{} `json:"response_body"`
	UpdatedAt    *string     `json:"updated_at"`
}

type PublicResponseUpdate struct {
	BridgeId     *int64      `json:"bridge_id"`
	CreatedAt    *string     `json:"created_at"`
	Id           *int64      `json:"id"`
	RequestId    *string     `json:"request_id"`
	RequestPath  *string     `json:"request_path"`
	RequesterId  *string     `json:"requester_id"`
	ResponseBody interface{} `json:"response_body"`
	UpdatedAt    *string     `json:"updated_at"`
}

type PublicCameraSelect struct {
	BridgeId      int64  `json:"bridge_id"`
	CameraName    string `json:"camera_name"`
	CreatedAt     string `json:"created_at"`
	Healthy       bool   `json:"healthy"`
	Id            int64  `json:"id"`
	IpAddress     string `json:"ip_address"`
	IsRegistered  bool   `json:"is_registered"`
	LastCheckedAt string `json:"last_checked_at"`
	Source        string `json:"source"`
	UpdatedAt     string `json:"updated_at"`
}

type PublicCameraInsert struct {
	BridgeId      int64   `json:"bridge_id"`
	CameraName    string  `json:"camera_name"`
	CreatedAt     *string `json:"created_at"`
	Healthy       *bool   `json:"healthy"`
	Id            *int64  `json:"id"`
	IpAddress     string  `json:"ip_address"`
	IsRegistered  *bool   `json:"is_registered"`
	LastCheckedAt *string `json:"last_checked_at"`
	Source        string  `json:"source"`
	UpdatedAt     *string `json:"updated_at"`
}

type PublicCameraUpdate struct {
	BridgeId      *int64  `json:"bridge_id"`
	CameraName    *string `json:"camera_name"`
	CreatedAt     *string `json:"created_at"`
	Healthy       *bool   `json:"healthy"`
	Id            *int64  `json:"id"`
	IpAddress     *string `json:"ip_address"`
	IsRegistered  *bool   `json:"is_registered"`
	LastCheckedAt *string `json:"last_checked_at"`
	Source        *string `json:"source"`
	UpdatedAt     *string `json:"updated_at"`
}

type PublicSiteSelect struct {
	ArmStatus          string  `json:"arm_status"`
	ArmStatusChangedAt string  `json:"arm_status_changed_at"`
	ContactName        *string `json:"contact_name"`
	ContactPhone       *string `json:"contact_phone"`
	CreatedAt          string  `json:"created_at"`
	Id                 int64   `json:"id"`
	LogoUrl            *string `json:"logo_url"`
	SiteName           string  `json:"site_name"`
	UpdatedAt          string  `json:"updated_at"`
}

type PublicSiteInsert struct {
	ArmStatus          *string `json:"arm_status"`
	ArmStatusChangedAt *string `json:"arm_status_changed_at"`
	ContactName        *string `json:"contact_name"`
	ContactPhone       *string `json:"contact_phone"`
	CreatedAt          *string `json:"created_at"`
	Id                 *int64  `json:"id"`
	LogoUrl            *string `json:"logo_url"`
	SiteName           string  `json:"site_name"`
	UpdatedAt          *string `json:"updated_at"`
}

type PublicSiteUpdate struct {
	ArmStatus          *string `json:"arm_status"`
	ArmStatusChangedAt *string `json:"arm_status_changed_at"`
	ContactName        *string `json:"contact_name"`
	ContactPhone       *string `json:"contact_phone"`
	CreatedAt          *string `json:"created_at"`
	Id                 *int64  `json:"id"`
	LogoUrl            *string `json:"logo_url"`
	SiteName           *string `json:"site_name"`
	UpdatedAt          *string `json:"updated_at"`
}

type PublicBridgeSelect struct {
	AccessToken   *string `json:"access_token"`
	BridgeName    string  `json:"bridge_name"`
	BridgeUuid    string  `json:"bridge_uuid"`
	CreatedAt     string  `json:"created_at"`
	Healthy       bool    `json:"healthy"`
	Id            int64   `json:"id"`
	LastCheckedAt string  `json:"last_checked_at"`
	SiteId        *int64  `json:"site_id"`
	UpdatedAt     string  `json:"updated_at"`
}

type PublicBridgeInsert struct {
	AccessToken   *string `json:"access_token"`
	BridgeName    string  `json:"bridge_name"`
	BridgeUuid    string  `json:"bridge_uuid"`
	CreatedAt     *string `json:"created_at"`
	Healthy       *bool   `json:"healthy"`
	Id            *int64  `json:"id"`
	LastCheckedAt *string `json:"last_checked_at"`
	SiteId        *int64  `json:"site_id"`
	UpdatedAt     *string `json:"updated_at"`
}

type PublicBridgeUpdate struct {
	AccessToken   *string `json:"access_token"`
	BridgeName    *string `json:"bridge_name"`
	BridgeUuid    *string `json:"bridge_uuid"`
	CreatedAt     *string `json:"created_at"`
	Healthy       *bool   `json:"healthy"`
	Id            *int64  `json:"id"`
	LastCheckedAt *string `json:"last_checked_at"`
	SiteId        *int64  `json:"site_id"`
	UpdatedAt     *string `json:"updated_at"`
}

type PublicAlarmSelect struct {
	AlarmName    string    `json:"alarm_name"`
	AlarmType    string    `json:"alarm_type"`
	BridgeId     int64     `json:"bridge_id"`
	CameraId     int64     `json:"camera_id"`
	CreatedAt    string    `json:"created_at"`
	Id           int64     `json:"id"`
	IsRead       bool      `json:"is_read"`
	LastAlarmAt  string    `json:"last_alarm_at"`
	ReadAt       *string   `json:"read_at"`
	SiteId       int64     `json:"site_id"`
	SnapshotUrls []*string `json:"snapshot_urls"`
	UpdatedAt    string    `json:"updated_at"`
}

type PublicAlarmInsert struct {
	AlarmName    string    `json:"alarm_name"`
	AlarmType    string    `json:"alarm_type"`
	BridgeId     int64     `json:"bridge_id"`
	CameraId     int64     `json:"camera_id"`
	CreatedAt    *string   `json:"created_at"`
	Id           *int64    `json:"id"`
	IsRead       *bool     `json:"is_read"`
	LastAlarmAt  *string   `json:"last_alarm_at"`
	ReadAt       *string   `json:"read_at"`
	SiteId       int64     `json:"site_id"`
	SnapshotUrls []*string `json:"snapshot_urls"`
	UpdatedAt    *string   `json:"updated_at"`
}

type PublicAlarmUpdate struct {
	AlarmName    *string   `json:"alarm_name"`
	AlarmType    *string   `json:"alarm_type"`
	BridgeId     *int64    `json:"bridge_id"`
	CameraId     *int64    `json:"camera_id"`
	CreatedAt    *string   `json:"created_at"`
	Id           *int64    `json:"id"`
	IsRead       *bool     `json:"is_read"`
	LastAlarmAt  *string   `json:"last_alarm_at"`
	ReadAt       *string   `json:"read_at"`
	SiteId       *int64    `json:"site_id"`
	SnapshotUrls []*string `json:"snapshot_urls"`
	UpdatedAt    *string   `json:"updated_at"`
}
