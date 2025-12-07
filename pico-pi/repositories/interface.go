package repositories

import "iot-server/entities"

type DeviceRepository interface {
	Create(device *entities.Device) error
	GetByID(id string) (*entities.Device, error)
	GetAll() ([]entities.Device, error)
	GetByUserID(userID string) ([]entities.Device, error)
	Update(device *entities.Device) error
	Delete(id string) error
}

type DeviceDataRepository interface {
	Create(data *entities.DeviceData) error
	GetByID(id string) (*entities.DeviceData, error)
	GetAll() ([]entities.DeviceData, error)
	GetByDeviceID(deviceID string) ([]entities.DeviceData, error)
	GetLatestByModuleID(moduleID string) (*entities.DeviceData, error)
	Update(data *entities.DeviceData) error
	Delete(id string) error
}

type DeviceModuleRepository interface {
	Create(module *entities.DeviceModule) error
	GetByID(id string) (*entities.DeviceModule, error)
	GetAll() ([]entities.DeviceModule, error)
	GetByUserID(userID string) ([]entities.DeviceModule, error)
	GetByDeviceID(deviceID string) ([]entities.DeviceModule, error)
	Update(module *entities.DeviceModule) error
	Delete(id string) error
}

type CommandRepository interface {
	Enqueue(cmd *entities.Command) error
	GetPendingByDeviceID(deviceID string, limit int) ([]entities.Command, error)
	MarkSent(ids []string) error
	UpdateStatus(id, status, response string) error
}
