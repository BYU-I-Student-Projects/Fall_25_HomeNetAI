package ws

import (
	"errors"
	"sync"

	"github.com/gorilla/websocket"
)

// Manager keeps track of active device websocket connections.
type Manager struct {
	mu          sync.RWMutex
	connections map[string]*websocket.Conn // deviceID -> conn
}

func NewManager() *Manager {
	return &Manager{connections: make(map[string]*websocket.Conn)}
}

// Register registers a device connection, replacing any existing one.
func (m *Manager) Register(deviceID string, conn *websocket.Conn) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if old, ok := m.connections[deviceID]; ok && old != conn {
		// close old connection to avoid leaks
		_ = old.Close()
	}
	m.connections[deviceID] = conn
}

// Unregister removes a device connection.
func (m *Manager) Unregister(deviceID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if conn, ok := m.connections[deviceID]; ok {
		_ = conn.Close()
		delete(m.connections, deviceID)
	}
}

// SendToDevice sends a text message to a device if connected.
func (m *Manager) SendToDevice(deviceID string, payload []byte) error {
	m.mu.RLock()
	conn, ok := m.connections[deviceID]
	m.mu.RUnlock()
	if !ok || conn == nil {
		return errors.New("device not connected")
	}
	return conn.WriteMessage(websocket.TextMessage, payload)
}

// IsConnected returns whether a device is currently connected.
func (m *Manager) IsConnected(deviceID string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	_, ok := m.connections[deviceID]
	return ok
}

// List returns a copy of current connected device IDs.
func (m *Manager) List() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	ids := make([]string, 0, len(m.connections))
	for id := range m.connections {
		ids = append(ids, id)
	}
	return ids
}
