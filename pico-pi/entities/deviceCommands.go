package entities

type DeviceCommand struct {
	ID             string `gorm:"primaryKey" json:"id"`
	DeviceID       string `json:"device_id"`
	DeviceModuleID string `json:"device_module_id"`
	Command        string `json:"command"` // e.g., "open_window", "close_window"
	Status         string `json:"status"`  // e.g., "pending", "sent", "failed"
	CreatedAt      string `json:"created_at"`
	UpdatedAt      string `json:"updated_at"`
	DeletedAt      string `gorm:"index" json:"deleted_at,omitempty"`
}
