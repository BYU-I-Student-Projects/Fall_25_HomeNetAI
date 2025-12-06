package db

import "gorm.io/gorm"

type Database interface {
	GetDB() *gorm.DB
}

type GormDatabase struct {
	DB *gorm.DB
}

func (g *GormDatabase) GetDB() *gorm.DB { return g.DB }
