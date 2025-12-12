package cache

import (
	"iot-server/entities"
	"sync"
	"time"
)

type DeviceDataPoint struct {
	Data      entities.DeviceData
	Timestamp time.Time
}

type DeviceCache struct {
	mu           sync.RWMutex
	deviceData   map[string][]DeviceDataPoint // map[deviceID][]dataPoints
	lastInserted map[string]entities.DeviceData
}

func NewDeviceCache() *DeviceCache {
	return &DeviceCache{
		deviceData:   make(map[string][]DeviceDataPoint),
		lastInserted: make(map[string]entities.DeviceData),
	}
}

// AddDataPoint adds a new data point to the cache
func (dc *DeviceCache) AddDataPoint(data entities.DeviceData) {
	dc.mu.Lock()
	defer dc.mu.Unlock()

	deviceID := data.DeviceID
	point := DeviceDataPoint{
		Data:      data,
		Timestamp: time.Now(),
	}

	// Initialize slice if this is the first data point for this device
	if _, exists := dc.deviceData[deviceID]; !exists {
		dc.deviceData[deviceID] = make([]DeviceDataPoint, 0)
	}

	dc.deviceData[deviceID] = append(dc.deviceData[deviceID], point)
}

// Removed threshold-based filtering; all cached points are considered

// GetAllCachedData returns all data points currently in cache
func (dc *DeviceCache) GetAllCachedData() map[string][]DeviceDataPoint {
	dc.mu.RLock()
	defer dc.mu.RUnlock()

	// Create a deep copy to avoid external modifications
	allData := make(map[string][]DeviceDataPoint)
	for deviceID, dataPoints := range dc.deviceData {
		allData[deviceID] = make([]DeviceDataPoint, len(dataPoints))
		copy(allData[deviceID], dataPoints)
	}

	return allData
}

// GetCacheStats returns statistics about the current cache
func (dc *DeviceCache) GetCacheStats() map[string]interface{} {
	dc.mu.RLock()
	defer dc.mu.RUnlock()

	totalPoints := 0
	deviceCount := len(dc.deviceData)

	for _, dataPoints := range dc.deviceData {
		totalPoints += len(dataPoints)
	}

	return map[string]interface{}{
		"total_devices":     deviceCount,
		"total_data_points": totalPoints,
		"filtering":         "none",
	}
}

// ClearCache clears the cached data after it's been processed
func (dc *DeviceCache) ClearCache() {
	dc.mu.Lock()
	defer dc.mu.Unlock()

	// Store last values before clearing
	for deviceID, dataPoints := range dc.deviceData {
		if len(dataPoints) > 0 {
			dc.lastInserted[deviceID] = dataPoints[len(dataPoints)-1].Data
		}
	}

	// Clear the cache
	dc.deviceData = make(map[string][]DeviceDataPoint)
}

// Threshold utility removed as no longer used
