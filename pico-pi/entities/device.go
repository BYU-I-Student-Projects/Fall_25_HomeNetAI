package entities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Device struct {
	ID        string         `gorm:"primaryKey" json:"id"`
	Name      string         `json:"name"`
	Type      string         `json:"type"`
	UserID    string         `json:"user_id"`
	CreatedAt string         `json:"created_at"`
	UpdatedAt string         `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	Status    string         `json:"status"`
}

func (d *Device) BeforeCreate(tx *gorm.DB) (err error) {
	d.ID = uuid.New().String()
	d.CreatedAt = time.Now().Format(time.RFC3339)
	d.UpdatedAt = d.CreatedAt
	return
}
