package server

import (
	"iot-server/db"
	"iot-server/handlers"
	httpHandler "iot-server/handlers/http"
	"iot-server/repositories"
	"iot-server/services"
	"iot-server/usecases"
	"iot-server/ws"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Server struct {
	app *gin.Engine
	db  db.Database
}

func NewServer(database db.Database) *Server {
	return &Server{
		app: gin.Default(),
		db:  database,
	}
}

func (s *Server) Start() {
	// Setup CORS middleware
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true // Allow all origins for development
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	s.app.Use(cors.New(config))

	// Setup healthcheck route
	s.app.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "OK",
		})
	})

	// Initialize repositories
	deviceRepo := repositories.NewDevicePgRepository(s.db)
	deviceDataRepo := repositories.NewDeviceDataPgRepository(s.db)
	deviceModuleRepo := repositories.NewDeviceModulePgRepository(s.db)

	// Initialize use cases
	deviceUseCase := usecases.NewDeviceUseCase(deviceRepo, deviceDataRepo, deviceModuleRepo)
	commandsUseCase := usecases.NewCommandsUseCase(repositories.NewCommandPgRepository(s.db))

	// Initialize data processor (cache) without thresholds; store all cached points
	processor := services.NewDataProcessor(s.db, 0, 0)

	// Initialize handlers
	deviceHandler := httpHandler.NewDeviceHandler(deviceUseCase)
	deviceModuleHandler := httpHandler.NewDeviceModuleHandler(deviceUseCase)

	// WebSocket manager and handler
	manager := ws.NewManager()
	wsHandler := handlers.NewWSHandler(manager, deviceUseCase, processor)

	cmdHandler := httpHandler.NewCommandHandler(manager, commandsUseCase)
	cacheHandler := handlers.NewCacheHandler(processor)
	loginHandler := httpHandler.NewLoginHandler(s.db.GetDB())

	// Setup API routes
	api := s.app.Group("/api/v1")
	{
		// Device routes
		devices := api.Group("/devices")
		{
			devices.POST("", deviceHandler.CreateDevice)
			devices.GET("", deviceHandler.GetAllDevices)
			devices.GET("/:id/data", deviceHandler.GetDeviceDataByDeviceID)
			devices.GET("/:id/modules", deviceModuleHandler.GetDeviceModulesByDeviceID)
			devices.GET("/:id/commands", cmdHandler.GetDeviceCommands)         // Get pending commands for device
			devices.POST("/:id/change-wifi", cmdHandler.ChangeWiFiCredentials) // Change WiFi credentials
			devices.GET("/:id", deviceHandler.GetDevice)
			devices.PUT("/:id", deviceHandler.UpdateDevice)
			devices.DELETE("/:id", deviceHandler.DeleteDevice)
		}

		// Device data routes
		deviceData := api.Group("/device-data")
		{
			deviceData.POST("", deviceHandler.CreateDeviceData)
			deviceData.GET("", deviceHandler.GetAllDeviceData)
			deviceData.GET("/:id", deviceHandler.GetDeviceData)
			deviceData.PUT("/:id", deviceHandler.UpdateDeviceData)
			deviceData.DELETE("/:id", deviceHandler.DeleteDeviceData)
		}

		// Device module routes
		deviceModules := api.Group("/device-modules")
		{
			deviceModules.POST("", deviceModuleHandler.CreateDeviceModule)         // Create device module
			deviceModules.GET("", deviceModuleHandler.GetAllDeviceModules)         // Get all device modules
			deviceModules.GET("/:id", deviceModuleHandler.GetDeviceModule)         // Get device module by ID
			deviceModules.GET("/:id/latest", deviceModuleHandler.GetLatestReading) // Get latest reading for module
			deviceModules.PUT("/:id", deviceModuleHandler.UpdateDeviceModule)      // Update device module
			deviceModules.DELETE("/:id", deviceModuleHandler.DeleteDeviceModule)   // Delete device module
		}

		// User-specific routes
		users := api.Group("/users")
		{
			users.GET("/:user_id/devices", deviceModuleHandler.GetDevicesByUserID)              // Get all devices by user_id
			users.GET("/:user_id/device-modules", deviceModuleHandler.GetDeviceModulesByUserID) // Get all device modules by user_id
		}

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", loginHandler.Login) // Login endpoint for pico.exe
		}

		// Cache management endpoints
		cache := api.Group("/cache")
		{
			cache.POST("/process", cacheHandler.ProcessCache) // Trigger cache processing
			cache.GET("/data", cacheHandler.GetAllCachedData) // Get all cached data
			cache.GET("/stats", cacheHandler.GetCacheStats)   // Get cache statistics
		}

		// WebSocket-related HTTP endpoints
		api.POST("/commands", cmdHandler.Enqueue)                    // Enqueue and try WS send
		api.GET("/devices/connected", wsHandler.GetConnectedDevices) // List connected devices
		api.GET("/commands/poll", cmdHandler.Poll)                   // Devices fetch pending commands
		api.POST("/command-responses", cmdHandler.Ack)               // Devices acknowledge

	}

	s.app.GET("/ws", wsHandler.HandleDeviceWS)

	if err := s.app.Run("0.0.0.0:3536"); err != nil {
		panic(err)
	}
}
