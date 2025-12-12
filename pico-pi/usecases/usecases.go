package usecases

import (
	"errors"
	"iot-server/entities"
	"iot-server/repositories"
)

type DeviceUseCase struct {
	DeviceRepo       repositories.DeviceRepository
	DeviceDataRepo   repositories.DeviceDataRepository
	DeviceModuleRepo repositories.DeviceModuleRepository
}

func NewDeviceUseCase(deviceRepo repositories.DeviceRepository, deviceDataRepo repositories.DeviceDataRepository, deviceModuleRepo repositories.DeviceModuleRepository) *DeviceUseCase {
	return &DeviceUseCase{
		DeviceRepo:       deviceRepo,
		DeviceDataRepo:   deviceDataRepo,
		DeviceModuleRepo: deviceModuleRepo,
	}
}

func (uc *DeviceUseCase) CreateDevice(device *entities.Device) error {
	if device.Name == "" {
		return errors.New("device name is required")
	}
	if device.Type == "" {
		return errors.New("device type is required")
	}
	return uc.DeviceRepo.Create(device)
}

func (uc *DeviceUseCase) GetDevice(id string) (*entities.Device, error) {
	if id == "" {
		return nil, errors.New("device id is required")
	}
	return uc.DeviceRepo.GetByID(id)
}

func (uc *DeviceUseCase) GetAllDevices() ([]entities.Device, error) {
	return uc.DeviceRepo.GetAll()
}

func (uc *DeviceUseCase) UpdateDevice(device *entities.Device) error {
	if device.ID == "" {
		return errors.New("device id is required")
	}

	existing, err := uc.DeviceRepo.GetByID(device.ID)
	if err != nil {
		return errors.New("device not found")
	}

	if device.Name != "" {
		existing.Name = device.Name
	}
	if device.Type != "" {
		existing.Type = device.Type
	}
	if device.Status != "" {
		existing.Status = device.Status
	}

	return uc.DeviceRepo.Update(existing)
}

func (uc *DeviceUseCase) DeleteDevice(id string) error {
	if id == "" {
		return errors.New("device id is required")
	}

	_, err := uc.DeviceRepo.GetByID(id)
	if err != nil {
		return errors.New("device not found")
	}

	return uc.DeviceRepo.Delete(id)
}

// ============= DeviceData Use Cases =============

func (uc *DeviceUseCase) CreateDeviceData(data *entities.DeviceData) error {
	if data.DeviceID == "" {
		return errors.New("device_id is required")
	}

	_, err := uc.DeviceRepo.GetByID(data.DeviceID)
	if err != nil {
		return errors.New("device not found")
	}

	return uc.DeviceDataRepo.Create(data)
}

func (uc *DeviceUseCase) GetDeviceData(id string) (*entities.DeviceData, error) {
	if id == "" {
		return nil, errors.New("data id is required")
	}
	return uc.DeviceDataRepo.GetByID(id)
}

func (uc *DeviceUseCase) GetAllDeviceData() ([]entities.DeviceData, error) {
	return uc.DeviceDataRepo.GetAll()
}

func (uc *DeviceUseCase) GetDeviceDataByDeviceID(deviceID string) ([]entities.DeviceData, error) {
	if deviceID == "" {
		return nil, errors.New("device_id is required")
	}
	return uc.DeviceDataRepo.GetByDeviceID(deviceID)
}

func (uc *DeviceUseCase) GetLatestDeviceDataByModuleID(moduleID string) (*entities.DeviceData, error) {
	if moduleID == "" {
		return nil, errors.New("module_id is required")
	}
	return uc.DeviceDataRepo.GetLatestByModuleID(moduleID)
}

func (uc *DeviceUseCase) UpdateDeviceData(data *entities.DeviceData) error {
	if data.ID == "" {
		return errors.New("data id is required")
	}

	existing, err := uc.DeviceDataRepo.GetByID(data.ID)
	if err != nil {
		return errors.New("device data not found")
	}

	if data.Data != "" {
		existing.Data = data.Data
	}
	if data.Timestamp != "" {
		existing.Timestamp = data.Timestamp
	}

	return uc.DeviceDataRepo.Update(existing)
}

func (uc *DeviceUseCase) DeleteDeviceData(id string) error {
	if id == "" {
		return errors.New("data id is required")
	}

	_, err := uc.DeviceDataRepo.GetByID(id)
	if err != nil {
		return errors.New("device data not found")
	}

	return uc.DeviceDataRepo.Delete(id)
}

func (uc *DeviceUseCase) GetDevicesByUserID(userID string) ([]entities.Device, error) {
	if userID == "" {
		return nil, errors.New("user_id is required")
	}
	return uc.DeviceRepo.GetByUserID(userID)
}

// ============= DeviceModule Use Cases =============

func (uc *DeviceUseCase) CreateDeviceModule(module *entities.DeviceModule) error {
	if module.DeviceID == "" {
		return errors.New("device_id is required")
	}
	if module.UserID == "" {
		return errors.New("user_id is required")
	}

	_, err := uc.DeviceRepo.GetByID(module.DeviceID)
	if err != nil {
		return errors.New("device not found")
	}

	return uc.DeviceModuleRepo.Create(module)
}

func (uc *DeviceUseCase) GetDeviceModule(id string) (*entities.DeviceModule, error) {
	if id == "" {
		return nil, errors.New("module id is required")
	}
	return uc.DeviceModuleRepo.GetByID(id)
}

func (uc *DeviceUseCase) GetAllDeviceModules() ([]entities.DeviceModule, error) {
	return uc.DeviceModuleRepo.GetAll()
}

func (uc *DeviceUseCase) GetDeviceModulesByUserID(userID string) ([]entities.DeviceModule, error) {
	if userID == "" {
		return nil, errors.New("user_id is required")
	}
	return uc.DeviceModuleRepo.GetByUserID(userID)
}

func (uc *DeviceUseCase) GetDeviceModulesByDeviceID(deviceID string) ([]entities.DeviceModule, error) {
	if deviceID == "" {
		return nil, errors.New("device_id is required")
	}
	return uc.DeviceModuleRepo.GetByDeviceID(deviceID)
}

func (uc *DeviceUseCase) UpdateDeviceModule(module *entities.DeviceModule) error {
	if module.ID == "" {
		return errors.New("module id is required")
	}

	existing, err := uc.DeviceModuleRepo.GetByID(module.ID)
	if err != nil {
		return errors.New("device module not found")
	}

	if module.Name != "" {
		existing.Name = module.Name
	}
	if module.DeviceID != "" {
		existing.DeviceID = module.DeviceID
	}
	if module.UserID != "" {
		existing.UserID = module.UserID
	}

	return uc.DeviceModuleRepo.Update(existing)
}

func (uc *DeviceUseCase) DeleteDeviceModule(id string) error {
	if id == "" {
		return errors.New("module id is required")
	}
	_, err := uc.DeviceModuleRepo.GetByID(id)
	if err != nil {
		return errors.New("device module not found")
	}

	return uc.DeviceModuleRepo.Delete(id)
}
