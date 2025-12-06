package entities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DeviceModule struct {
	ID        string         `gorm:"primaryKey" json:"id"`
	DeviceID  string         `gorm:"index" json:"device_id"`
	UserID    string         `gorm:"index" json:"user_id"`
	Name      string         `json:"name"`
	Status    string         `json:"status"` //
	CreatedAt string         `json:"created_at"`
	UpdatedAt string         `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

func (dm *DeviceModule) BeforeCreate(tx *gorm.DB) (err error) {
	dm.ID = uuid.New().String()
	dm.CreatedAt = time.Now().Format(time.RFC3339)
	dm.UpdatedAt = dm.CreatedAt
	return
}
