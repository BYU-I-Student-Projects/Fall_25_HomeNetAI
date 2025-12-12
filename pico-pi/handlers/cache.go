package handlers

import (
	"iot-server/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CacheHandler struct {
	processor *services.DataProcessor
}

func NewCacheHandler(processor *services.DataProcessor) *CacheHandler {
	return &CacheHandler{
		processor: processor,
	}
}

func (h *CacheHandler) ProcessCache(c *gin.Context) {
	h.processor.ProcessCachedData()
	c.JSON(http.StatusOK, gin.H{"status": "processed"})
}

func (h *CacheHandler) GetAllCachedData(c *gin.Context) {
	allData := h.processor.GetAllCachedData()

	// Transform to a more JSON-friendly format
	result := make(map[string][]gin.H)
	totalPoints := 0

	for deviceID, dataPoints := range allData {
		deviceData := make([]gin.H, 0, len(dataPoints))
		for _, point := range dataPoints {
			deviceData = append(deviceData, gin.H{
				"device_id":        point.Data.DeviceID,
				"device_module_id": point.Data.DeviceModuleID,
				"data":             point.Data.Data,
				"timestamp":        point.Data.Timestamp,
				"cached_at":        point.Timestamp.Format("2006-01-02T15:04:05Z07:00"),
			})
			totalPoints++
		}
		result[deviceID] = deviceData
	}

	c.JSON(http.StatusOK, gin.H{
		"status":            "success",
		"total_devices":     len(result),
		"total_data_points": totalPoints,
		"cached_data":       result,
	})
}

func (h *CacheHandler) GetCacheStats(c *gin.Context) {
	stats := h.processor.GetCacheStats()
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"stats":  stats,
	})
}
