package main

import (
	"iot-server/confs"
	"iot-server/db"
	"iot-server/server"
	"log"
)

func main() {
	// load config
	err := confs.LoadConfig()
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
	}

	// connect to database Postgres
	database, err := db.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}

	log.Println("Using in-memory cache for device data")

	// run server
	serverDb := server.NewServer(database)
	serverDb.Start()
}
