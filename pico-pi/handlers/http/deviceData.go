package httpHandler

import (
	"iot-server/entities"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *DeviceHandler) CreateDeviceData(c *gin.Context) {
	var data entities.DeviceData

	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	if err := h.useCase.CreateDeviceData(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Device data created successfully",
		"data":    data,
	})
}

func (h *DeviceHandler) GetDeviceData(c *gin.Context) {
	id := c.Param("id")

	data, err := h.useCase.GetDeviceData(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Device data not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": data,
	})
}

func (h *DeviceHandler) GetAllDeviceData(c *gin.Context) {
	data, err := h.useCase.GetAllDeviceData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve device data",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  data,
		"count": len(data),
	})
}

func (h *DeviceHandler) GetDeviceDataByDeviceID(c *gin.Context) {
	deviceID := c.Param("id")

	data, err := h.useCase.GetDeviceDataByDeviceID(deviceID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  data,
		"count": len(data),
	})
}

func (h *DeviceHandler) UpdateDeviceData(c *gin.Context) {
	id := c.Param("id")

	var data entities.DeviceData
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	data.ID = id

	if err := h.useCase.UpdateDeviceData(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Device data updated successfully",
		"data":    data,
	})
}

func (h *DeviceHandler) DeleteDeviceData(c *gin.Context) {
	id := c.Param("id")

	if err := h.useCase.DeleteDeviceData(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Device data deleted successfully",
	})
}
