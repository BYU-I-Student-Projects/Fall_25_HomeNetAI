package entities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Command struct {
	ID             string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	DeviceID       string         `json:"device_id" gorm:"index;type:varchar(36)"`
	DeviceModuleID string         `json:"device_module_id" gorm:"index;type:varchar(36)"` // NEW: target specific module
	Command        string         `json:"command" gorm:"type:varchar(128)"`
	Params         string         `json:"params" gorm:"type:text"`        // JSON string
	Status         string         `json:"status" gorm:"type:varchar(32)"` // pending, sent, executed, failed
	Response       string         `json:"response" gorm:"type:text"`      // optional response payload
	CreatedAt      string         `json:"created_at" gorm:"type:varchar(64)"`
	UpdatedAt      string         `json:"updated_at" gorm:"type:varchar(64)"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

func (c *Command) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	now := time.Now().UTC().Format(time.RFC3339)
	c.CreatedAt = now
	c.UpdatedAt = now
	if c.Status == "" {
		c.Status = "pending"
	}
	return nil
}
