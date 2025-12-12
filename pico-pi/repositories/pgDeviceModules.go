package repositories

import (
	"iot-server/db"
	"iot-server/entities"
	"time"
)

type deviceModulePgRepository struct {
	db db.Database
}

func NewDeviceModulePgRepository(database db.Database) DeviceModuleRepository {
	return &deviceModulePgRepository{db: database}
}

func (r *deviceModulePgRepository) Create(module *entities.DeviceModule) error {
	return r.db.GetDB().Create(module).Error
}

func (r *deviceModulePgRepository) GetByID(id string) (*entities.DeviceModule, error) {
	var module entities.DeviceModule
	err := r.db.GetDB().Where("id = ?", id).First(&module).Error
	if err != nil {
		return nil, err
	}
	return &module, nil
}

func (r *deviceModulePgRepository) GetAll() ([]entities.DeviceModule, error) {
	var modules []entities.DeviceModule
	err := r.db.GetDB().Order("created_at DESC").Find(&modules).Error
	return modules, err
}

func (r *deviceModulePgRepository) GetByUserID(userID string) ([]entities.DeviceModule, error) {
	var modules []entities.DeviceModule
	err := r.db.GetDB().Where("user_id = ?", userID).Order("created_at DESC").Find(&modules).Error
	return modules, err
}

func (r *deviceModulePgRepository) GetByDeviceID(deviceID string) ([]entities.DeviceModule, error) {
	var modules []entities.DeviceModule
	err := r.db.GetDB().Where("device_id = ?", deviceID).Order("created_at DESC").Find(&modules).Error
	return modules, err
}

func (r *deviceModulePgRepository) Update(module *entities.DeviceModule) error {
	module.UpdatedAt = time.Now().Format(time.RFC3339)
	return r.db.GetDB().Save(module).Error
}

func (r *deviceModulePgRepository) Delete(id string) error {
	return r.db.GetDB().Where("id = ?", id).Delete(&entities.DeviceModule{}).Error
}
