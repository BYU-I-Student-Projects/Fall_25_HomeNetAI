package entities

// User represents a user in the HomeNetAI system
type User struct {
	ID           string `gorm:"type:text;primaryKey" json:"id"`
	Username     string `gorm:"unique;not null" json:"username"`
	Email        string `gorm:"unique;not null" json:"email"`
	PasswordHash string `gorm:"not null" json:"-"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}
