package services

import (
	"iot-server/cache"
	"iot-server/db"
	"iot-server/entities"
	"log"
	"time"
)

type DataProcessor struct {
	cache    *cache.DeviceCache
	database db.Database
	interval time.Duration
}

func NewDataProcessor(database db.Database, _ float64, _ float64) *DataProcessor {
	return &DataProcessor{
		cache:    cache.NewDeviceCache(),
		database: database,
		interval: 5 * time.Minute,
	}
}

func (dp *DataProcessor) Start() {
	ticker := time.NewTicker(dp.interval)
	go func() {
		for range ticker.C {
			dp.ProcessCachedData()
		}
	}()
}

func (dp *DataProcessor) ProcessCachedData() {
	raw := dp.cache.GetAllCachedData()
	var allData []entities.DeviceData
	for _, points := range raw {
		for _, p := range points {
			allData = append(allData, p.Data)
		}
	}
	if len(allData) == 0 {
		log.Printf("No cached data to process")
		return
	}
	if err := dp.database.GetDB().Create(&allData).Error; err != nil {
		log.Printf("Error bulk inserting %d data points: %v", len(allData), err)
	} else {
		log.Printf("Inserted %d cached data points (unfiltered)", len(allData))
	}
	dp.cache.ClearCache()
}

func (dp *DataProcessor) AddDataPoint(data entities.DeviceData) {
	dp.cache.AddDataPoint(data)
}

func (dp *DataProcessor) GetAllCachedData() map[string][]cache.DeviceDataPoint {
	return dp.cache.GetAllCachedData()
}

func (dp *DataProcessor) GetCacheStats() map[string]interface{} {
	return dp.cache.GetCacheStats()
}
