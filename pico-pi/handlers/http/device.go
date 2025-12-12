package httpHandler

import (
	"iot-server/entities"
	"iot-server/usecases"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DeviceHandler struct {
	useCase *usecases.DeviceUseCase
}

func NewDeviceHandler(useCase *usecases.DeviceUseCase) *DeviceHandler {
	return &DeviceHandler{
		useCase: useCase,
	}
}

// CreateDevice handles POST /api/v1/devices
func (h *DeviceHandler) CreateDevice(c *gin.Context) {
	var device entities.Device

	if err := c.ShouldBindJSON(&device); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	if err := h.useCase.CreateDevice(&device); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Device created successfully",
		"data":    device,
	})
}

// GetDevice handles GET /api/v1/devices/:id
func (h *DeviceHandler) GetDevice(c *gin.Context) {
	id := c.Param("id")

	device, err := h.useCase.GetDevice(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Device not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": device,
	})
}

// GetAllDevices handles GET /api/v1/devices
func (h *DeviceHandler) GetAllDevices(c *gin.Context) {
	devices, err := h.useCase.GetAllDevices()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve devices",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  devices,
		"count": len(devices),
	})
}

// UpdateDevice handles PUT /api/v1/devices/:id
func (h *DeviceHandler) UpdateDevice(c *gin.Context) {
	id := c.Param("id")

	var device entities.Device
	if err := c.ShouldBindJSON(&device); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	device.ID = id

	if err := h.useCase.UpdateDevice(&device); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Device updated successfully",
		"data":    device,
	})
}

// DeleteDevice handles DELETE /api/v1/devices/:id
func (h *DeviceHandler) DeleteDevice(c *gin.Context) {
	id := c.Param("id")

	if err := h.useCase.DeleteDevice(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Device deleted successfully",
	})
}
