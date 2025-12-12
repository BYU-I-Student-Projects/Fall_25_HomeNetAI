package entities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DeviceData struct {
	ID             string         `gorm:"primaryKey" json:"id"`
	DeviceID       string         `gorm:"index" json:"device_id"`
	DeviceModuleID string         `gorm:"index" json:"device_module_id"`
	Timestamp      string         `json:"timestamp"`
	Data           string         `gorm:"type:jsonb" json:"data"` // JSON column for flexible sensor data
	CreatedAt      string         `json:"created_at"`
	UpdatedAt      string         `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

func (d *DeviceData) BeforeCreate(tx *gorm.DB) (err error) {
	d.ID = uuid.New().String()
	d.CreatedAt = time.Now().Format(time.RFC3339)
	d.UpdatedAt = d.CreatedAt
	return
}
