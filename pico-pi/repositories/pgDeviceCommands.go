package repositories

import (
	"encoding/json"
	"time"

	"iot-server/db"
	"iot-server/entities"
)

type commandPgRepository struct {
	db db.Database
}

func NewCommandPgRepository(database db.Database) CommandRepository {
	return &commandPgRepository{db: database}
}

func (r *commandPgRepository) Enqueue(cmd *entities.Command) error {
	return r.db.GetDB().Create(cmd).Error
}

func (r *commandPgRepository) GetPendingByDeviceID(deviceID string, limit int) ([]entities.Command, error) {
	if limit <= 0 {
		limit = 10
	}
	var cmds []entities.Command
	err := r.db.GetDB().Where("device_id = ? AND status = ?", deviceID, "pending").Order("created_at ASC").Limit(limit).Find(&cmds).Error
	return cmds, err
}

func (r *commandPgRepository) MarkSent(ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	now := time.Now().UTC().Format(time.RFC3339)
	return r.db.GetDB().Model(&entities.Command{}).Where("id IN ?", ids).Updates(map[string]interface{}{
		"status":     "sent",
		"updated_at": now,
	}).Error
}

func (r *commandPgRepository) UpdateStatus(id, status, response string) error {
	now := time.Now().UTC().Format(time.RFC3339)
	updates := map[string]interface{}{
		"status":     status,
		"updated_at": now,
	}
	if response != "" {
		// ensure json string
		if !json.Valid([]byte(response)) {
			b, _ := json.Marshal(map[string]string{"message": response})
			response = string(b)
		}
		updates["response"] = response
	}
	return r.db.GetDB().Model(&entities.Command{}).Where("id = ?", id).Updates(updates).Error
}
