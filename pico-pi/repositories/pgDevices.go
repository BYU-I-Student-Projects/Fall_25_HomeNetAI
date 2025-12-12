package repositories

import (
	"iot-server/db"
	"iot-server/entities"
	"time"
)

type devicePgRepository struct {
	db db.Database
}

func NewDevicePgRepository(database db.Database) DeviceRepository {
	return &devicePgRepository{db: database}
}

func (r *devicePgRepository) Create(device *entities.Device) error {
	return r.db.GetDB().Create(device).Error
}

func (r *devicePgRepository) GetByID(id string) (*entities.Device, error) {
	var device entities.Device
	err := r.db.GetDB().Where("id = ?", id).First(&device).Error
	if err != nil {
		return nil, err
	}
	return &device, nil
}

func (r *devicePgRepository) GetAll() ([]entities.Device, error) {
	var devices []entities.Device
	err := r.db.GetDB().Find(&devices).Error
	return devices, err
}

func (r *devicePgRepository) GetByUserID(userID string) ([]entities.Device, error) {
	var devices []entities.Device
	err := r.db.GetDB().Where("user_id = ?", userID).Order("created_at DESC").Find(&devices).Error
	return devices, err
}

func (r *devicePgRepository) Update(device *entities.Device) error {
	device.UpdatedAt = time.Now().Format(time.RFC3339)
	return r.db.GetDB().Save(device).Error
}

func (r *devicePgRepository) Delete(id string) error {
	return r.db.GetDB().Where("id = ?", id).Delete(&entities.Device{}).Error
}
