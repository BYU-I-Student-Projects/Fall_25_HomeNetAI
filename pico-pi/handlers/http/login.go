package httpHandler

import (
	"crypto/sha256"
	"encoding/hex"
	"iot-server/entities"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type LoginHandler struct {
	db *gorm.DB
}

func NewLoginHandler(db *gorm.DB) *LoginHandler {
	return &LoginHandler{db: db}
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Success  bool   `json:"success"`
}

// hashPassword creates SHA-256 hash of password (matching Python backend)
func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

// Login authenticates user and returns user_id
func (h *LoginHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var user entities.User

	// Find user by username
	result := h.db.Where("username = ?", req.Username).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// Verify password hash
	hashedPassword := hashPassword(req.Password)
	if user.PasswordHash != hashedPassword {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// Return user_id
	c.JSON(http.StatusOK, LoginResponse{
		UserID:   user.ID,
		Username: user.Username,
		Success:  true,
	})
}
