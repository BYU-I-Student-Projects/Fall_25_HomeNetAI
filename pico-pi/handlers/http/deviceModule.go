package httpHandler

import (
	"iot-server/entities"
	"iot-server/usecases"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DeviceModuleHandler struct {
	useCase *usecases.DeviceUseCase
}

func NewDeviceModuleHandler(useCase *usecases.DeviceUseCase) *DeviceModuleHandler {
	return &DeviceModuleHandler{
		useCase: useCase,
	}
}

// CreateDeviceModule handles POST /api/v1/device-modules
func (h *DeviceModuleHandler) CreateDeviceModule(c *gin.Context) {
	var module entities.DeviceModule

	if err := c.ShouldBindJSON(&module); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	if err := h.useCase.CreateDeviceModule(&module); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Device module created successfully",
		"data":    module,
	})
}

// GetDeviceModule handles GET /api/v1/device-modules/:id
func (h *DeviceModuleHandler) GetDeviceModule(c *gin.Context) {
	id := c.Param("id")

	module, err := h.useCase.GetDeviceModule(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Device module not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": module,
	})
}

// GetAllDeviceModules handles GET /api/v1/device-modules
func (h *DeviceModuleHandler) GetAllDeviceModules(c *gin.Context) {
	modules, err := h.useCase.GetAllDeviceModules()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve device modules",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  modules,
		"count": len(modules),
	})
}

// GetDeviceModulesByUserID handles GET /api/v1/users/:user_id/device-modules
func (h *DeviceModuleHandler) GetDeviceModulesByUserID(c *gin.Context) {
	userID := c.Param("user_id")

	modules, err := h.useCase.GetDeviceModulesByUserID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  modules,
		"count": len(modules),
	})
}

// GetDeviceModulesByDeviceID handles GET /api/v1/devices/:device_id/modules
func (h *DeviceModuleHandler) GetDeviceModulesByDeviceID(c *gin.Context) {
	deviceID := c.Param("device_id")

	modules, err := h.useCase.GetDeviceModulesByDeviceID(deviceID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  modules,
		"count": len(modules),
	})
}

// UpdateDeviceModule handles PUT /api/v1/device-modules/:id
func (h *DeviceModuleHandler) UpdateDeviceModule(c *gin.Context) {
	id := c.Param("id")

	var module entities.DeviceModule
	if err := c.ShouldBindJSON(&module); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	module.ID = id

	if err := h.useCase.UpdateDeviceModule(&module); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Device module updated successfully",
		"data":    module,
	})
}

// DeleteDeviceModule handles DELETE /api/v1/device-modules/:id
func (h *DeviceModuleHandler) DeleteDeviceModule(c *gin.Context) {
	id := c.Param("id")

	if err := h.useCase.DeleteDeviceModule(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Device module deleted successfully",
	})
}

// GetDevicesByUserID handles GET /api/v1/users/:user_id/devices
func (h *DeviceModuleHandler) GetDevicesByUserID(c *gin.Context) {
	userID := c.Param("user_id")

	devices, err := h.useCase.GetDevicesByUserID(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  devices,
		"count": len(devices),
	})
}
