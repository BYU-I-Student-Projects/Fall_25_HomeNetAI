package repositories

import (
	"iot-server/db"
	"iot-server/entities"
	"time"
)

type deviceDataPgRepository struct {
	db db.Database
}

func NewDeviceDataPgRepository(database db.Database) DeviceDataRepository {
	return &deviceDataPgRepository{db: database}
}

func (r *deviceDataPgRepository) Create(data *entities.DeviceData) error {
	return r.db.GetDB().Create(data).Error
}

func (r *deviceDataPgRepository) GetByID(id string) (*entities.DeviceData, error) {
	var data entities.DeviceData
	err := r.db.GetDB().Where("id = ?", id).First(&data).Error
	if err != nil {
		return nil, err
	}
	return &data, nil
}

func (r *deviceDataPgRepository) GetAll() ([]entities.DeviceData, error) {
	var data []entities.DeviceData
	err := r.db.GetDB().Order("created_at DESC").Find(&data).Error
	return data, err
}

func (r *deviceDataPgRepository) GetByDeviceID(deviceID string) ([]entities.DeviceData, error) {
	var data []entities.DeviceData
	err := r.db.GetDB().Where("device_id = ?", deviceID).Order("created_at DESC").Find(&data).Error
	return data, err
}

func (r *deviceDataPgRepository) Update(data *entities.DeviceData) error {
	data.UpdatedAt = time.Now().Format(time.RFC3339)
	return r.db.GetDB().Save(data).Error
}

func (r *deviceDataPgRepository) Delete(id string) error {
	return r.db.GetDB().Where("id = ?", id).Delete(&entities.DeviceData{}).Error
}
