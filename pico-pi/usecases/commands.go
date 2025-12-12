package usecases

import (
	"encoding/json"
	"errors"
	"iot-server/entities"
	"iot-server/repositories"
)

type CommandsUseCase struct {
	repo repositories.CommandRepository
}

func NewCommandsUseCase(r repositories.CommandRepository) *CommandsUseCase {
	return &CommandsUseCase{repo: r}
}

func (uc *CommandsUseCase) Enqueue(deviceID, deviceModuleID, command string, params map[string]interface{}) (*entities.Command, error) {
	if deviceID == "" || command == "" {
		return nil, errors.New("device_id and command are required")
	}
	var paramsStr string
	if params != nil {
		b, _ := json.Marshal(params)
		paramsStr = string(b)
	} else {
		paramsStr = "{}"
	}
	cmd := &entities.Command{
		DeviceID:       deviceID,
		DeviceModuleID: deviceModuleID,
		Command:        command,
		Params:         paramsStr,
		Status:         "pending",
	}
	if err := uc.repo.Enqueue(cmd); err != nil {
		return nil, err
	}
	return cmd, nil
}

func (uc *CommandsUseCase) Poll(deviceID string, limit int) ([]entities.Command, error) {
	if deviceID == "" {
		return nil, errors.New("device_id required")
	}
	return uc.repo.GetPendingByDeviceID(deviceID, limit)
}

func (uc *CommandsUseCase) MarkSent(ids []string) error {
	return uc.repo.MarkSent(ids)
}

func (uc *CommandsUseCase) Ack(commandID, status, response string) error {
	if commandID == "" {
		return errors.New("command_id required")
	}
	if status == "" {
		status = "executed"
	}
	return uc.repo.UpdateStatus(commandID, status, response)
}
