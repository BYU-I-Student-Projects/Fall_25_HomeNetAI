package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"iot-server/entities"
	"iot-server/services"
	"iot-server/usecases"
	"iot-server/ws"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// WebSocket message envelopes
type incomingMessage struct {
	Type string `json:"type"` // sensor_data | heartbeat | command_response
}

type sensorDataPayload struct {
	Type           string  `json:"type"`
	DeviceID       string  `json:"device_id"`
	DeviceModuleID string  `json:"device_module_id"`
	Timestamp      string  `json:"timestamp"`
	Temperature    float64 `json:"temperature"`
	Humidity       float64 `json:"humidity"`
}

type commandRequest struct {
	DeviceID       string                 `json:"device_id"`        // target device
	DeviceModuleID string                 `json:"device_module_id"` // target specific module
	Command        string                 `json:"command"`
	Params         map[string]interface{} `json:"params"`
}

// WSHandler groups dependencies for websocket flows
type WSHandler struct {
	mgr       *ws.Manager
	usecase   *usecases.DeviceUseCase
	processor *services.DataProcessor
}

func NewWSHandler(mgr *ws.Manager, uc *usecases.DeviceUseCase, processor *services.DataProcessor) *WSHandler {
	return &WSHandler{mgr: mgr, usecase: uc, processor: processor}
}

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

// HandleDeviceWS upgrades to websocket and reads messages from device
// GET /ws?id=<device_id>
func (h *WSHandler) HandleDeviceWS(c *gin.Context) {
	deviceID := c.Query("id")
	if deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing device id"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("websocket upgrade failed: %v", err)
		return
	}
	// Register connection
	h.mgr.Register(deviceID, conn)
	log.Printf("device connected: %s", deviceID)

	// Ensure cleanup on exit
	defer func() {
		h.mgr.Unregister(deviceID)
		log.Printf("device disconnected: %s", deviceID)
	}()

	for {
		// Read message type and bytes
		mt, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("device %s closed connection", deviceID)
			} else {
				log.Printf("read error from %s: %v", deviceID, err)
			}
			return
		}
		if mt != websocket.TextMessage {
			continue
		}

		// Peek type
		var base incomingMessage
		if err := json.Unmarshal(message, &base); err != nil {
			log.Printf("invalid json from %s: %v", deviceID, err)
			continue
		}

		switch base.Type {
		case "sensor_data":
			var payload sensorDataPayload
			if err := json.Unmarshal(message, &payload); err != nil {
				log.Printf("invalid sensor_data payload from %s: %v", deviceID, err)
				continue
			}
			// Build data entity
			data := &entities.DeviceData{
				DeviceID:       payload.DeviceID,
				DeviceModuleID: payload.DeviceModuleID,
				Timestamp:      payload.Timestamp,
				Temperature:    payload.Temperature,
				Humidity:       payload.Humidity,
			}
			// Always store into cache for batch processing with threshold rules
			if h.processor != nil {
				h.processor.AddDataPoint(*data)
				log.Printf("added data point to cache for device %s, module %s", payload.DeviceID, payload.DeviceModuleID)
			} else {
				log.Printf("WARNING: data processor not available, data might be lost")
			}
		case "heartbeat":
			// No-op, could update a last-seen cache
		case "command_response":
			// For now just log it; could persist to a commands table later
			log.Printf("command response from %s: %s", deviceID, string(message))
		default:
			log.Printf("unknown message type from %s: %s", deviceID, base.Type)
		}
	}
}

// SendCommandToDevice POST /api/v1/commands
// { "device_id": "<id>", "command": "LED_ON", "params": {"duration_ms": 500}}
func (h *WSHandler) SendCommandToDevice(c *gin.Context) {
	var req commandRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
		return
	}
	if req.DeviceID == "" || req.Command == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "device_id and command are required"})
		return
	}

	// Envelope to match Pico expectation
	cmd := map[string]interface{}{
		"type":             "command",
		"command_id":       time.Now().UTC().Format(time.RFC3339Nano),
		"device_module_id": req.DeviceModuleID,
		"command":          req.Command,
		"params":           req.Params,
		"timestamp":        time.Now().UTC().Format(time.RFC3339Nano),
	}
	b, _ := json.Marshal(cmd)

	if err := h.mgr.SendToDevice(req.DeviceID, b); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "device not connected", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "sent", "payload": cmd})
}

// GetConnectedDevices GET /api/v1/devices/connected
func (h *WSHandler) GetConnectedDevices(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"devices": h.mgr.List(), "count": len(h.mgr.List())})
}
