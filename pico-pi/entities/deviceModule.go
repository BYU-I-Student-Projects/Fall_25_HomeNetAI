package entities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DeviceModule struct {
	ID         string         `gorm:"primaryKey" json:"id"`
	DeviceID   string         `gorm:"index" json:"device_id"`
	UserID     string         `json:"user_id"`
	Name       string         `json:"name"`
	ModuleType string         `json:"module_type"`
	Commands   string         `gorm:"type:jsonb" json:"commands"` // JSON array of command names
	Status     string         `json:"status"`
	CreatedAt  string         `json:"created_at"`
	UpdatedAt  string         `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

func (dm *DeviceModule) BeforeCreate(tx *gorm.DB) (err error) {
	dm.ID = uuid.New().String()
	dm.CreatedAt = time.Now().Format(time.RFC3339)
	dm.UpdatedAt = dm.CreatedAt
	// Ensure commands is valid JSON - default to empty array if empty
	if dm.Commands == "" {
		dm.Commands = "[]"
	}
	return
}
