package confs

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// LoadConfig loads environment variables from a .env file if present
// and validates essential settings when needed.
func LoadConfig() error {
	// Load .env if it exists; ignore error if file not found
	if err := godotenv.Load(); err != nil {
		// Only log when the file truly doesn't exist; not an error for runtime
		if !os.IsNotExist(err) {
			log.Printf("warning: could not load .env: %v", err)
		}
	}
	return nil
}
