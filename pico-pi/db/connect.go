package db

import (
	"fmt"
	"iot-server/entities"
	"log"
	"os"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect() (Database, error) {
	var dsn string

	// Check if DB_URL is provided (connection string)
	dbURL := os.Getenv("DB_URL")
	if dbURL != "" {
		// Render uses external database URLs, ensure SSL is enabled
		dsn = dbURL

		// If the URL doesn't have sslmode, add it for Render
		if !strings.Contains(dsn, "sslmode=") {
			if strings.Contains(dsn, "?") {
				dsn += "&sslmode=require"
			} else {
				dsn += "?sslmode=require"
			}
		}

		log.Println("Connecting to Render database using DB_URL...")
	} else {
		// Build DSN from individual parameters
		dbHost := os.Getenv("DB_HOST")
		dbPort := os.Getenv("DB_PORT")
		dbUser := os.Getenv("DB_USER")
		dbPassword := os.Getenv("DB_PASSWORD")
		dbName := os.Getenv("DB_NAME")

		if dbHost == "" || dbPort == "" || dbUser == "" || dbPassword == "" || dbName == "" {
			return nil, fmt.Errorf("missing required database configuration: DB_URL or (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)")
		}

		sslMode := "require"
		if dbHost == "localhost" || dbHost == "127.0.0.1" {
			sslMode = "disable"
		}

		dsn = fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
			dbHost, dbUser, dbPassword, dbName, dbPort, sslMode)
		log.Printf("Connecting to database using individual parameters (sslmode=%s)...", sslMode)
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:      logger.Default.LogMode(logger.Info),
		PrepareStmt: true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(0)

	log.Println("Database connection established successfully!")
	log.Println("Connection pool configured for cloud database")

	log.Println("Running database migrations...")
	if err := db.AutoMigrate(&entities.Device{}, &entities.DeviceData{}, &entities.DeviceModule{}, &entities.Command{}); err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database migrations completed successfully!")

	return &GormDatabase{DB: db}, nil
}
